import { User, IssueComment } from './github';
import { CommentComponent } from './comment-component';
import { publishResize } from './bus';

export class TimelineComponent {
  public readonly element: HTMLElement;
  private readonly timeline: CommentComponent[] = [];
  private readonly marker: Node;

  constructor(
    private user: User | null
  ) {
    this.element = document.createElement('section');
    this.element.classList.add('timeline');
    this.marker = document.createComment('marker');
    this.element.appendChild(this.marker);
  }

  public setUser(user: User | null) {
    this.user = user;
    const login = user ? user.login : null;
    for (let i = 0; i < this.timeline.length; i++) {
      this.timeline[i].setCurrentUser(login);
    }
    publishResize();
  }

  public appendComment(comment: IssueComment) {
    const component = new CommentComponent(
      comment,
      this.user ? this.user.login : null);
    this.timeline.push(component);
    this.element.insertBefore(component.element, this.marker);
    publishResize();
  }
}
