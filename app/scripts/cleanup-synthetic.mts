/**
 * 清理合成池插件：只保留 GitHub 真实插件
 * 判定规则（精确，防误删真实仓库）：
 *  1. evalSource 明确含 synth/synthetic
 *  2. owner 属于 SYNTH_OWNERS 合成池
 *  3. name 匹配合成模式（owner/name-N 数字后缀）
 * 先打印统计 → 确认后执行删除 → 输出保留分布
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync } from "fs";

// ===== Env bootstrap (local .env.local) =====
if (!process.env.CI) {
  try {
    const envContent = readFileSync(
      "C:/Users/l'x/WorkBuddy/2026-08-17-21-54-54/app/.env.local",
      "utf8"
    );
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx);
      let value = trimmed.slice(eqIdx + 1);
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    // CI 场景跳过
  }
}

// 与 daily-evaluate.mts 保持一致的合成池 owner
const SYNTH_OWNERS = [
  "dsh-synth", "harness-community", "plugin-forge", "ai-workbench",
  "devtool-labs", "opensource-mesh", "automation-hub", "agent-ecosystem",
];

function isSynthetic(name: string, evalSource: string | null): boolean {
  const src = (evalSource ?? "").toLowerCase();
  if (src.includes("synth")) return true;
  const slash = name.indexOf("/");
  const owner = slash === -1 ? "" : name.slice(0, slash);
  // 仅按合成池 owner 判定（buildSyntheticInput 的 owner 固定来自此池）。
  // 刻意不加 -N 后缀兜底：真实仓库可能叫 awesome-gpt-image-2（⭐11.7k 被误伤过）。
  if (SYNTH_OWNERS.includes(owner)) return true;
  return false;
}

const prisma = new PrismaClient();
const DRY = process.env.DRY_RUN !== "0" && !process.env.DO_DELETE; // 默认 dry-run

async function main() {
  const rows = await prisma.plugin.findMany({
    select: { name: true, evalSource: true, grade: true },
  });
  const toDelete = rows.filter((r) => isSynthetic(r.name, r.evalSource));
  const toKeep = rows.filter((r) => !isSynthetic(r.name, r.evalSource));

  const lines: string[] = [];
  lines.push(`Total: ${rows.length}`);
  lines.push(`To DELETE (synthetic): ${toDelete.length}`);
  lines.push(`To KEEP (real): ${toKeep.length}`);
  lines.push("Keep by grade: " + JSON.stringify(
    toKeep.reduce((acc: Record<string, number>, r) => { acc[r.grade ?? "?"] = (acc[r.grade ?? "?"] ?? 0) + 1; return acc; }, {})
  ));
  lines.push("Delete sample (first 10): " + toDelete.slice(0, 10).map((r) => r.name).join(", "));
  lines.push("Keep sample (first 10): " + toKeep.slice(0, 10).map((r) => r.name).join(", "));

  if (DRY) {
    lines.push(">>> DRY RUN: set DO_DELETE=1 to actually delete");
  } else {
    const del = await prisma.plugin.deleteMany({
      where: { name: { in: toDelete.map((r) => r.name) } },
    });
    lines.push(`>>> DELETED ${del.count} synthetic plugins`);
    const after = await prisma.plugin.count();
    lines.push(`>>> Remaining total: ${after}`);
  }

  const out = lines.join("\n");
  console.log(out);
  writeFileSync("_cleanup-result.txt", out, "utf8");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  writeFileSync("_cleanup-result.txt", "ERROR: " + String(e), "utf8");
  process.exit(1);
});
