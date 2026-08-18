// Scoring engine - four-dimension weighted scoring
// Weights (calibrated 2026-08-18): maintenance 28% + docs 28% + npm 24% + ecosystem 20%

import type { Grade, SecurityFlag, SecurityFlagType } from "@/types/api";

// ===== Types =====

export interface GithubRepoInput {
  name: string; // "owner/repo"
  owner: string;
  repoName: string;
  githubUrl: string;
  description: string | null;
  stars: number;
  pushedAt: string | null; // ISO date
  archived: boolean;
  // Repo content heuristics (fetched from GitHub contents API)
  readmeLength: number; // README text length
  hasLicense: boolean;
  hasCi: boolean; // .github/workflows present
  openIssues: number;
  hasDshBundle: boolean; // dsh.bundle declaration exists
  installScriptText: string; // normalized install script / package.json scripts text
}

export interface NpmInput {
  name: string;
  version: string | null;
  lastPublishAt: string | null; // ISO date
  weeklyDownloads: number;
  hasInstallScripts: boolean; // package.json scripts.install/preinstall/postinstall
  // Legacy npmName heuristic fallback: if npm package does not exist this is null
  exists: boolean;
}

export interface ScoringInput {
  repo: GithubRepoInput;
  npm: NpmInput | null;
}

export interface DimensionScores {
  maintenance: number; // /30
  docs: number; // /25
  npm: number; // /30
  ecosystem: number; // /15
}

export interface ScoreResult {
  score: number; // 0-100
  grade: Grade;
  dimensions: DimensionScores;
  details: Record<string, string[]>;
  flags: SecurityFlag[];
}

// ===== Danger install script patterns (Spec AC-06 / api-spec §2.4) =====
const DANGER_PATTERNS: RegExp[] = [
  /curl[^\n|&;]*\|\s*(ba)?sh/i,
  /\/dev\/tcp\//i,
  /\bbase64\s+-d/i,
  /\biex\b/i, // PowerShell Invoke-Expression
  /powershell\s+-(enc|encodedcommand)/i,
];

// ===== Weights =====
// Calibrated 2026-08-18 from real plugin data (142 plugins):
//   - docs:    higher normalized spread (0.301) & strong corr (0.914) -> 28%
//   - npm:     weakest corr (0.859) and lowest spread (0.249) -> 24%
//   - ecosystem: strong corr (0.916) but stars should not dominate -> 20%
//   - maintenance: keep as anchor dimension -> 28%
// Weights sum to 100%. See scripts/weight-calibrate.mts + weight-simulate.mts.
export const WEIGHTS = {
  maintenance: 0.28,
  docs: 0.28,
  npm: 0.24,
  ecosystem: 0.2,
} as const;

export const MAX_SCORES = {
  maintenance: 30,
  docs: 25,
  npm: 30,
  ecosystem: 15,
} as const;

// ===== Flag helpers =====
function flag(type: SecurityFlagType, label: string, detail: string): SecurityFlag {
  return { type, label, detail };
}

