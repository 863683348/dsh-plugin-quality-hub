#!/usr/bin/env node
/**
 * verify-blog-data.mjs — 博客数据层「构建守门」闸门
 *
 * 目的：防止 pipeline 把各站点博客数据文件写坏（posts.ts / posts.tsx / posts.mjs / md）
 *   已发生 3 次事故：`//` 注释吞行、文章对象被劈两半、缺闭合符、未转义撇号、
 *   tab 破坏路径、重复垃圾文章、slug 重复、裸域 CTA。
 *
 * 用法：
 *   node verify-blog-data.mjs --site <1..15>     # 单站检查
 *   node verify-blog-data.mjs --all              # 全站检查
 *   node verify-blog-data.mjs --site 4 --no-tsc  # 跳过 tsc（仅结构检查）
 *
 * 检查项（按站适配）：
 *   [存在]  数据文件存在
 *   [slug]  slug / id 唯一（无重复）
 *   [结构]  字符串感知的括号/引号/注释平衡（{ } ( ) [ ]）
 *   [撇号]  单引号字符串内未转义撇号（TS 语法杀手）
 *   [裸域]  CTA href 指向裸域（应指向站内路径）
 *   [md]    frontmatter 完整性（--- 成对 + title/description/pubDate）
 *   [卡片]  pdfm 列表页卡片覆盖全部 slug
 *   [tsc]   node_modules 存在时跑 tsc --noEmit（深度验证）
 *
 * 退出码：0 = 全过（可推送）；非 0 = 有损坏（阻止推送）。
 * 任意一项 FAIL 即 exit 1。
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const NODE = process.env.NODE || 'C:/Users/l\x27x/.workbuddy/binaries/node/versions/22.22.2/node.exe';
const WS = "C:/Users/l'x/WorkBuddy/2026-08-04-13-14-21";
const WT = 'C:/worktmp';

// ---- 站点登记表：dir=仓库目录，files=数据文件(相对)，slugRe=slug/id 提取正则 ----
const SITES = {
  1: { name: 'getcreditworth',        dir: `${WS}/getcreditworth`,            files: ['data/blog/posts.tsx'], slugRe: /slug:\s*['"]([^'"\s]+)['"]/g, bareDomain: 'getcreditworth.com' },
  2: { name: 'public-holidays',       dir: `${WS}/public-holidays`,           files: ['src/lib/blog-posts.ts'], slugRe: /slug:\s*['"]([^'"\s]+)['"]/g, localeRe: /locale:\s*['"]([^'"\s]+)['"]/g, idRe: /^\s*id:\s*(\d+),?\r?$/gm, multiLang: true, bareDomain: 'public-holidays.shop' },
  3: { name: 'codexpetgenerator',     dir: `${WS}/codexpetgenerator-recover`, files: ['lib/blog/posts.ts'],     slugRe: /slug:\s*['"]([^'"\s]+)['"]/g, bareDomain: 'codexpetgenerator.com' },
  4: { name: 'codex-skin-studio',     dir: `${WS}/codex-skin-studio`,         files: ['src/data/posts.ts'],      slugRe: /slug:\s*['"]([^'"\s]+)['"]/g, bareDomain: 'codex-skin-studio.shop' },
  5: { name: 'dynamic-profile',       dir: `${WS}/dynamic-profile`,           files: ['lib/blog-posts.ts'],       slugRe: /slug:\s*['"]([^'"\s]+)['"]/g, bareDomain: 'dynamic-profile.shop' },
  6: { name: 'pause-paw',             dir: `${WS}/pause-paw`,                 files: ['public/blog/posts.mjs'],   slugRe: /id:\s*"([^"]+)"/g,          bareDomain: 'pause-paw.shop' },
  7: { name: 'digital-footprint-health', dir: `${WS}/digital-footprint-health-repo`, files: ['content/posts.ts'], slugRe: /slug:\s*['"]([^'"\s]+)['"]/g, bareDomain: 'digital-footprint-health.shop' },
  8: { name: 'pdf-merge-next',        dir: `${WS}/pdf-merge-next`,            files: ['app/blog/page.tsx'],       slugRe: null,                         bareDomain: 'pdfmergenext.shop', mode: 'dirs', dirPattern: 'app/blog/*', listDataFile: 'src/lib/blog/posts.ts', listSlugRe: /slug:\s*['"]([^'"\s]+)['"]/g },
  9: { name: 'old-photo-restoration', dir: `${WS}/old-photo-restoration-recover`, files: ['content/blog/index.js'], slugRe: /slug:\s*['"]([^'"\s]+)['"]/g, bareDomain: 'old-photo-restoration-saas.shop', mode: 'glob', globPattern: 'content/blog/*-posts.js' },
  10:{ name: 'image-compressor-saas',dir: `${WS}/image-compressor-saas`,      files: ['src/lib/blog/posts.ts'],   slugRe: /slug:\s*['"]([^'"\s]+)['"]/g, bareDomain: 'image-compressor-saas.shop' },
  11:{ name: 'yiboardgame',           dir: `${WS}/yiboard`,                   files: ['src/lib/blog/posts.ts'],   slugRe: /slug:\s*['"]([^'"\s]+)['"]/g, bareDomain: 'yiboardgame.com' },
  12:{ name: 'stillherememory',       dir: `${WT}/stillhere`,                 files: ['lib/blog/posts.ts'],       slugRe: /slug:\s*['"]([^'"\s]+)['"]/g, bareDomain: 'stillherememory.com' },
  13:{ name: 'awesomecodexskin',      dir: `${WT}/awesomecodexskin`,          files: [],                          slugRe: null, bareDomain: 'awesomecodexskin.com', mode: 'md', dirPattern: 'src/content/blog/*.md' },
  14:{ name: 'haoweirecipes',         dir: `${WT}/haowei-git`,                files: ['src/data/blog/index.ts'],  slugRe: /slug:\s*['"]([^'"\s]+)['"]/g, bareDomain: 'haoweirecipes.com' },
  15:{ name: 'dshquality',            dir: `${WT}/dsh-plugin-quality-hub`,    files: ['app/src/data/blog/posts.ts'], slugRe: /slug:\s*['"]([^'"\s]+)['"]/g, bareDomain: 'dshquality.com' },
};

// ---- 精确词法扫描器（处理 单/双引号/模板字符串 + 注释 + 括号平衡）----
// 规则：
//   - 三种字符串内容里的括号一律不算结构
//   - 单引号/双引号字符串跨行未闭合 → 报错（未转义撇号截断的可靠迹象）
//   - 模板字符串里的 ${...} 递归计括号
//   - isTsx: true 时跳过整体结构检查（JSX 文本节点含 } ] 会干扰），仅由 tsc 兜底
function scanStructure(code, file, isTsx) {
  const issues = [];
  let i = 0, n = code.length, line = 1;
  const bal = { brace: 0, paren: 0, bracket: 0 };
  const stack = [];
  const pairs = { '{': 'brace', '(': 'paren', '[': 'bracket' };
  const closers = { '}': 'brace', ')': 'paren', ']': 'bracket' };

  while (i < n) {
    const ch = code[i], next = code[i + 1];
    if (ch === '\n') { line++; i++; continue; }
    if (ch === '/' && next === '/') { while (i < n && code[i] !== '\n') i++; continue; }
    if (ch === '/' && next === '*') {
      const e = code.indexOf('*/', i + 2);
      if (e === -1) { issues.push(`${file}:${line} 块注释未闭合 /*`); break; }
      line += code.slice(i, e).split('\n').length - 1;
      i = e + 2; continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      const q = ch;
      let j = i + 1, closed = false;
      while (j < n) {
        if (code[j] === '\\') { j += 2; continue; }
        if (code[j] === q) { closed = true; j++; break; }
        if (q === '`' && code[j] === '$' && code[j + 1] === '{') {
          let d = 1, k = j + 2;
          while (k < n && d > 0) {
            if (code[k] === '{') d++;
            else if (code[k] === '}') d--;
            if (code[k] === '\n') line++;
            k++;
          }
          j = k; continue;
        }
        if (code[j] === '\n' && q !== '`') {
          // 单行字符串跨行 → 未转义撇号/缺闭合，截断了字符串
          const snippet = code.slice(i, Math.min(i + 70, n)).replace(/\n/g, ' ');
          issues.push(`${file}:${line} ${q}字符串跨行未闭合（疑似未转义撇号）: ${snippet}`);
          break;
        }
        if (code[j] === '\n') line++;
        j++;
      }
      if (!closed && j >= n) issues.push(`${file}:${line} ${q}字符串未闭合到文件尾`);
      i = j; continue;
    }
    if (pairs[ch]) {
      bal[pairs[ch]]++; stack.push(pairs[ch]); i++; continue;
    }
    if (closers[ch]) {
      const kind = closers[ch];
      bal[kind]--;
      if (bal[kind] < 0) issues.push(`${file}:${line} 多余的闭合符 ${ch}`);
      if (stack.length && stack[stack.length - 1] !== kind) {
        issues.push(`${file}:${line} 括号不匹配 期望 ${stack[stack.length - 1]} 遇到 ${kind}`);
      }
      stack.pop(); i++; continue;
    }
    i++;
  }
  if (bal.brace) issues.push(`${file}: 顶层 brace 不平衡 (${bal.brace})`);
  if (bal.paren) issues.push(`${file}: 顶层 paren 不平衡 (${bal.paren})`);
  if (bal.bracket) issues.push(`${file}: 顶层 bracket 不平衡 (${bal.bracket})`);
  return issues;
}

