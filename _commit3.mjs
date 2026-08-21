// 最终清理 + push 验证
import { execFileSync } from 'child_process';
import { appendFileSync, existsSync, rmSync } from 'fs';

const GIT = "C:\\Program Files\\Git\\cmd\\git.exe";
const REPO = "C:\\worktmp\\dsh-plugin-quality-hub";
const LOG = "C:\\worktmp\\dsh-plugin-quality-hub\\_commit3.log";

function run(args) {
  const out = execFileSync(GIT, args, { cwd: REPO, encoding: 'utf8' });
  appendFileSync(LOG, `$ git ${args.join(' ')}\n${out}\n`, 'utf8');
  return out;
}
function run2(args) {
  // 允许失败的版本
  try { return run(args); } catch(e) { appendFileSync(LOG, `$ git ${args.join(' ')}\nERR: ${e.message}\n`); return ''; }
}

try {
  appendFileSync(LOG, `\n=== START ${new Date().toISOString()} ===\n`);

  // 删除 _commit2 及本日志外的临时文件
  for (const f of ['_commit2.mjs','_commit2.log','_findgit.mjs','_getcommand.txt','_wheregit.txt']) {
    const p = REPO + '\\' + f;
    if (existsSync(p)) { rmSync(p, { force: true }); appendFileSync(LOG, `deleted: ${f}\n`); }
  }

  // 提交删除（_commit3.mjs 会残留一个，最后单独删）
  run(['add', '-A']);
  run(['commit', '-m', 'chore: clean up remaining temp files']);
  run2(['push', 'origin', 'main']);

  // 验证
  run(['status', '--short']);
  run(['branch', '-vv']);
  run(['log', '--oneline', '-5']);
  appendFileSync(LOG, `=== DONE ===\n`);
} catch (e) {
  appendFileSync(LOG, `FATAL: ${e.message}\n`);
}
