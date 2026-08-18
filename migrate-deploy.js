// migrate-deploy.mjs — 读 .env.local 注入 env 后执行 prisma migrate deploy
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const appDir = 'C:/worktmp/dsh-plugin-quality-hub/app';
const envPath = path.join(appDir, '.env.local');

// 解析 .env.local
const env = { ...process.env };
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      env[m[1]] = v;
    }
  }
}

const node = 'C:/Users/l\x27x/.workbuddy/binaries/node/versions/22.22.2/node.exe';
// node_modules/prisma/build/index.js 是真实 CLI 入口
const prismaCli = path.join(appDir, 'node_modules/prisma/build/index.js');

const res = spawnSync(node, [prismaCli, 'migrate', 'deploy', '--schema', path.join(appDir, 'prisma/schema.prisma')], {
  cwd: appDir,
  env,
  encoding: 'utf8',
  shell: false,
});

fs.writeFileSync('C:/worktmp/dsh-plugin-quality-hub/migrate-out.txt', `exit=${res.status}\n--- stdout ---\n${res.stdout || ''}\n--- stderr ---\n${res.stderr || ''}`);