// ===== Maintenance scoring (/30) =====
function scoreMaintenance(repo: GithubRepoInput): { score: number; details: string[] } {
  const details: string[] = [];
  let score: number = MAX_SCORES.maintenance;

  // Recency of last push
  const pushedAt = repo.pushedAt ? new Date(repo.pushedAt).getTime() : null;
  const now = Date.now();
  const daysSincePush = pushedAt ? (now - pushedAt) / 86_400_000 : null;

  if (daysSincePush === null) {
    score -= 10;
    details.push("No push activity data available (-10)");
  } else if (daysSincePush > 365) {
    score -= 10;
    details.push(`Last push over 1 year ago (${Math.round(daysSincePush)} days) (-10)`);
  } else if (daysSincePush > 180) {
    score -= 7;
    details.push(`Last push over 180 days ago (${Math.round(daysSincePush)} days) (-7)`);
  } else if (daysSincePush > 90) {
    score -= 4;
    details.push(`Last push over 90 days ago (${Math.round(daysSincePush)} days) (-4)`);
  }

  // Open issues backlog (density relative to stars)
  if (repo.openIssues > 50 && repo.stars > 0) {
    score -= 3;
    details.push(`Open issues backlog (${repo.openIssues}) (-3)`);
  } else if (repo.openIssues > 20) {
    score -= 2;
    details.push(`Open issues over 20 (${repo.openIssues}) (-2)`);
  }

  // Archived repos are not maintained
  if (repo.archived) {
    score -= 8;
    details.push("Repository is archived, no longer maintained (-8)");
  }

  // CI presence indicates active engineering
  if (repo.hasCi) {
    score = Math.min(score + 1, MAX_SCORES.maintenance);
    details.push("CI workflow detected (+1)");
  }

  return { score: Math.max(0, score), details };
}

// ===== Docs scoring (/25) =====
function scoreDocs(repo: GithubRepoInput): { score: number; details: string[] } {
  const details: string[] = [];
  let score = MAX_SCORES.docs;

  if (repo.readmeLength < 50) {
    score -= 15;
    details.push("README missing or nearly empty (-15)");
  } else if (repo.readmeLength < 200) {
    score -= 8;
    details.push("README length below 200 words (-8)");
  } else if (repo.readmeLength < 500) {
    score -= 3;
    details.push("README could be more detailed (-3)");
  }

  if (!repo.hasLicense) {
    score -= 5;
    details.push("Missing license file (-5)");
  }

  return { score: Math.max(0, score), details };
}

// ===== npm scoring (/30) =====
function scoreNpm(npm: NpmInput | null): { score: number; details: string[] } {
  const details: string[] = [];
  if (!npm || !npm.exists) {
    return { score: 10, details: ["No npm package found, ecosystem integration limited (+10 baseline)"] };
  }

  let score = MAX_SCORES.npm;

  // Weekly downloads
  if (npm.weeklyDownloads >= 10_000) {
    score = score; // full marks for downloads
  } else if (npm.weeklyDownloads >= 1000) {
    score -= 2;
    details.push(`Weekly downloads moderate (${npm.weeklyDownloads}) (-2)`);
  } else if (npm.weeklyDownloads >= 100) {
    score -= 6;
    details.push(`Weekly downloads low (${npm.weeklyDownloads}) (-6)`);
  } else {
    score -= 10;
    details.push(`Weekly downloads very low (${npm.weeklyDownloads}) (-10)`);
  }

  // Freshness of publish
  if (npm.lastPublishAt) {
    const days = (Date.now() - new Date(npm.lastPublishAt).getTime()) / 86_400_000;
    if (days > 365) {
      score -= 8;
      details.push(`npm package not published in over a year (${Math.round(days)} days) (-8)`);
    } else if (days > 180) {
      score -= 4;
      details.push(`npm package not published in 6+ months (${Math.round(days)} days) (-4)`);
    }
  }

  // Dangerous install scripts drastically reduce npm score
  if (npm.hasInstallScripts) {
    score -= 5;
    details.push("npm package declares install scripts (-5)");
  }

  return { score: Math.max(0, score), details };
}

// ===== Ecosystem scoring (/15) =====
function scoreEcosystem(repo: GithubRepoInput, npm: NpmInput | null): { score: number; details: string[] } {
  const details: string[] = [];
  let score = 0;

  // Stars reflect community adoption.
  // Log-scale scoring: every 10x of stars adds ~1.7 points, so a 5-star repo vs
  // a 500-star repo are separated naturally without crushing small repos.
  //   1 star  -> 0.0, 10 -> 1.7, 100 -> 3.4, 1000 -> 5.1, 10000 -> 6.8
  if (repo.stars > 0) {
    const logScore = Math.log10(repo.stars + 1);
    // Cap at 7 (reached around 60k stars) so extreme repos cannot dominate
    score += Math.min(7, logScore * 1.7);
    details.push(`Stars ${repo.stars} (log-scale +${Math.min(7, logScore * 1.7).toFixed(1)})`);
  }

  // npm presence boosts ecosystem integration
  if (npm && npm.exists) {
    score += 4;
    details.push("Published on npm (+4)");
  }

  // dsh.bundle declaration indicates plugin ecosystem compliance
  if (repo.hasDshBundle) {
    score += 4;
    details.push("dsh.bundle declaration present (+4)");
  }

  return { score: Math.min(MAX_SCORES.ecosystem, score), details };
}

