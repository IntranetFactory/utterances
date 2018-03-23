import { pageAttributes as page } from './page-attributes';
import {
  Issue,
  IssueComment,
  User,
  postComment,
  createIssue,
  loadCommentsPage,
  loadUser
} from './github';
import { login } from './oauth';
import { TimelineComponent } from './timeline-component';
import { NewCommentComponent } from './new-comment-component';
import { publishResize } from './bus';

export class FeedbackComponent {
  public readonly element: HTMLElement;
  private openedTab: HTMLAnchorElement;
  private closedTab: HTMLAnchorElement;
  private issuesBox: HTMLElement;
  private user: User|null;

  private readonly tabChangedCallback: (tabName: string|null) => void
  constructor(
    tabChanged: (tabName: string|null) => void,
    user: User|null
  ) {
    this.tabChangedCallback = tabChanged;
    this.user = user;

    let openIssuesTabName: string = 'open';
    let closedIssuesTabName: string = 'closed';

    this.element = document.createElement('div');
    this.element.classList.add('feedback-container');
    this.element.innerHTML = `
      <div class="tabnav">
        <nav class="tabnav-tabs">
          <a link="#" class="tabnav-tab selected" tabname="${openIssuesTabName}">Open</a>
          <a link="#" class="tabnav-tab" tabname="${closedIssuesTabName}">Closed</a>
        </nav>
      </div>
      <div class="Box issues-box"></div>
    `;

    this.issuesBox = this.element.firstElementChild!.nextElementSibling as HTMLElement;

    this.openedTab = this.element.firstElementChild!.firstElementChild!.firstElementChild as HTMLAnchorElement;
    this.closedTab = this.openedTab!.nextElementSibling as HTMLAnchorElement;

    this.openedTab.addEventListener('click', this.handleTabClick.bind(this));
    this.closedTab.addEventListener('click', this.handleTabClick.bind(this));
  }

  private handleTabClick(event: MouseEvent): void {
    var target = event.target as HTMLAnchorElement;
    var prevSelected = target!.parentElement!.querySelector('.selected');
    prevSelected!.classList.remove('selected');
    target.classList.add('selected');

    this.tabChangedCallback(target.getAttribute('tabname'));
  }

  setIssues(issues: Issue[] | null): void {
    let issuesBox = this.issuesBox;
    // @CLEANUP what about event listeners ???
    issuesBox.innerHTML = '';

    if (!issues) {
      // display info message
      issuesBox.innerHTML = `No issues`;
      return;
    }

    issues.forEach(function(issue) {
      let component = new IssueComponent(issue, this.user);
      issuesBox.appendChild(component.element);
    }, this);
  }

}

export class IssueComponent {
  public readonly element: HTMLElement;
  private readonly issue: Issue;
  private timelineComponent : TimelineComponent|null;
  private newCommentComponent : NewCommentComponent|null;
  private rightArrow: HTMLElement;
  private downArrow: HTMLElement;
  private commentCount: Number;

  constructor(issue: Issue, user: User|null) {
    this.issue = issue;
    let commentCount = this.commentCount = issue.comments;

    this.element = document.createElement('div');
    // this.element.classList.add('Box-row');
    // this.element.classList.add('issue-box');
    this.element.innerHTML = `
      <div class="Box-row issue-box">
        <div class="arrow arrow-right">&#707;</div>
        <div class="arrow arrow-down" hidden>&#709;</div>
        <div class="issue-title"><span class="issue-title-text">${issue.title}</span></div>
        <div class="issue-comment-count">${commentCount} comments</div>
      </div>
    `;

    const rightArrow = this.rightArrow = this.element.firstElementChild!.firstElementChild as HTMLElement;
    const downArrow = this.downArrow = this.rightArrow!.nextElementSibling as HTMLElement;
    const commentCountElt = this.element.querySelector('.issue-comment-count');

    this.rightArrow.addEventListener('click', function(event) {
      var target = event.target as HTMLElement;
      target.setAttribute('hidden', '');

      downArrow.removeAttribute('hidden');
      timeline.element.removeAttribute('hidden');
      newCommentComponent.element.removeAttribute('hidden');
      publishResize();
    });

    downArrow.addEventListener('click', function(event) {
      var target = event.target as HTMLElement;
      target.setAttribute('hidden', '');

      rightArrow.removeAttribute('hidden');

      timeline.element.setAttribute('hidden', '');
      newCommentComponent.element.setAttribute('hidden', '');
      publishResize();
    });

    if (issue && issue.comments > 0) {
      loadCommentsPage(issue.number, 1).then(({ items }) => timeline.replaceComments(items));
    }
    const timeline = this.timelineComponent = new TimelineComponent(user, issue);
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
            timeline.setIssue(issue);
            return postComment(issue.number, markdown);
          });
        }
        return commentPromise.then(comment => {
          timeline.appendComment(comment);
          ++commentCount;
          commentCountElt!.textContent = `${commentCount} comments`;
          newCommentComponent.clear();
        });
      }

      return login().then(() => loadUser()).then(u => {
        user = u;
        timeline.setUser(user);
        newCommentComponent.setUser(user);
      });
    };

    const newCommentComponent = this.newCommentComponent = new NewCommentComponent(user, submit);
    newCommentComponent.element.setAttribute('hidden', '');
    this.element.appendChild(newCommentComponent.element);
  }
}
