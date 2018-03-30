import { pageAttributes as page } from './page-attributes';
import {
  Issue,
  IssueComment,
  User,
  postComment,
  createIssue,
  loadCommentsPage,
  loadIssuesByType,
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
  private user: User | null;

  private readonly tabChangedCallback: (tabName: string | null) => void
  constructor(
    tabChanged: (tabName: string | null) => void,
    user: User | null
  ) {
    this.tabChangedCallback = tabChanged;

    let openIssuesTabName: string = 'open';
    let closedIssuesTabName: string = 'closed';

    this.element = document.createElement('div');
    this.element.classList.add('feedback-container');
    this.element.innerHTML = `
      <div class="new-issue-btn-container">
        <button type="button" class="btn btn-primary" id="newIssueBtn">Submit new issue</button>
      </div>
      <div id="newIssueFormContainer" hidden></div>
      <div class="tabnav">
        <nav class="tabnav-tabs">
          <a id="openedTab" link="#" class="tabnav-tab selected" tabname="${openIssuesTabName}">Open</a>
          <a id="closedTab" link="#" class="tabnav-tab" tabname="${closedIssuesTabName}">Closed</a>
        </nav>
      </div>
      <div id="issuesBox" class="Box issues-box"></div>
    `;

    const newIssueBtn = this.element.querySelector('#newIssueBtn') as HTMLElement;
    const newIssueFormContainer = this.element.querySelector('#newIssueFormContainer') as HTMLElement;

    const setIssuesFn = this.setIssues.bind(this);

    const newIssueSubmit = (title: string, description: string): Promise<void> => {
      if (user) {
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
          newIssueComponent.clear();
          newIssueFormContainer.setAttribute('hidden', '');
          closedTab.classList.remove('selected');
          openedTab.classList.add('selected');
          loadIssuesByType("open").then(issues => {
            setIssuesFn(issues);
          });
        });
      }

      return login().then(() => loadUser()).then(u => {
        user = u;
        newIssueComponent.setUser(user);
      });
    };

    const newIssueComponent = new NewIssueComponent(user, newIssueSubmit);
    newIssueFormContainer.appendChild(newIssueComponent.element);

    newIssueBtn.addEventListener('click', function () {
      var hasAttr = newIssueFormContainer.hasAttribute('hidden');
      hasAttr ?
        newIssueFormContainer.removeAttribute('hidden') :
        newIssueFormContainer.setAttribute('hidden', '');
      publishResize();
    });

    this.issuesBox = this.element.querySelector('#issuesBox') as HTMLElement;
    const openedTab = this.openedTab = this.element.querySelector('#openedTab') as HTMLAnchorElement;
    const closedTab = this.closedTab = this.element.querySelector('#closedTab') as HTMLAnchorElement;

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

    let user = this.user;
    issues.forEach(function (issue) {
      let component = new IssueComponent(issue, user);
      issuesBox.appendChild(component.element);
    });

    publishResize();
  }

}

export class IssueComponent {
  public readonly element: HTMLElement;
  private timelineComponent: TimelineComponent | null;
  private newCommentComponent: NewCommentComponent | null;
  private rightArrow: HTMLElement;
  private downArrow: HTMLElement;
  private commentCount: Number;

