import { pageAttributes as page } from './page-attributes';
import { login } from './oauth';
import { publishResize } from './bus';
import {
  Issue,
  IssueComment,
  User,
  postComment,
  createIssue,
  loadIssuesByType,
  loadUser
} from './github';
import { NewIssueComponent } from './new-issue-component';
import { IssueComponent } from './issue-component';

export class FeedbackComponent {
  public readonly element: HTMLElement;
  private openedTab: HTMLAnchorElement;
  private closedTab: HTMLAnchorElement;
  private issuesBox: HTMLElement;

  private newIssueComponent: NewIssueComponent;
  private issueComponents: IssueComponent[] = [];

  constructor(
    private _user: User | null
  ) {
    let openIssuesTabName: string = 'open';
    let closedIssuesTabName: string = 'closed';

    this.element = document.createElement('div');
    this.element.classList.add('feedback-container');
    this.element.innerHTML = `
      <div id="newIssueFormContainer"></div>
      <div class="tabnav">
        <nav class="tabnav-tabs">
          <a id="openedTab" link="#" class="tabnav-tab selected" tabname="${openIssuesTabName}"><span id="openTabIssueCount" class="text-bold"></span> Open</a>
          <a id="closedTab" link="#" class="tabnav-tab" tabname="${closedIssuesTabName}"><span id="closedTabIssueCount" class="text-bold"></span> Closed</a>
        </nav>
      </div>
      <div id="issuesBox" class="Box issues-box">
        <div class="spinner">
          <div class="bounce1"></div>
          <div class="bounce2"></div>
          <div class="bounce3"></div>
        </div>
      </div>
    `;

    const setIssuesFn = this.setIssues.bind(this);

    const newIssueSubmit = (title: string, description: string): Promise<void> => {
      if (this._user) {
        let commentPromise: Promise<IssueComment>;
        commentPromise = createIssue(
          title,
          page.url,
          title,
          page.description
        ).then(newIssue => {
          return postComment(newIssue.number, description);
        });

        return commentPromise.then(() => {
          this.newIssueComponent.clear();
          closedTab.classList.remove('selected');
          openedTab.classList.add('selected');
          loadIssuesByType(page.issueTerm as string, "open").then(issues => {
            setIssuesFn(issues);
          });
        });
      }

      return login().then(() => loadUser()).then(u => {
        this._user = u;
        this.newIssueComponent.setUser(this._user);

        this.issueComponents.forEach(component => {
          component.setUser(u as User);
        });
      });
    };

    const newIssueFormContainer = this.element.querySelector('#newIssueFormContainer') as HTMLElement;
    this.newIssueComponent = new NewIssueComponent(this._user, newIssueSubmit);
    newIssueFormContainer.appendChild(this.newIssueComponent.element);

    this.issuesBox = this.element.querySelector('#issuesBox') as HTMLElement;
    const openedTab = this.openedTab = this.element.querySelector('#openedTab') as HTMLAnchorElement;
    const closedTab = this.closedTab = this.element.querySelector('#closedTab') as HTMLAnchorElement;

    this.openedTab.addEventListener('click', this.handleTabClick.bind(this));
    this.closedTab.addEventListener('click', this.handleTabClick.bind(this));

    loadIssuesByType(page.issueTerm as string, "open").then((issues: Issue[] | null) => {
      const issueCountElt = openedTab.querySelector('#openTabIssueCount');
      const count = issues ? issues.length : 0;
      issueCountElt!.textContent = `${count}`;
      this.setIssues(issues);
    });

    this.issuesBox.addEventListener('user-changed', event => {
      let user: User = event.detail as User;

      this.newIssueComponent.setUser(user);

      this.issueComponents.forEach(component => {
        component.setUser(user);
      });

    });
  }

  private handleTabClick(event: MouseEvent): void {
    var target = event.target as HTMLAnchorElement;
    var prevSelected = target!.parentElement!.querySelector('.selected');
    prevSelected!.classList.remove('selected');
    target.classList.add('selected');

    this.issuesBox.innerHTML = `<div class="spinner">
    <div class="bounce1"></div>
    <div class="bounce2"></div>
    <div class="bounce3"></div>
  </div>`;
    publishResize();

    let tabName = target.getAttribute('tabname') as string;
    loadIssuesByType(page.issueTerm as string, tabName).then((issues: Issue[] | null) => {
      const issueCountElt = target.querySelector(`#${tabName}TabIssueCount`);
      const count = issues ? issues.length : 0;
      issueCountElt!.textContent = `${count}`;
      this.setIssues(issues);
    });
  }

  setIssues(issues: Issue[] | null): void {
    let issuesBox = this.issuesBox;
    // @CLEANUP what about event listeners ???
    issuesBox.innerHTML = '';
    this.issueComponents = [];

    if (!issues) {
      // display info message
      const noIssuesElt = document.createElement('div');
      noIssuesElt.classList.add('no-issues');
      noIssuesElt.textContent = `No issues`;
      issuesBox.appendChild(noIssuesElt);
      publishResize();
      return;
    }

    issues.forEach(issue => {
      let component = new IssueComponent(issue, this._user);
      issuesBox.appendChild(component.element);
      this.issueComponents.push(component);
    });

    publishResize();
  }
}
