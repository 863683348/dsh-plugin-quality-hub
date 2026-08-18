// Debug: verify keySet contents for known-good keys.
import zh from "../src/i18n/locales/zh.ts";
import { writeFileSync } from "fs";

const lines: string[] = [];
const real = ((zh as unknown as { default?: object }).default ?? zh) as Record<string, unknown>;
lines.push("typeof zh: " + typeof zh);
lines.push("real keys: " + Object.keys(real).join(", "));

const keySet = new Set<string>();
function collect(obj: Record<string, unknown>, prefix = ""): void {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) keySet.add(p);
    else if (v && typeof v === "object") collect(v as Record<string, unknown>, p);
    else keySet.add(p);
  }
}
collect(real);

lines.push("keySet size: " + keySet.size);
for (const probe of [
  "common.brandName",
  "common.theme.light",
  "common.nav.allPlugins",
  "weekly.section.title",
  "home.table.rank",
  "plugin.meta.author",
  "security.legend.danger",
  "method.weightTable.title",
]) {
  lines.push(`  ${probe} -> ${keySet.has(probe)}`);
}

// list top-level common children
const common = (zh as any)?.common;
lines.push("common children: " + (common ? Object.keys(common).join(", ") : "N/A"));
const theme = common?.theme;
lines.push("common.theme children: " + (theme ? Object.keys(theme).join(", ") : "N/A"));

const out = lines.join("\n");
console.log(out);
writeFileSync("C:/worktmp/i18n-debug.txt", out, "utf8");
