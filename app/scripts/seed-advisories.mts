// One-off seed for SecurityAdvisory rows (v0.3)
// Run: node --experimental-strip-types scripts/seed-advisories.mts  (or via tsx)
import { prisma } from "../src/lib/prisma";
import { seedAdvisories } from "../src/services/advisory-service";

async function main() {
  const created = await seedAdvisories();
  const total = await prisma.securityAdvisory.count();
  console.log(
    JSON.stringify({ created, total }, null, 2)
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
