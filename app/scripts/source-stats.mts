/**
 * 统计插件库来源分布（真实 github / 合成池）
 * 用 evalSource 字段区分（github / synthetic），无字段回退用名称后缀判断
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

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

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.plugin.findMany({
    select: { name: true, evalSource: true, grade: true, stars: true, score: true },
  });

  let github = 0, synthetic = 0, unknown = 0;
  const gradeBySrc: Record<string, Record<string, number>> = {};
  const syntheticNames: string[] = [];

  for (const r of rows) {
    const src = (r.evalSource ?? "").toLowerCase();
    let bucket = "unknown";
    if (src.includes("github") || src.includes("real")) bucket = "github";
    else if (src.includes("synth")) bucket = "synthetic";
    else {
      // 无字段回退：合成池名称带 -N 数字后缀（如 devtool-labs/trace-indexer-0）
      const short = r.name.split("/").pop() ?? "";
      if (/-\d+$/.test(short) && !/^v?\d+\.\d/.test(short)) bucket = "synthetic";
    }
    if (bucket === "github") github++;
    else if (bucket === "synthetic") { synthetic++; syntheticNames.push(r.name); }
    else unknown++;

    gradeBySrc[bucket] ??= {};
    gradeBySrc[bucket][r.grade ?? "?"] = (gradeBySrc[bucket][r.grade ?? "?"] ?? 0) + 1;
  }

  const lines: string[] = [];
  lines.push(`Total: ${rows.length}`);
  lines.push(`  github:   ${github}`);
  lines.push(`  synthetic:${synthetic}`);
  lines.push(`  unknown:  ${unknown}`);
  lines.push("By source x grade:");
  for (const [src, g] of Object.entries(gradeBySrc)) {
    lines.push(`  ${src}: ${JSON.stringify(g)}`);
  }
  lines.push(`Synthetic sample (first 8): ${syntheticNames.slice(0, 8).join(", ")}`);
  lines.push(`Real sample (first 8): ${rows.filter(r => !/-\d+$/.test(r.name)).slice(0, 8).map(r => r.name).join(", ")}`);

  const out = lines.join("\n");
  console.log(out);
  // 同时写文件供 PowerShell 无回显环境读取
  const fs = await import("node:fs");
  fs.writeFileSync("_source-stats.txt", out, "utf8");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  const fs = await import("node:fs");
  fs.writeFileSync("_source-stats.txt", "ERROR: " + String(e), "utf8");
  process.exit(1);
});
