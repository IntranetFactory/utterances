import { pageAttributes as page } from './page-attributes';
import { publishResize } from './bus';
import {
  User, Issue, IssueComment, createIssue, postComment, loadUser, loadCommentsPage
} from './github'
import { login } from './oauth';
import { TimelineComponent } from './timeline-component';
import { NewCommentComponent } from './new-comment-component';

declare var window: any;

export class IssueComponent {
  public readonly element: HTMLElement;
  private timelineComponent: TimelineComponent | null;
  private newCommentComponent: NewCommentComponent | null;
  private rightArrow: HTMLElement;
  private downArrow: HTMLElement;
  private commentCount: Number;

  constructor(issue: Issue, user: User | null) {
    let commentCount = this.commentCount = issue.comments;
    let ago = window["moment"](issue.created_at).fromNow();
    this.element = document.createElement('div');
    this.element.classList.add('Box-row');
    this.element.innerHTML = `
      <div class="issue-box">
        <div class="arrow arrow-right"></div>
        <div class="arrow arrow-down" hidden></div>
        <div class="issue-title"><span class="issue-title-text">${issue.title}</span></div>
        <a id="viewInGithub" hidden class="view-in-github-box" target="_blank" href="${issue.html_url}">View in github</a>
        <div class="issue-comment-count">${commentCount}</div>
      </div>
    `;

    const rightArrow = this.rightArrow = this.element.querySelector(".arrow-right") as HTMLElement;
    const downArrow = this.downArrow = this.element.querySelector(".arrow-down") as HTMLElement;
    const commentCountElt = this.element.querySelector('.issue-comment-count') as HTMLElement;
    const issueTitleText = this.element.querySelector('.issue-title-text') as HTMLElement;
    const viewInGithub = this.element.querySelector('#viewInGithub') as HTMLElement;

    const toggleHidden = (): void => {
      let isOpen = rightArrow.hasAttribute('hidden');
      if (isOpen) {
        rightArrow.removeAttribute('hidden');
        downArrow.setAttribute('hidden', '');
        timeline.element.setAttribute('hidden', '');
        newCommentComponent.element.setAttribute('hidden', '');
        viewInGithub.setAttribute('hidden', '');

      } else {
        rightArrow.setAttribute('hidden', '');
        downArrow.removeAttribute('hidden');
        timeline.element.removeAttribute('hidden');
        newCommentComponent.element.removeAttribute('hidden');
        viewInGithub.removeAttribute('hidden');
      }

      publishResize();
    }

    rightArrow.addEventListener('click', toggleHidden);
    downArrow.addEventListener('click', toggleHidden);

    commentCountElt.addEventListener('click', toggleHidden);
    issueTitleText.addEventListener('click', toggleHidden);

    if (issue && issue.comments > 0) {
      loadCommentsPage(issue.number, 1).then(commentsPage => {
        commentsPage.items.forEach(item => {
          timeline.appendComment(item);
        });
      });
    }
    const timeline = this.timelineComponent = new TimelineComponent(user);
    timeline.element.setAttribute('hidden', '');
    this.element.appendChild(this.timelineComponent.element);

    const submit = (markdown: string) => {
      if (user) {
        let commentPromise: Promise<IssueComment>;
        if (issue) {
          commentPromise = postComment(issue.number, markdown);
        } else {
          commentPromise = createIssue(
            page.issueTerm as string,
            page.url,
            page.title,
            page.description
          ).then(newIssue => {
            issue = newIssue;
            return postComment(issue.number, markdown);
          });
        }
        return commentPromise.then(comment => {
          timeline.appendComment(comment);
          ++commentCount;
          commentCountElt!.textContent = commentCount + '';
          newCommentComponent.clear();
        });
      }

      return login().then(() => loadUser()).then(u => {
        user = u;
        timeline.setUser(user);
        newCommentComponent.setUser(user);
        this.element.dispatchEvent(new CustomEvent<User>('user-changed', { detail: user as User, bubbles: true }));
      });
    };

    const newCommentComponent = this.newCommentComponent = new NewCommentComponent(user, submit);
    newCommentComponent.element.setAttribute('hidden', '');
    this.element.appendChild(newCommentComponent.element);

    const issueSub = document.createElement('div');
    issueSub.classList.add('issue-sub');
    issueSub.innerHTML = `<a target="_blank" href="${issue.html_url}">#${issue.number}</a> opened ${ago} by <a target="_blank" href="${issue.user.html_url}">${issue.user.login}</a>`;
    this.element.appendChild(issueSub);
  }

  setUser(user: User) {
    this.newCommentComponent!.setUser(user);
    this.timelineComponent!.setUser(user);
  }
}