// ---- 检查：裸域 CTA（href 指向裸域而非站内路径）----
function scanBareDomain(code, file, domain) {
  const issues = [];
  const re = new RegExp(`href:\\s*['"]https://${domain.replace(/\./g, '\\.')}['"]`, 'g');
  let m;
  while ((m = re.exec(code)) !== null) {
    const line = code.slice(0, m.index).split('\n').length;
    issues.push(`${file}:${line} 裸域 CTA: ${m[0]}`);
  }
  return issues;
}

// ---- 检查：md frontmatter ----
function scanMdFrontmatter(file) {
  const issues = [];
  const code = fs.readFileSync(file, 'utf8');
  const lines = code.split('\n').map((l) => l.replace(/\r$/, '')); // CRLF 安全
  if (!code.startsWith('---')) { issues.push(`${file}: 缺 frontmatter 开头 ---`); return issues; }
  const endIdx = lines.indexOf('---', 1);
  if (endIdx === -1) { issues.push(`${file}: frontmatter 未闭合（缺第二个 ---）`); return issues; }
  const fm = lines.slice(1, endIdx).join('\n');
  for (const key of ['title:', 'description:', 'pubDate:']) {
    if (!fm.includes(key)) issues.push(`${file}: frontmatter 缺 ${key}`);
  }
  return issues;
}

