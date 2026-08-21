// 清理误提交的临时文件 + 确认 push 状态
import { execFileSync } from 'child_process';
import { appendFileSync, existsSync, rmSync } from 'fs';

const GIT = "C:\\Program Files\\Git\\cmd\\git.exe";
const REPO = "C:\\worktmp\\dsh-plugin-quality-hub";
const LOG = "C:\\worktmp\\dsh-plugin-quality-hub\\_commit2.log";

function run(args) {
  const out = execFileSync(GIT, args, { cwd: REPO, encoding: 'utf8' });
  appendFileSync(LOG, `$ git ${args.join(' ')}\n${out}\n`, 'utf8');
  return out;
}

try {
  appendFileSync(LOG, `\n=== START ${new Date().toISOString()} ===\n`);

  // 删除误提交的临时文件
  const trash = ['_commit.log','_commit.mjs','_findgit.mjs','_getcommand.txt','_wheregit.txt','app/=1000'];
  for (const f of trash) {
    const p = REPO + '\\' + f;
    if (existsSync(p)) { rmSync(p, { force: true }); appendFileSync(LOG, `deleted: ${f}\n`); }
  }

  // 确认远端与当前分支
  run(['remote', '-v']);
  run(['branch', '-vv']);
  run(['status', '--short']);

  // push（追加提交再一起推）
  run(['add', '-A']);
  run(['commit', '-m', 'chore: remove temp files from commit', '-m', 'Clean up helper scripts accidentally included in previous commit']);
  run(['push', 'origin', 'main']);
  run(['log', '--oneline', '-3']);
  appendFileSync(LOG, `=== DONE ===\n`);
} catch (e) {
  appendFileSync(LOG, `FATAL: ${e.message}\n`);
}
