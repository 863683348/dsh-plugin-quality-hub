// Compare key sets between zh.ts and en.ts to find missing keys on either side.
import zh from "../src/i18n/locales/zh.ts";
import en from "../src/i18n/locales/en.ts";
import { writeFileSync } from "fs";

function real(mod: unknown): Record<string, unknown> {
  return ((mod as { default?: Record<string, unknown> }).default ?? mod) as Record<string, unknown>;
}

function collect(obj: Record<string, unknown>, prefix = "", out: Set<string>): void {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) out.add(p);
    else if (v && typeof v === "object") collect(v as Record<string, unknown>, p, out);
    else out.add(p);
  }
}

const zhSet = new Set<string>();
const enSet = new Set<string>();
collect(real(zh), "", zhSet);
collect(real(en), "", enSet);

const missingInEn: string[] = [];
for (const k of zhSet) if (!enSet.has(k)) missingInEn.push(k);
const missingInZh: string[] = [];
for (const k of enSet) if (!zhSet.has(k)) missingInZh.push(k);

const lines: string[] = [];
lines.push(`zh keys: ${zhSet.size}, en keys: ${enSet.size}`);
lines.push(`missing IN EN (zh has, en lacks): ${missingInEn.length}`);
for (const k of missingInEn) lines.push(`  [en-] ${k}`);
lines.push(`missing IN ZH (en has, zh lacks): ${missingInZh.length}`);
for (const k of missingInZh) lines.push(`  [zh-] ${k}`);

const out = lines.join("\n");
console.log(out);
writeFileSync("C:/worktmp/i18n-en-zh-diff.txt", out, "utf8");
