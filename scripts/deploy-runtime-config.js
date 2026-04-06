'use strict';

function toDeployItems(deploy) {
  if (!deploy) return [];
  return Array.isArray(deploy) ? deploy : [deploy];
}

function applyRuntimeGitDeployConfig(item) {
  if (!item || item.type !== 'git') return;

  const repoUrl = process.env.CHATTOOL_DEPLOY_REPO;
  const branch = process.env.CHATTOOL_DEPLOY_BRANCH;
  const token = process.env.CHATTOOL_DEPLOY_TOKEN;
  const message = process.env.CHATTOOL_DEPLOY_MESSAGE;

  if (repoUrl) {
    item.repo = {
      url: repoUrl,
      branch: branch || item.branch || 'main'
    };

    if (token && /^https?:\/\//.test(repoUrl)) {
      item.repo.token = '$CHATTOOL_DEPLOY_TOKEN';
    }
  }

  if (branch) {
    item.branch = branch;
  }

  if (message) {
    item.message = message;
  }
}

for (const item of toDeployItems(hexo.config.deploy)) {
  applyRuntimeGitDeployConfig(item);
}
