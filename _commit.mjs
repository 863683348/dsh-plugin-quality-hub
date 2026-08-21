// 临时提交脚本：git add/commit/push 站点15
import { execFileSync } from 'child_process';
import { appendFileSync } from 'fs';

const GIT = "C:\\Program Files\\Git\\cmd\\git.exe";
const REPO = "C:\\worktmp\\dsh-plugin-quality-hub";
const LOG = "C:\\worktmp\\dsh-plugin-quality-hub\\_commit.log";

function run(args) {
  const out = execFileSync(GIT, args, { cwd: REPO, encoding: 'utf8' });
  appendFileSync(LOG, `$ git ${args.join(' ')}\n${out}\n`, 'utf8');
  return out;
}

try {
  appendFileSync(LOG, `\n=== START ${new Date().toISOString()} ===\n`);
  run(['status', '--short']);
  run(['add', '-A']);
  run(['commit', '-m', 'feat: SEO optimization + ecosystem insights', '-m', '- Add security scanner top 10 blog post', '-m', '- Add vision plugins comparison blog post', '-m', '- Add plugin compatibility matrix page', '-m', '- Add new plugin monitor script', '-m', '- Add plugin lifecycle tracker script', '-m', '- Add blog hero images (SVG)', '-m', '- i18n: add compatibility namespace']);
  run(['log', '--oneline', '-3']);
  try {
    run(['push', 'origin', 'main']);
  } catch (e) {
    appendFileSync(LOG, `PUSH FAILED: ${e.message}\n`);
  }
  appendFileSync(LOG, `=== DONE ===\n`);
} catch (e) {
  appendFileSync(LOG, `FATAL: ${e.message}\n`);
}
