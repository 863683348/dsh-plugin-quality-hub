const fs = require('fs');
const path = require('path');

try {
  const root = 'C:/worktmp/dsh-plugin-quality-hub';
  const out = [];

  function ls(dir, depth = 0) {
    if (depth > 3) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      out.push('ERR-LS ' + dir + ' :: ' + e.message);
      return;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === 'node_modules' || ent.name === '.next' || ent.name === '.git') continue;
        out.push('D ' + full);
        ls(full, depth + 1);
      } else {
        out.push('F ' + full);
      }
    }
  }

  if (fs.existsSync(root)) {
    for (const ent of fs.readdirSync(root, { withFileTypes: true })) {
      const full = path.join(root, ent.name);
      if (ent.isDirectory()) {
        out.push('D ' + full);
        if (ent.name === 'app') {
          ls(path.join(full, 'src'), 2);
        }
      } else {
        out.push('F ' + full);
      }
    }
  } else {
    out.push('ROOT NOT EXISTS: ' + root);
  }

  fs.writeFileSync('C:/worktmp/dsh-plugin-quality-hub/probe-out.txt', out.join('\n'));
  console.log('OK done', out.length);
} catch (e) {
  fs.writeFileSync('C:/worktmp/dsh-plugin-quality-hub/probe-err2.txt', 'FATAL: ' + e.stack);
  console.log('FAILED');
}
