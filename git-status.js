// git-status.js — 在干净副本查看 git 状态
const { spawnSync } = require('child_process');
const fs = require('fs');

const repo = 'C:/worktmp/dsh-plugin-quality-hub';

function git(args) {
  const res = spawnSync('git', args, {
    cwd: repo,
    encoding: 'utf8',
    shell: false,
  });
  return { out: res.stdout || '', err: res.stderr || '', status: res.status };
}

const status = git(['status', '--short']);
const branch = git(['branch', '--show-current']);
const log = git(['log', '--oneline', '-3']);
const remote = git(['ls-remote', 'origin', 'refs/heads/main']);

fs.writeFileSync(
  'C:/worktmp/dsh-plugin-quality-hub/git-out.txt',
  `branch=${branch.out.trim()}\nremote_main=${remote.out.trim()}\n--- last 3 ---\n${log.out}--- status ---\n${status.out}\n--- stderr ---\n${status.err}`
);
