// Load .env.local and run prisma migrate deploy via child process
const { execSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const path = require("node:path");

const envPath = path.resolve(__dirname, "..", ".env.local");
const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
const env = {};
for (const line of lines) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (m && !line.trim().startsWith("#")) {
    env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
}

const cmd = process.argv[2];
const execOpts = { env: { ...process.env, ...env }, encoding: "utf8", shell: "cmd.exe" };
try {
  const out = execSync(`node node_modules/prisma/build/index.js ${cmd}`, execOpts);
  console.log(out);
} catch (e) {
  console.log(e.stdout || "");
  console.error(e.stderr || "");
  process.exit(1);
}
