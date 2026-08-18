// Mappers: Prisma model -> API DTO (docs/api/api-spec.md §3)

import type { Plugin as DbPlugin, ScoreLog as DbScoreLog } from "@prisma/client";
import type {
  Plugin as ApiPlugin,
  PluginDetail,
  ScoreBreakdown,
  ScoreLog,
  SecurityFlag,
} from "@/types/api";
import { WEIGHTS, MAX_SCORES } from "@/lib/scoring";

export function mapFlags(raw: unknown): SecurityFlag[] {
  if (Array.isArray(raw)) {
    return raw.filter(
      (item): item is SecurityFlag =>
        typeof item === "object" &&
        item !== null &&
        "type" in item &&
        "label" in item &&
        "detail" in item
    );
  }
  return [];
}

export function mapPlugin(p: DbPlugin): ApiPlugin {
  return {
    id: p.id,
    name: p.name,
    owner: p.owner,
    repoName: p.repoName,
    githubUrl: p.githubUrl,
    description: p.description,
    npmName: p.npmName,
    score: p.score,
    grade: (p.grade === "F" ? "D" : p.grade) as ApiPlugin["grade"],
    maintenance: p.maintenance,
    docs: p.docs,
    npm: p.npm,
    ecosystem: p.ecosystem,
    flags: mapFlags(p.flags),
    stars: p.stars,
    lastPush: p.lastPush ? p.lastPush.toISOString() : null,
    archived: p.archived,
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function buildScoreBreakdown(p: DbPlugin, details: Record<string, string[]>): ScoreBreakdown {
  return {
    maintenance: {
      score: p.maintenance,
      max: MAX_SCORES.maintenance,
      weight: WEIGHTS.maintenance,
    },
    docs: { score: p.docs, max: MAX_SCORES.docs, weight: WEIGHTS.docs },
    npm: { score: p.npm, max: MAX_SCORES.npm, weight: WEIGHTS.npm },
    ecosystem: {
      score: p.ecosystem,
      max: MAX_SCORES.ecosystem,
      weight: WEIGHTS.ecosystem,
    },
    total: p.score,
    details,
  };
}

export function mapScoreLog(log: DbScoreLog): ScoreLog {
  const details =
    typeof log.details === "object" && log.details !== null
      ? (log.details as Record<string, string[]>)
      : {};
  return {
    id: log.id,
    score: log.score,
    grade: (log.grade === "F" ? "D" : log.grade) as ScoreLog["grade"],
    details,
    createdAt: log.createdAt.toISOString(),
  };
}

export function mapPluginDetail(
  p: DbPlugin,
  latestLog: DbScoreLog | null,
  history: DbScoreLog[]
): PluginDetail {
  const details =
    latestLog && typeof latestLog.details === "object" && latestLog.details !== null
      ? (latestLog.details as Record<string, string[]>)
      : { maintenance: [], docs: [], npm: [], ecosystem: [] };

  return {
    ...mapPlugin(p),
    scoreBreakdown: buildScoreBreakdown(p, details),
    scoreHistory: history.map(mapScoreLog),
  };
}
