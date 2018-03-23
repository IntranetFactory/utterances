import { pageAttributes as page } from './page-attributes';
import {
  Issue,
  IssueComment,
  User,
  setRepoContext,
  loadIssuesByType,
  loadIssueByTerm,
  loadIssueByNumber,
  loadCommentsPage,
  loadUser,
  postComment,
  createIssue
} from './github';
import { login } from './oauth';
import { FeedbackComponent } from './feedback-component';
import { TimelineComponent } from './timeline-component';
import { NewCommentComponent } from './new-comment-component';
import { setHostOrigin, publishResize } from './bus';
import { RepoConfig, loadRepoConfig } from './repo-config';

setRepoContext(page);

function loadIssue(): Promise<Issue | null> {
  if (page.issueNumber !== null) {
    return loadIssueByNumber(page.issueNumber);
  }
  return loadIssueByTerm(page.issueTerm as string);
}

function loadIssues(): Promise<Issue[] | null> {
  return loadIssuesByType("open");
}

Promise.all([loadRepoConfig(page.configPath), loadIssues(), loadUser()])
  .then(([repoConfig, issues, user]) => bootstrap(repoConfig, issues, user));

function bootstrap(config: RepoConfig, issues: Issue[] | null, user: User | null) {
  if (config.origins.indexOf(page.origin) === -1) {
    throw new Error(`The origins specified in ${page.configPath} do not include ${page.origin}`);
  }
  setHostOrigin(page.origin);

  if (!issues) return;

  const tabChanged = (tabname: string|null) => {
    if (!tabname) return;
    loadIssuesByType(tabname).then(issues => {
      feedback.setIssues(issues);
    });
  }

  const feedback = new FeedbackComponent(tabChanged, user);
  document.body.appendChild(feedback.element);
  feedback.setIssues(issues);

  // let issue = issues[0];
  // const timeline = new TimelineComponent(user, issue);
  // document.body.appendChild(timeline.element);

  // if (issue && issue.comments > 0) {
  //   loadCommentsPage(issue.number, 1).then(({ items }) => timeline.replaceComments(items));
  // }

  // if (issue && issue.locked) {
  //   return;
  // }

  // const submit = (markdown: string) => {
  //   if (user) {
  //     let commentPromise: Promise<IssueComment>;
  //     if (issue) {
  //       commentPromise = postComment(issue.number, markdown);
  //     } else {
  //       commentPromise = createIssue(
  //         page.issueTerm as string,
  //         page.url,
  //         page.title,
  //         page.description
  //       ).then(newIssue => {
  //         issue = newIssue;
  //         timeline.setIssue(issue);
  //         return postComment(issue.number, markdown);
  //       });
  //     }
  //     return commentPromise.then(comment => {
  //       timeline.appendComment(comment);
  //       newCommentComponent.clear();
  //     });
  //   }

  //   return login().then(() => loadUser()).then(u => {
  //     user = u;
  //     timeline.setUser(user);
  //     newCommentComponent.setUser(user);
  //   });
  // };

  // const newCommentComponent = new NewCommentComponent(user, submit);
  // timeline.element.appendChild(newCommentComponent.element);
  publishResize();
}
