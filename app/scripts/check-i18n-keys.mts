// Systematic i18n key checker.
// Extracts all key paths from zh.ts, scans every src file's t() calls,
// resolves each against the file's getTranslations/useTranslations namespace,
// and reports any key that would render as a literal [key] (missing).
// Usage (cwd = app): node node_modules/tsx/dist/cli.mjs scripts/check-i18n-keys.mts
import zh from "../src/i18n/locales/zh.ts";
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join, relative } from "path";

// 1) collect all leaf key paths (arrays count as a key themselves)
// NOTE: tsx CJS-interop wraps the default export as { default: <obj> }
const realZh = ((zh as unknown as { default?: Record<string, unknown> }).default ??
  zh) as Record<string, unknown>;
const keySet = new Set<string>();
function collect(obj: Record<string, unknown>, prefix = ""): void {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) {
      keySet.add(p);
    } else if (v && typeof v === "object") {
      collect(v as Record<string, unknown>, p);
    } else {
      keySet.add(p);
    }
  }
}
collect(realZh);

// 2) walk src tree
const ROOT = join(process.cwd(), "src");
const files: string[] = [];
function walk(dir: string): void {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(e)) files.push(p);
  }
}
walk(ROOT);

const nsRe = /(?:getTranslations|useTranslations)\(\s*(?:['"]([^'"]*)['"]\s*)?\)/g;
const tRe = /\bt(?:\.\w+)?\(\s*['"]([^'"]+)['"]/g;

const missing: { file: string; key: string; ns: string }[] = [];
const dynamicSkipped: { file: string; key: string }[] = [];
let callCount = 0;

for (const f of files) {
  const code = readFileSync(f, "utf8");
  const nss: string[] = [];
  let m: RegExpExecArray | null;
  nsRe.lastIndex = 0;
  while ((m = nsRe.exec(code)) !== null) nss.push(m[1] ?? "");
  if (nss.length === 0) continue;

  tRe.lastIndex = 0;
  let tm: RegExpExecArray | null;
  while ((tm = tRe.exec(code)) !== null) {
    const key = tm[1];
    callCount++;
    if (key.includes("${") || key.includes("`")) {
      dynamicSkipped.push({ file: relative(ROOT, f), key });
      continue;
    }
    let ok = false;
    for (const ns of nss) {
      const full = ns ? `${ns}.${key}` : key;
      if (keySet.has(full)) {
        ok = true;
        break;
      }
    }
    if (!ok) missing.push({ file: relative(ROOT, f), key, ns: nss.join("|") });
  }
}

const lines: string[] = [];
lines.push(`files scanned        : ${files.length}`);
lines.push(`t() literal calls    : ${callCount}`);
lines.push(`locale key set (leaf): ${keySet.size}`);
lines.push(`dynamic keys skipped : ${dynamicSkipped.length}`);
lines.push(`MISSING keys         : ${missing.length}`);
for (const mm of missing) lines.push(`  MISSING  ${mm.file}  t('${mm.key}')  ns=[${mm.ns}]`);
lines.push("--- dynamic keys (template literals, skipped) ---");
for (const d of dynamicSkipped.slice(0, 20)) lines.push(`  ${d.file}  ${d.key}`);
if (dynamicSkipped.length > 20) lines.push(`  ... and ${dynamicSkipped.length - 20} more`);

const out = lines.join("\n");
console.log(out);
writeFileSync("C:/worktmp/i18n-key-check.txt", out, "utf8");
