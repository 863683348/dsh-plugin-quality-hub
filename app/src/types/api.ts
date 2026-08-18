// Shared API types - aligned with docs/api/api-spec.md §3 (openapi contract)

export type SecurityFlagType = "danger" | "warning" | "info";

export interface SecurityFlag {
  type: SecurityFlagType;
  label: string;
  detail: string;
}

export type Grade = "A" | "B" | "C" | "D" | "F";

export interface Plugin {
  id: string;
  name: string;
  owner: string;
  repoName: string;
  githubUrl: string;
  description: string | null;
  npmName?: string | null;
  score: number;
  grade: "A" | "B" | "C" | "D";
  maintenance: number;
  docs: number;
  npm: number;
  ecosystem: number;
  flags: SecurityFlag[];
  stars: number;
  lastPush: string | null;
  archived: boolean;
  updatedAt: string;
}

export interface ScoreDimension {
  score: number;
  max: number;
  weight: number;
}

export interface ScoreBreakdown {
  maintenance: ScoreDimension;
  docs: ScoreDimension;
  npm: ScoreDimension;
  ecosystem: ScoreDimension;
  total: number;
  details: Record<string, string[]>;
}

export interface ScoreLog {
  id: string;
  score: number;
  grade: "A" | "B" | "C" | "D";
  details: Record<string, string[]>;
  createdAt: string;
}

export interface PluginDetail extends Plugin {
  scoreBreakdown: ScoreBreakdown;
  scoreHistory: ScoreLog[];
  /** Latest published version on npm (nullable when no npm package) */
  npmVersion?: string | null;
  /** Weekly downloads from npm registry (nullable when no npm package) */
  npmDownloads?: number | null;
}

export interface PluginListData {
  items: Plugin[];
  total: number;
  page: number;
  totalPages: number;
}

export interface RankingData {
  items: Plugin[];
  sort: "score" | "stars" | "recent";
  updatedAt: string;
}

export interface SecurityItem {
  plugin: Plugin;
  flags: SecurityFlag[];
}

export interface SecurityData {
  items: SecurityItem[];
  total: number;
}

// ===== Security Advisory (v0.3, CVE-style) =====
export type AdvisorySeverity = "critical" | "high" | "medium" | "low";
export type AdvisoryStatus = "active" | "resolved" | "investigating";

export interface SecurityAdvisory {
  id: string;
  /** CVE-style identifier, e.g. "DSH-SA-2026-001" */
  advisoryId: string;
  title: string;
  severity: AdvisorySeverity;
  /** "owner/repo" of the affected plugin */
  pluginName: string;
  plugin?: Plugin | null;
  description: string;
  affectedRange: string;
  status: AdvisoryStatus;
  publishedAt: string;
  resolvedAt: string | null;
  updatedAt: string;
}

export interface AdvisoryListData {
  items: SecurityAdvisory[];
  total: number;
}

export interface TrendingData {
  recentlyActive: Plugin[];
  mostStarred: Plugin[];
}

export interface RefreshData {
  success: boolean;
  updatedAt: string;
}

export interface ApiEnvelope<T> {
  code: number;
  data: T;
  message: string;
}