  constructor(issue: Issue, user: User | null) {
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
    const commentCountElt = this.element.querySelector('.issue-comment-count') as HTMLElement;
    const issueTitleText = this.element.querySelector('.issue-title-text') as HTMLElement;

    rightArrow.addEventListener('click', function (event) {
      var target = event.target as HTMLElement;
      target.setAttribute('hidden', '');

      downArrow.removeAttribute('hidden');
      timeline.element.removeAttribute('hidden');
      newCommentComponent.element.removeAttribute('hidden');
      publishResize();
    });

    downArrow.addEventListener('click', function (event) {
      var target = event.target as HTMLElement;
      target.setAttribute('hidden', '');

      rightArrow.removeAttribute('hidden');

      timeline.element.setAttribute('hidden', '');
      newCommentComponent.element.setAttribute('hidden', '');
      publishResize();
    });

    const toggleHidden = (): void => {
      let isOpen = rightArrow.hasAttribute('hidden');
      if (isOpen) {
        rightArrow.removeAttribute('hidden');
        downArrow.setAttribute('hidden', '');
        timeline.element.setAttribute('hidden', '');
        newCommentComponent.element.setAttribute('hidden', '');

      } else {
        rightArrow.setAttribute('hidden', '');
        downArrow.removeAttribute('hidden');
        timeline.element.removeAttribute('hidden');
        newCommentComponent.element.removeAttribute('hidden');
      }

      publishResize();
    }

    commentCountElt.addEventListener('click', toggleHidden);
    issueTitleText.addEventListener('click', toggleHidden);

    if (issue && issue.comments > 0) {
      loadCommentsPage(issue.number, 1).then(commentsPage => {
        commentsPage.items.forEach(item => {
          timeline.appendComment(item);
        });
      });
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

// tslint:disable-next-line:max-line-length
const anonymousAvatar = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 16" version="1.1"><path fill="rgb(179,179,179)" fill-rule="evenodd" d="M8 10.5L9 14H5l1-3.5L5.25 9h3.5L8 10.5zM10 6H4L2 7h10l-2-1zM9 2L7 3 5 2 4 5h6L9 2zm4.03 7.75L10 9l1 2-2 3h3.22c.45 0 .86-.31.97-.75l.56-2.28c.14-.53-.19-1.08-.72-1.22zM4 9l-3.03.75c-.53.14-.86.69-.72 1.22l.56 2.28c.11.44.52.75.97.75H5l-2-3 1-2z"></path></svg>`;
// base64 encoding works in IE, Edge. UTF-8 does not.
const anonymousAvatarUrl = `data:image/svg+xml;base64,${btoa(anonymousAvatar)}`;

export class NewIssueComponent {
  public readonly element: HTMLElement;

  private avatarAnchor: HTMLAnchorElement;
  private avatar: HTMLImageElement;
  private form: HTMLFormElement;
  private input: HTMLInputElement;
  private textarea: HTMLTextAreaElement;
  private submitButton: HTMLButtonElement;

  private submitting = false;

  constructor(
    private user: User | null,
    private readonly submit: (titie: string, description: string) => Promise<void>
  ) {
    this.element = document.createElement('article');
    this.element.classList.add('timeline-comment');
    this.element.addEventListener('mousemove', publishResize); // todo: measure, throttle

    this.element.innerHTML = `
      <a class="avatar" target="_blank">
        <img height="44" width="44">
      </a>
      <form class="comment" accept-charset="UTF-8" action="javascript:">
        <header class="comment-header">
          <strong>Join the discussion</strong>
        </header>
        <div class="comment-body">
          <input class="form-control input-block" placeholder="Title"/>
          <textarea placeholder="Leave a comment" aria-label="comment"></textarea>
        </div>
        <footer class="comment-footer">
          <a class="text-link markdown-info" tabindex="-1" target="_blank"
             href="https://guides.github.com/features/mastering-markdown/">
            Styling with Markdown is supported
          </a>
          <button class="btn btn-primary" type="submit">Comment</button>
        </footer>
      </form>`;

    this.avatarAnchor = this.element.firstElementChild as HTMLAnchorElement;
    this.avatar = this.avatarAnchor.firstElementChild as HTMLImageElement;
    this.form = this.avatarAnchor.nextElementSibling as HTMLFormElement;
    this.input = this.form!.firstElementChild!.nextElementSibling!.firstElementChild as HTMLInputElement;
    this.textarea = this.input!.nextElementSibling as HTMLTextAreaElement;
    this.submitButton = this.form!.lastElementChild!.lastElementChild as HTMLButtonElement;

    this.setUser(user);

    this.textarea.addEventListener('input', this.handleInput);
    this.form.addEventListener('submit', this.handleSubmit);
  }

  public setUser(user: User | null) {
    this.user = user;
    this.submitButton.textContent = user ? 'Comment' : 'Sign in to comment';
    this.submitButton.disabled = !!user;

    if (user) {
      this.avatarAnchor.href = user.html_url;
      this.avatar.alt = '@' + user.login;
      this.avatar.src = user.avatar_url + '?v=3&s=88';
    } else {
      this.avatarAnchor.removeAttribute('href');
      this.avatar.alt = '@anonymous';
      this.avatar.src = anonymousAvatarUrl;
      this.textarea.disabled = true;
    }
  }

  public clear() {
    this.textarea.value = '';
    this.input.value = '';
  }

  private handleInput = () => {
    this.submitButton.disabled = /^\s*$/.test(this.textarea.value);
    if (this.textarea.scrollHeight < 450 && this.textarea.offsetHeight < this.textarea.scrollHeight) {
      this.textarea.style.height = `${this.textarea.scrollHeight}px`;
      publishResize();
    }
  }

  private handleSubmit = (event: Event) => {
    event.preventDefault();
    if (this.submitting) {
      return;
    }
    this.submitting = true;
    if (this.user) {
      this.textarea.disabled = true;
      this.submitButton.disabled = true;
    }
    this.submit(this.input.value, this.textarea.value).catch(() => 0).then(() => {
      this.submitting = false;
      this.textarea.disabled = !this.user;
      this.textarea.value = '';
      this.submitButton.disabled = false;
    });
  }
}