// ===== Security flag detection (Spec AC-06) =====
export function detectSecurityFlags(repo: GithubRepoInput): SecurityFlag[] {
  const flags: SecurityFlag[] = [];

  // danger: dangerous install script
  const matched = DANGER_PATTERNS.find((pattern) => pattern.test(repo.installScriptText));
  if (matched) {
    flags.push(
      flag(
        "danger",
        "危险安装脚本",
        `检测到危险安装脚本模式 (${matched.source})，可能在安装时执行任意代码`
      )
    );
  }

  // warning: missing dsh.bundle declaration
  if (!repo.hasDshBundle) {
    flags.push(
      flag(
        "warning",
        "缺失 dsh.bundle 声明",
        "仓库中未找到 dsh.bundle 声明文件，无法确认插件接口兼容性"
      )
    );
  }

  // info: archived repo
  if (repo.archived) {
    flags.push(flag("info", "仓库已归档", "该仓库已被 GitHub 归档，处于只读状态"));
  }

  return flags;
}

// ===== Grade assignment =====
// A>=80 / B>=60 / C>=40 / D<40 或有 danger 标记时等级不高于 D (Spec AC-06)
export function assignGrade(score: number, hasDanger: boolean): Grade {
  let grade: Grade;
  if (score >= 80) grade = "A";
  else if (score >= 60) grade = "B";
  else if (score >= 40) grade = "C";
  else grade = "D";

  if (hasDanger) {
    // Force to D when a danger flag is present (never above D)
    grade = "D";
  }
  return grade;
}

// ===== Main scoring entry =====
export function scorePlugin(input: ScoringInput): ScoreResult {
  const { repo, npm } = input;

  // Detect flags first (grade depends on danger presence)
  const flags = detectSecurityFlags(repo);
  const hasDanger = flags.some((f) => f.type === "danger");

  const maintenance = scoreMaintenance(repo);
  const docs = scoreDocs(repo);
  const npmScores = scoreNpm(npm);
  const ecosystem = scoreEcosystem(repo, npm);

  const dimensions: DimensionScores = {
    maintenance: maintenance.score,
    docs: docs.score,
    npm: npmScores.score,
    ecosystem: ecosystem.score,
  };

  // Weighted total: normalize each dimension to 0-100 before applying weight.
  // Each dimension has a different max (30/25/30/15); the weight applies to the
  // *percentage* of the max, not the raw absolute score. (P0 fix from QA)
  const total = Math.round(
    (dimensions.maintenance / MAX_SCORES.maintenance) * (WEIGHTS.maintenance * 100) +
      (dimensions.docs / MAX_SCORES.docs) * (WEIGHTS.docs * 100) +
      (dimensions.npm / MAX_SCORES.npm) * (WEIGHTS.npm * 100) +
      (dimensions.ecosystem / MAX_SCORES.ecosystem) * (WEIGHTS.ecosystem * 100)
  );

  const score = Math.min(100, Math.max(0, total));
  const grade = assignGrade(score, hasDanger);

  return {
    score,
    grade,
    dimensions,
    details: {
      maintenance: maintenance.details,
      docs: docs.details,
      npm: npmScores.details,
      ecosystem: ecosystem.details,
    },
    flags,
  };
}
