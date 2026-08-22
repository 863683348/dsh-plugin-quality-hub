#!/usr/bin/env node
// dsh-plugin-lint — zero-dependency quality linter for DSH plugins.
// Mirrors dshquality.com's 4-dimension scoring model:
//   maintenance / docs / npm / ecosystem
//
// Usage:
//   node dsh-plugin-lint.js <plugin-dir>          # human report
//   node dsh-plugin-lint.js <plugin-dir> --json   # machine-readable
// Exit codes: 0 = pass, 1 = report generated (any grade), 2 = errors
"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ===== Dimensions & checks (each returns { pass, note }) =====
const CHECKS = {
  docs: [
    { id: "readme-exists", label: "README.md present", test: (d) => fs.existsSync(path.join(d, "README.md")) },
    {
      id: "readme-length", label: "README >= 500 chars",
      test: (d) => {
        const p = path.join(d, "README.md");
        return fs.existsSync(p) && fs.statSync(p).size >= 500;
      },
    },
    {
      id: "readme-install", label: "README mentions install",
      test: (d) => {
        const p = path.join(d, "README.md");
        return fs.existsSync(p) && /install/i.test(fs.readFileSync(p, "utf8"));
      },
    },
    {
      id: "readme-usage", label: "README mentions usage/config",
      test: (d) => {
        const p = path.join(d, "README.md");
        return fs.existsSync(p) && /\b(usage|config|setup|example)\b/i.test(fs.readFileSync(p, "utf8"));
      },
    },
    { id: "license", label: "LICENSE file present", test: (d) => ["LICENSE", "LICENSE.md", "LICENSE.txt"].some((f) => fs.existsSync(path.join(d, f))) },
  ],
  maintenance: [
    {
      id: "ci-workflow", label: ".github/workflows present",
      test: (d) => fs.existsSync(path.join(d, ".github", "workflows")),
    },
    {
      id: "recent-commit", label: "committed within 90 days",
      test: (d) => {
        try {
          const out = execSync("git log -1 --format=%ct", { cwd: d, timeout: 5000, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
          const t = Number(out) * 1000;
          return !Number.isNaN(t) && Date.now() - t < 90 * 86400000;
        } catch {
          return false;
        }
      },
    },
    {
      id: "no-junk", label: "no node_modules / dist committed",
      test: (d) => !fs.existsSync(path.join(d, "node_modules")) && !fs.existsSync(path.join(d, "dist")),
    },
  ],
  npm: [
    { id: "pkg-json", label: "package.json present", test: (d) => fs.existsSync(path.join(d, "package.json")) },
    {
      id: "pkg-name-version", label: "name + version set",
      test: (d) => {
        try {
          const p = JSON.parse(fs.readFileSync(path.join(d, "package.json"), "utf8"));
          return !!(p.name && p.version);
        } catch { return false; }
      },
    },
    {
      id: "pkg-desc", label: "description set",
      test: (d) => {
        try {
          const p = JSON.parse(fs.readFileSync(path.join(d, "package.json"), "utf8"));
          return !!p.description && p.description.length >= 20;
        } catch { return false; }
      },
    },
    {
      id: "pkg-entry", label: "main / exports entry",
      test: (d) => {
        try {
          const p = JSON.parse(fs.readFileSync(path.join(d, "package.json"), "utf8"));
          return !!(p.main || p.exports || p.bin);
        } catch { return false; }
      },
    },
    {
      id: "pkg-files", label: "files whitelist (publish hygiene)",
      test: (d) => {
        try {
          const p = JSON.parse(fs.readFileSync(path.join(d, "package.json"), "utf8"));
          return Array.isArray(p.files) && p.files.length > 0;
        } catch { return false; }
      },
    },
  ],
  ecosystem: [
    {
      id: "repo-field", label: "repository field (owner/repo)",
      test: (d) => {
        try {
          const p = JSON.parse(fs.readFileSync(path.join(d, "package.json"), "utf8"));
          return !!(p.repository && (typeof p.repository === "string" || p.repository.url));
        } catch { return false; }
      },
    },
    {
      id: "dsh-keywords", label: "dsh-related keywords",
      test: (d) => {
        try {
          const p = JSON.parse(fs.readFileSync(path.join(d, "package.json"), "utf8"));
          const kws = (p.keywords || []).map((k) => k.toLowerCase());
          return kws.some((k) => /dsh|harness|plugin|cordis/.test(k));
        } catch { return false; }
      },
    },
    {
      id: "plugin-export", label: "exports plugin (cordis/ctx default)",
      test: (d) => {
        try {
          const p = JSON.parse(fs.readFileSync(path.join(d, "package.json"), "utf8"));
          let files = [];
          if (p.bin) {
            files = typeof p.bin === "string" ? [p.bin] : Object.values(p.bin);
          } else {
            const entry = p.main || p.exports || "index.js";
            const file = typeof entry === "string" ? entry : (entry["."] || {}).default || "index.js";
            files = [file];
          }
          return files.some((f) => {
            const abs = path.resolve(d, f);
            return fs.existsSync(abs) && /module\.exports|export default|export {/.test(fs.readFileSync(abs, "utf8"));
          });
        } catch { return false; }
      },
    },
  ],
};

// ===== Weighted scoring (mirrors dshquality.com) =====
const WEIGHTS = { maintenance: 28, docs: 28, npm: 24, ecosystem: 20 };

function gradeOf(score) {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  return "D";
}

function lint(dir) {
  const results = {};
  let total = 0;
  let maxTotal = 0;
  for (const dim of Object.keys(CHECKS)) {
    const checks = CHECKS[dim];
    const passed = checks.filter((c) => c.test(dir));
    const dimScore = Math.round((passed.length / checks.length) * WEIGHTS[dim]);
    total += dimScore;
    maxTotal += WEIGHTS[dim];
    results[dim] = {
      score: dimScore,
      weight: WEIGHTS[dim],
      passed: passed.map((c) => c.id),
      failed: checks.filter((c) => !passed.includes(c)).map((c) => c.id),
    };
  }
  const score = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
  return { score, grade: gradeOf(score), dimensions: results };
}

// ===== CLI =====
const args = process.argv.slice(2);
const jsonMode = args.includes("--json");
const dirArg = args.find((a) => !a.startsWith("--"));
if (!dirArg) {
  console.error("Usage: node dsh-plugin-lint.js <plugin-dir> [--json]");
  process.exit(2);
}
const target = path.resolve(process.cwd(), dirArg);
if (!fs.existsSync(target)) {
  console.error(`[dsh-plugin-lint] directory not found: ${target}`);
  process.exit(2);
}

const report = lint(target);
report.dir = target;
report.generatedAt = new Date().toISOString();

if (jsonMode) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("");
  console.log(`  dsh-plugin-lint — ${target}`);
  console.log(`  Quality: ${report.grade} (${report.score}/100)`);
  console.log("");
  for (const dim of Object.keys(report.dimensions)) {
    const r = report.dimensions[dim];
    console.log(`  ${dim.padEnd(12)} ${String(r.score).padStart(2)}/${r.weight}  ${r.failed.length === 0 ? "PASS" : "WARN"}`);
    for (const f of r.failed) console.log(`    - ${f}`);
  }
  console.log("");
}
process.exit(0);
