import { pageAttributes as page } from './page-attributes';
import { publishResize } from './bus';
import {
  User, Issue, IssueComment, createIssue, postComment, loadUser, loadCommentsPage, loadIssueCreator
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
        <a id="viewInGithub" hidden class="view-in-github-box" target="_blank" href="${issue.html_url}">View in Github</a>
        <div class="comment-count-container">
          <span class="comment-icon">
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 50 50" version="1.1" fill="#333333" width="50px" height="50px">
              <g id="surface1" fill="#333333"><path style=" " d="M 7 4 C 4.253906 4 2 6.253906 2 9 L 2 33 C 2 35.746094 4.253906 38 7 38 L 11.09375 38 C 11.230469 39.203125 11.214844 40.316406 10.90625 41.25 C 10.527344 42.398438 9.820313 43.363281 8.5 44.15625 C 8.128906 44.390625 7.957031 44.839844 8.070313 45.261719 C 8.183594 45.683594 8.5625 45.984375 9 46 C 13.242188 46 18.105469 43.785156 20.5625 38 L 43 38 C 45.746094 38 48 35.746094 48 33 L 48 9 C 48 6.253906 45.746094 4 43 4 Z M 7 6 L 43 6 C 44.65625 6 46 7.34375 46 9 L 46 33 C 46 34.65625 44.65625 36 43 36 L 20 36 C 19.582031 36 19.207031 36.261719 19.0625 36.65625 C 17.507813 40.898438 14.730469 42.917969 11.84375 43.65625 C 12.234375 43.097656 12.605469 42.507813 12.8125 41.875 C 13.332031 40.296875 13.289063 38.570313 12.96875 36.8125 C 12.878906 36.347656 12.476563 36.007813 12 36 L 7 36 C 5.34375 36 4 34.65625 4 33 L 4 9 C 4 7.34375 5.34375 6 7 6 Z " fill="#333333"/></g>
            </svg>
          </span>
          <span class="count-text">${commentCount}</span>
        </div>
      </div>
    `;

    const rightArrow = this.rightArrow = this.element.querySelector(".arrow-right") as HTMLElement;
    const downArrow = this.downArrow = this.element.querySelector(".arrow-down") as HTMLElement;
    const commentCountContainer = this.element.querySelector('.comment-count-container') as HTMLElement;
    const commentCountElt = this.element.querySelector('.count-text') as HTMLElement;
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

    commentCountContainer.addEventListener('click', toggleHidden);
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
            page.description,
            user
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
    issueSub.innerHTML = `
      <div class="spinner spinner-size-21">
        <div class="bounce1"></div>
        <div class="bounce2"></div>
        <div class="bounce3"></div>
      </div>`;
    this.element.appendChild(issueSub);

    loadIssueCreator(issue.number).then(user => {
      if (user) {
        issueSub.innerHTML = `<a target="_blank" href="${issue.html_url}">#${issue.number}</a> opened ${ago} by <a target="_blank" href="${user.html_url}">${user.login}</a>`;
      } else {
        issueSub.innerHTML = `<a target="_blank" href="${issue.html_url}">#${issue.number}</a> opened ${ago} by <a target="_blank" href="${issue.user.html_url}">${issue.user.login}</a>`;
      }
    });
  }

  setUser(user: User) {
    this.newCommentComponent!.setUser(user);
    this.timelineComponent!.setUser(user);
  }
}
