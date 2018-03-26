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
import { RepoConfig, loadRepoConfig } from './repo-config';

setRepoContext(page);

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
      publishResize();
    });
  }

  const feedback = new FeedbackComponent(tabChanged, user);
  document.body.appendChild(feedback.element);
  feedback.setIssues(issues);

  publishResize();
}
