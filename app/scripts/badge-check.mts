// Verify badge route query logic locally (does not write DB)
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

if (!process.env.CI) {
  try {
    const envContent = readFileSync("C:/Users/l'x/WorkBuddy/2026-08-17-21-54-54/app/.env.local", "utf8");
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
const names = ["deepseek-harness/backup-tool", "Nagi-ovo/voyager", "not/exist"];

async function main() {
  for (const n of names) {
    const p = await prisma.plugin.findUnique({ where: { name: n }, select: { name: true, score: true, grade: true } });
    console.log(`${n} -> ${p ? `${p.grade} ${p.score}` : "NOT FOUND"}`);
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
