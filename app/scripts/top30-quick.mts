// Quick top-plugin data pull for SEO articles (P1)
import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync } from "fs";

const IS_CI = !!process.env.CI;
if (!IS_CI) {
  try {
    const envContent = readFileSync(
      "C:/Users/l'x/WorkBuddy/2026-08-17-21-54-54/app/.env.local",
      "utf8"
    );
    for (const line of envContent.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      process.env[t.slice(0, i)] = t.slice(i + 1).replace(/^["']|["']$/g, "");
    }
  } catch {}
}

const prisma = new PrismaClient();
const out = "C:/worktmp/dsh-plugin-quality-hub/_top30.txt";

async function main() {
  const rows = await prisma.plugin.findMany({
    orderBy: [{ score: "desc" }, { stars: "desc" }],
    take: 30,
    select: { name: true, description: true, stars: true, score: true, grade: true, evalSource: true },
  });
  const lines = rows.map((r, i) =>
    `${i + 1}. ${r.name} | ${r.grade} ${r.score} | ⭐${r.stars} | src=${r.evalSource} | ${(r.description || "").slice(0, 120)}`
  );
  writeFileSync(out, lines.join("\n"), "utf8");
  console.log("written", rows.length);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
