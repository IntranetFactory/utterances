import { pageAttributes as page } from './page-attributes';
import {
  Issue,
  User,
  setRepoContext,
  loadIssuesByType,
  loadUser,
} from './github';
import { FeedbackComponent } from './feedback-component';
import { setHostOrigin, publishResize } from './bus';

setRepoContext(page);

function loadIssues(): Promise<Issue[] | null> {
  return loadIssuesByType("open");
}

Promise.all([loadIssues(), loadUser()])
  .then(([issues, user]) => bootstrap(issues, user));

function bootstrap(issues: Issue[] | null, user: User | null) {
  setHostOrigin(page.origin);

  if (!issues) return;

  const tabChanged = (tabname: string | null) => {
    if (!tabname) return;
    loadIssuesByType(tabname).then(issues => {
      feedback.setIssues(issues);
      publishResize();
    });
  }

  const feedback = new FeedbackComponent(tabChanged, user);
  feedback.setIssues(issues);
  document.body.appendChild(feedback.element);
  publishResize();
}

addEventListener('not-installed', function handleNotInstalled() {
  removeEventListener('not-installed', handleNotInstalled);
  document.querySelector('.timeline')!.insertAdjacentHTML('afterbegin', `
  <div class="flash flash-error flash-not-installed">
    Error: utterances is not installed on <code>${page.owner}/${page.repo}</code>.
    If you own this repo,
    <a href="https://github.com/apps/utterances" target="_blank"><strong>install the app</strong></a>.
    Read more about this change in
    <a href="https://github.com/utterance/utterances/pull/25" target="_blank">the PR</a>.
  </div>`);
});
