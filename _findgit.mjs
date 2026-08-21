// 查找 git 可执行文件
import { execFileSync } from 'child_process';
import { writeFileSync } from 'fs';
import { globSync } from 'glob';

const LOG = "C:\\worktmp\\dsh-plugin-quality-hub\\_findgit.log";
let out = '';

try {
  // 尝试 where git
  const r = execFileSync('where', ['git'], { encoding: 'utf8', shell: false });
  out += `where git:\n${r}\n`;
} catch (e) { out += `where git ERR: ${e.message}\n`; }

// 搜索常见 git.exe 路径
const candidates = [
  "C:/Users/l'x/.workbuddy/binaries/PortableGit/**/git.exe",
  "C:/Program Files/Git/cmd/git.exe",
  "C:/Program Files (x86)/Git/cmd/git.exe",
  "C:/Users/l'x/AppData/Local/Programs/Git/cmd/git.exe",
];
try {
  const fs = await import('fs');
  for (const c of candidates) {
    out += `\nSearch: ${c}\n`;
  }
} catch(e) {}

writeFileSync(LOG, out, 'utf8');
console.log('done');
