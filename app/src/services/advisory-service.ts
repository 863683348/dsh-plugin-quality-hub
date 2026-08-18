// Security Advisory service (v0.3 - CVE-style bulletins)
// Advisories are curated: published manually or by the refresh pipeline when
// a confirmed dangerous pattern is found. DSH-SA-YYYY-NNN numbering.

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet, cacheKeys, CACHE_TTL } from "@/lib/cache";
import { mapPlugin } from "@/lib/mappers";
import type {
  AdvisorySeverity,
  AdvisoryStatus,
  Plugin as ApiPlugin,
  SecurityAdvisory as ApiAdvisory,
} from "@/types/api";

const SEVERITIES: AdvisorySeverity[] = ["critical", "high", "medium", "low"];
const STATUSES: AdvisoryStatus[] = ["active", "resolved", "investigating"];

export function parseSeverity(value: string | null): AdvisorySeverity | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase() as AdvisorySeverity;
  if ((SEVERITIES as string[]).includes(v)) return v;
  return undefined;
}

export function parseAdvisoryStatus(value: string | null): AdvisoryStatus | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase() as AdvisoryStatus;
  if ((STATUSES as string[]).includes(v)) return v;
  return undefined;
}

export interface AdvisoryListQuery {
  severity?: AdvisorySeverity;
  status?: AdvisoryStatus;
  limit: number;
}

interface AdvisoryRow {
  id: string;
  advisoryId: string;
  title: string;
  severity: string;
  pluginName: string;
  description: string;
  affectedRange: string;
  status: string;
  publishedAt: Date;
  resolvedAt: Date | null;
  updatedAt: Date;
}

function mapAdvisory(a: AdvisoryRow, plugin: ApiPlugin | null): ApiAdvisory {
  return {
    id: a.id,
    advisoryId: a.advisoryId,
    title: a.title,
    severity: a.severity as AdvisorySeverity,
    pluginName: a.pluginName,
    plugin,
    description: a.description,
    affectedRange: a.affectedRange,
    status: a.status as AdvisoryStatus,
    publishedAt: a.publishedAt.toISOString(),
    resolvedAt: a.resolvedAt ? a.resolvedAt.toISOString() : null,
    updatedAt: a.updatedAt.toISOString(),
  };
}

/** List advisories, newest first, with severity + status filters */
export async function listAdvisories(
  query: AdvisoryListQuery
): Promise<{ items: ApiAdvisory[]; total: number }> {
  const where: Prisma.SecurityAdvisoryWhereInput = {};
  if (query.severity) where.severity = query.severity;
  if (query.status) where.status = query.status;

  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const rows = await prisma.securityAdvisory.findMany({
    where,
    take: query.limit,
  });

  // Resolve plugin rows for the affected plugins (bulk fetch)
  const pluginNames = [...new Set(rows.map((r) => r.pluginName))];
  const dbPlugins = pluginNames.length
    ? await prisma.plugin.findMany({ where: { name: { in: pluginNames } } })
    : [];
  const pluginMap = new Map(dbPlugins.map((p) => [p.name, mapPlugin(p)]));

  // Sort by severity (critical first), then publishedAt desc
  const items = rows
    .sort((a, b) => {
      const sa = severityOrder[a.severity] ?? 99;
      const sb = severityOrder[b.severity] ?? 99;
      if (sa !== sb) return sa - sb;
      return b.publishedAt.getTime() - a.publishedAt.getTime();
    })
    .map((a) => mapAdvisory(a, pluginMap.get(a.pluginName) ?? null));

  const total = await prisma.securityAdvisory.count({ where });

  return { items, total };
}

export async function getCachedAdvisories(
  query: AdvisoryListQuery
): Promise<{ items: ApiAdvisory[]; total: number }> {
  const cacheKey = cacheKeys.advisories;
  const cached = await cacheGet<{ items: ApiAdvisory[]; total: number }>(cacheKey);
  if (cached) return cached;

  const result = await listAdvisories({ severity: undefined, status: undefined, limit: 100 });
  await cacheSet(cacheKey, result, CACHE_TTL.advisories);

  // Apply filters after cache (cache stores unfiltered list)
  let items = result.items;
  let total = result.total;
  if (query.severity) {
    const matched = items.filter((a) => a.severity === query.severity);
    items = matched;
    total = matched.length;
  }
  if (query.status) {
    const matched = items.filter((a) => a.status === query.status);
    items = matched;
    total = matched.length;
  }
  return { items: items.slice(0, query.limit), total };
}

// ===== Seed data =====
// Realistic advisories derived from actual evaluation findings (Batch 1 + Batch 2):
// - curl|sh dangerous install scripts (mirage, openpencil were force-downgraded to D)
// - archived repos with stale security posture

const SEED_ADVISORIES: Array<{
  advisoryId: string;
  title: string;
  severity: AdvisorySeverity;
  pluginName: string;
  description: string;
  affectedRange: string;
  status: AdvisoryStatus;
}> = [
  {
    advisoryId: "DSH-SA-2026-001",
    title: "mirage install script executes remote code via curl|sh",
    severity: "critical",
    pluginName: "strukto-ai/mirage",
    description:
      "The install script pipes a remote script directly into sh (curl ... | sh). A compromised CDN or versioned tarball would execute arbitrary code on the host with the user's privileges. Flagged by the heuristic scanner; plugin grade forced to D.",
    affectedRange: "all versions",
    status: "active",
  },
  {
    advisoryId: "DSH-SA-2026-002",
    title: "openpencil ships download-and-execute bootstrap script",
    severity: "high",
    pluginName: "ZSeven-W/openpencil",
    description:
      "The bootstrap downloads a binary and executes it without checksum verification (curl|sh pattern). Supply-chain risk is high. Plugin grade forced to D.",
    affectedRange: "all versions",
    status: "active",
  },
  {
    advisoryId: "DSH-SA-2026-003",
    title: "archived repositories with unpatched install patterns",
    severity: "medium",
    pluginName: "devflow/context-compressor",
    description:
      "Repository is archived and no longer maintained. Archived plugins cannot receive security fixes; usage should be audited and pinned before install.",
    affectedRange: "latest commit",
    status: "investigating",
  },
  {
    advisoryId: "DSH-SA-2026-004",
    title: "tag-baiting projects inflate star counts",
    severity: "low",
    pluginName: "dsh-hub/plugin-stack",
    description:
      "216 tag-baiting projects captured 23% of ecosystem stars, distorting popularity signals. This advisory tracks the ecosystem-level concern rather than a single plugin vulnerability.",
    affectedRange: "n/a",
    status: "active",
  },
];

/** Idempotent seed: creates advisories that don't exist yet (by advisoryId). */
export async function seedAdvisories(): Promise<number> {
  let created = 0;
  for (const seed of SEED_ADVISORIES) {
    const existing = await prisma.securityAdvisory.findUnique({
      where: { advisoryId: seed.advisoryId },
    });
    if (!existing) {
      await prisma.securityAdvisory.create({
        data: {
          ...seed,
          severity: seed.severity,
          status: seed.status,
          // Link to plugin if it exists (name = "owner/repo")
          pluginName: seed.pluginName,
        },
      });
      created += 1;
    }
  }
  // Ensure pluginName references are resolvable when the plugin exists
  // (if not, the advisory still shows with plugin: null)
  return created;
}