// ---- 运行 tsc ----
function runTsc(dir) {
  const tsc = path.join(dir, 'node_modules/typescript/bin/tsc');
  if (!fs.existsSync(tsc)) return { ran: false, reason: 'no node_modules/typescript' };
  const r = spawnSync(NODE, [tsc, '--noEmit'], {
    cwd: dir, encoding: 'utf8', timeout: 180000,
    env: { ...process.env, NODE_OPTIONS: '' },
  });
  const out = (r.stdout || '') + (r.stderr || '');
  const firstLines = out.split('\n').filter(Boolean).slice(0, 8);
  return { ran: true, ok: r.status === 0, status: r.status, detail: firstLines };
}

// ---- 主检查 ----
function checkSite(num, opts) {
  const s = SITES[num];
  if (!s) { console.log(`[${num}] 未知站点`); return { fail: 1 }; }
  if (opts.cwd) s.dir = opts.cwd; // CI 覆盖目录
  const label = `[站${num} ${s.name}]`;
  let failures = 0;
  const fail = (msg) => { failures++; console.log(`  ✗ ${msg}`); };
  const pass = (msg) => console.log(`  ✓ ${msg}`);

  console.log(`\n${label}`);
  if (!fs.existsSync(s.dir)) { fail(`目录不存在 ${s.dir}`); return { fail: 1 }; }

  // 文件清单
  let files = [];
  if (s.mode === 'dirs') {
    const d = path.join(s.dir, 'app/blog');
    if (fs.existsSync(d)) files = fs.readdirSync(d).filter(x => fs.statSync(path.join(d, x)).isDirectory()).map(x => `app/blog/${x}/page.tsx`);
  } else if (s.mode === 'glob') {
    const base = path.join(s.dir, path.dirname(s.globPattern));
    if (fs.existsSync(base)) files = fs.readdirSync(base).filter(f => /-posts\.js$/.test(f)).map(f => path.join(path.dirname(s.globPattern), f));
  } else if (s.mode === 'md') {
    const d = path.join(s.dir, 'src/content/blog');
    if (fs.existsSync(d)) files = fs.readdirSync(d).filter(f => f.endsWith('.md')).map(f => `src/content/blog/${f}`);
  } else {
    files = s.files;
  }
  if (!files.length) { fail('无数据文件'); return { fail: 1 }; }
  const existing = files.filter(f => fs.existsSync(path.join(s.dir, f)));
  const missing = files.filter(f => !fs.existsSync(path.join(s.dir, f)));
  if (missing.length) fail(`缺失文件: ${missing.join(', ')}`);
  if (!existing.length) { fail('无可用数据文件'); return { fail: 1 }; }
  pass(`数据文件: ${existing.length} 个 (${existing.map(f => path.basename(f)).join(', ')})`);

  // slug 唯一性（多语言站点按 slug+locale 判重，避免 en/zh 同 slug 误报）
  const allKeys = [];
  const allSlugsRaw = [];
  for (const f of existing) {
    const code = fs.readFileSync(path.join(s.dir, f), 'utf8');
    if (s.slugRe) {
      const re = new RegExp(s.slugRe.source, 'g');
      let m;
      while ((m = re.exec(code)) !== null) {
        allSlugsRaw.push(m[1]);
        if (s.multiLang) {
          // 取该对象紧随的 locale（缺失默认 en）——按对象分块再匹配更稳
          const seg = code.slice(m.index, code.indexOf('\n  },\n', m.index) >= 0 ? code.indexOf('\n  },\n', m.index) : m.index + 2000);
          const lm = (s.localeRe ? new RegExp(s.localeRe.source, 'g') : null);
          let loc = 'en';
          if (lm) { const x = lm.exec(seg); if (x) loc = x[1]; }
          allKeys.push(m[1] + '|' + loc);
        }
      }
    }
    // 结构检查（TS/JS 文件；tsx 的 JSX 文本节点会干扰 → 跳过结构检查，由 tsc 兜底）
    if (/\.(ts|tsx|js|mjs)$/.test(f)) {
      if (!f.endsWith('.tsx')) {
        for (const issue of scanStructure(code, f, false)) fail(issue);
      }
      if (s.bareDomain) for (const issue of scanBareDomain(code, f, s.bareDomain)) fail(issue);
    }
    // md frontmatter
    if (s.mode === 'md') for (const issue of scanMdFrontmatter(path.join(s.dir, f))) fail(issue);
  }
  const keys = s.multiLang ? allKeys : allSlugsRaw;
  if (keys.length) {
    const unique = new Set(keys);
    if (unique.size === keys.length) pass(`slug/id 唯一: ${unique.size} 个${s.multiLang ? ' (slug+locale)' : ''}`);
    else {
      const dup = keys.filter((x, i) => keys.indexOf(x) !== i);
      fail(`slug 重复 ${keys.length - unique.size} 个: ${[...new Set(dup)].join(', ')}`);
    }
  }

  // id 唯一性（数值 id 站点，如 public-holidays）
  if (s.idRe) {
    const allIds = [];
    for (const f of existing) {
      const code = fs.readFileSync(path.join(s.dir, f), 'utf8');
      const re = new RegExp(s.idRe.source, 'gm');
      let m;
      while ((m = re.exec(code)) !== null) allIds.push(m[1]);
    }
    const u = new Set(allIds);
    if (u.size === allIds.length) pass(`id 唯一: ${u.size} 个`);
    else {
      const dup = [...new Set(allIds.filter((x, i) => allIds.indexOf(x) !== i))];
      fail(`id 重复 ${allIds.length - u.size} 个: ${dup.join(', ')}`);
    }
  }

  // pdfm 卡片覆盖（数据源 ↔ 目录 slug 双向核对）
  if (s.mode === 'dirs') {
    const dirs = fs.existsSync(path.join(s.dir, 'app/blog'))
      ? fs.readdirSync(path.join(s.dir, 'app/blog')).filter(x => fs.statSync(path.join(s.dir, 'app/blog', x)).isDirectory())
      : [];
    if (s.listDataFile && s.listSlugRe && fs.existsSync(path.join(s.dir, s.listDataFile))) {
      // 数据源驱动：列表页从数据源渲染，核对「目录 slug 全部有卡片」+「数据源 slug 全部有目录(避免 404)」
      const lc = fs.readFileSync(path.join(s.dir, s.listDataFile), 'utf8');
      const dataSlugs = [...lc.matchAll(new RegExp(s.listSlugRe.source, 'g'))].map(m => m[1]);
      const missingCards = dirs.filter(d => !dataSlugs.includes(d));
      const orphanSlugs = dataSlugs.filter(x => !dirs.includes(x));
      if (missingCards.length) fail(`数据源缺卡片: ${missingCards.join(', ')}`);
      if (orphanSlugs.length) fail(`数据源 slug 无对应页面(将 404): ${orphanSlugs.join(', ')}`);
      if (!missingCards.length && !orphanSlugs.length) pass(`卡片覆盖: 目录 ${dirs.length} = 数据源 ${dataSlugs.length} 篇`);
    } else if (dirs.length) {
      const listPage = path.join(s.dir, 'app/blog/page.tsx');
      if (fs.existsSync(listPage)) {
        const lc = fs.readFileSync(listPage, 'utf8');
        const missingCards = dirs.filter(d => !lc.includes(d));
        if (missingCards.length) fail(`列表页缺卡片: ${missingCards.join(', ')}`);
        else pass(`列表页卡片覆盖全部 ${dirs.length} 篇`);
      }
    }
  }

  // tsc（有 node_modules 就跑，无论 mode）
  if (!opts.noTsc) {
    const t = runTsc(s.dir);
    if (t.ran) {
      if (t.ok) pass(`tsc --noEmit 通过`);
      else { fail(`tsc --noEmit 失败 (exit ${t.status})`); t.detail.forEach(l => console.log(`      ${l}`)); }
    } else {
      console.log(`  · 跳过 tsc (${t.reason})`);
    }
  }

  return { fail: failures };
}

// ---- CLI ----
const args = process.argv.slice(2);
const opts = { noTsc: args.includes('--no-tsc') };
// --cwd <dir>：覆盖站点目录（CI 中跑当前 checkout，忽略本地绝对路径）
const ci = args.indexOf('--cwd');
if (ci !== -1 && args[ci + 1]) opts.cwd = args[ci + 1];
let targets = [];
if (args.includes('--all')) targets = Object.keys(SITES).map(Number);
else {
  const si = args.indexOf('--site');
  if (si !== -1 && args[si + 1]) targets = args[si + 1].split(',').map(Number);
}
if (!targets.length) { console.log('用法: node verify-blog-data.mjs --site <1..15> | --all [--no-tsc] [--cwd <dir>]'); process.exit(2); }

let totalFail = 0;
for (const num of targets) {
  const r = checkSite(num, opts);
  totalFail += r.fail;
}
console.log(`\n===== 汇总: ${targets.length} 站, ${totalFail} 处失败 =====`);
process.exit(totalFail ? 1 : 0);
