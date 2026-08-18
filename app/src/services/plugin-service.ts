// Plugin query service - business logic for plugin queries (no HTTP concerns)

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet, cacheKeys, CACHE_TTL } from "@/lib/cache";
import { mapPlugin, mapPluginDetail } from "@/lib/mappers";
import { ApiError } from "@/lib/errors";
import type { Plugin as ApiPlugin, PluginDetail, SecurityFlag } from "@/types/api";

export type PluginSortField = "score" | "stars" | "lastPush" | "updatedAt";
export type PluginSortOrder = "asc" | "desc";

export interface PluginListQuery {
  page: number;
  limit: number;
  q?: string;
  grade?: string;
  sort: PluginSortField;
  order: PluginSortOrder;
}

export interface PluginListResult {
  items: ApiPlugin[];
  total: number;
  page: number;
  totalPages: number;
}

// ===== Validation helpers =====
const SORT_FIELDS: PluginSortField[] = ["score", "stars", "lastPush", "updatedAt"];
const GRADES = ["A", "B", "C", "D"];

export function parseSortField(value: string | null): PluginSortField {
  if (!value) return "score";
  if ((SORT_FIELDS as string[]).includes(value)) return value as PluginSortField;
  throw ApiError.badParam(
    `Invalid parameter: sort must be one of ${SORT_FIELDS.join(", ")}`,
    "sort"
  );
}

export function parseSortOrder(value: string | null): PluginSortOrder {
  if (!value) return "desc";
  if (value === "asc" || value === "desc") return value;
  throw ApiError.badParam("Invalid parameter: order must be one of asc, desc", "order");
}

export function parsePagination(
  pageRaw: string | null,
  limitRaw: string | null,
  maxLimit: number
): { page: number; limit: number } {
  let page = 1;
  let limit = maxLimit;
  if (pageRaw !== null) {
    page = Number(pageRaw);
    if (!Number.isInteger(page) || page < 1 || page > 10000) {
      throw ApiError.badParam("Invalid parameter: page must be between 1 and 10000", "page");
    }
  }
  if (limitRaw !== null) {
    limit = Number(limitRaw);
    if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
      throw ApiError.badParam(
        `Invalid parameter: limit must be between 1 and ${maxLimit}`,
        "limit"
      );
    }
  }
  return { page, limit };
}

export function parseGrade(value: string | null): string | undefined {
  if (!value) return undefined;
  const upper = value.toUpperCase();
  if (!(GRADES as string[]).includes(upper)) {
    throw ApiError.badParam("Invalid parameter: grade must be one of A, B, C, D", "grade");
  }
  return upper;
}

// ===== Query builders =====
function buildWhere(query: PluginListQuery): Prisma.PluginWhereInput {
  const where: Prisma.PluginWhereInput = {};
  if (query.grade) {
    where.grade = query.grade;
  }
  if (query.q) {
    const q = query.q.trim();
    if (q.length > 0) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { owner: { contains: q, mode: "insensitive" } },
        { repoName: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }
  }
  return where;
}

function parseSortOrderForDb(order: PluginSortOrder): Prisma.SortOrder {
  return order === "asc" ? "asc" : "desc";
}

// ===== List =====
export async function listPlugins(query: PluginListQuery): Promise<PluginListResult> {
  const where = buildWhere(query);
  const orderBy = parseSortOrderForDb(query.order);

  const [items, total] = await prisma.$transaction([
    prisma.plugin.findMany({
      where,
      orderBy: { [query.sort]: orderBy },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.plugin.count({ where }),
  ]);

  return {
    items: items.map(mapPlugin),
    total,
    page: query.page,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

// ===== Detail =====
export async function getPluginDetail(name: string): Promise<PluginDetail> {
  const plugin = await prisma.plugin.findUnique({ where: { name } });
  if (!plugin) {
    throw ApiError.notFound(`Plugin "${name}" not found`);
  }

  const [latestLog, history] = await Promise.all([
    prisma.scoreLog.findFirst({
      where: { pluginId: plugin.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.scoreLog.findMany({
      where: { pluginId: plugin.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return mapPluginDetail(plugin, latestLog, history);
}

// ===== Rankings =====
export type RankingSort = "score" | "stars" | "recent";

export function parseRankingSort(value: string | null): RankingSort {
  if (!value) return "score";
  if (value === "score" || value === "stars" || value === "recent") return value;
  throw ApiError.badParam(
    "Invalid parameter: sort must be one of score, stars, recent",
    "sort"
  );
}

export async function getRankings(
  sort: RankingSort,
  limit: number
): Promise<{ items: ApiPlugin[]; sort: RankingSort; updatedAt: string }> {
  let orderBy:
    | Prisma.PluginOrderByWithRelationInput
    | Prisma.PluginOrderByWithRelationInput[];
  switch (sort) {
    case "stars":
      orderBy = { stars: "desc" };
      break;
    case "recent":
      orderBy = { lastPush: "desc" };
      break;
    default:
      orderBy = [{ score: "desc" }, { stars: "desc" }];
  }

  const plugins = await prisma.plugin.findMany({
    orderBy,
    take: limit,
  });

  return {
    items: plugins.map(mapPlugin),
    sort,
    updatedAt: new Date().toISOString(),
  };
}

// ===== Security =====
export type SecurityFlagType = "danger" | "warning" | "info";

export function parseSecurityType(value: string | null): SecurityFlagType | undefined {
  if (!value) return undefined;
  if (value === "danger" || value === "warning" || value === "info") return value;
  throw ApiError.badParam(
    "Invalid parameter: type must be one of danger, warning, info",
    "type"
  );
}

function hasFlag(flags: SecurityFlag[], type: SecurityFlagType): boolean {
  return flags.some((f) => f.type === type);
}

export async function getSecurityItems(
  type: SecurityFlagType | undefined,
  limit: number
): Promise<{ items: Array<{ plugin: ApiPlugin; flags: SecurityFlag[] }>; total: number }> {
  const plugins = await prisma.plugin.findMany({
    orderBy: { score: "asc" },
    take: 500, // Scan enough rows; filter in app layer (Json flags not indexable per db-schema §4.3)
  });

  const filtered = plugins.filter((p) => {
    const flags = mapPlugin(p).flags;
    if (flags.length === 0) return false;
    if (type) return hasFlag(flags, type);
    return true;
  });

  const items = filtered.slice(0, limit).map((p) => {
    const apiPlugin = mapPlugin(p);
    return { plugin: apiPlugin, flags: apiPlugin.flags };
  });

  return { items, total: filtered.length };
}

// ===== Trending =====
export async function getTrending(limit: number): Promise<{
  recentlyActive: ApiPlugin[];
  mostStarred: ApiPlugin[];
}> {
  const [recentlyActive, mostStarred] = await Promise.all([
    prisma.plugin.findMany({
      where: { lastPush: { not: null } },
      orderBy: { lastPush: "desc" },
      take: limit,
    }),
    prisma.plugin.findMany({
      orderBy: { stars: "desc" },
      take: limit,
    }),
  ]);

  return {
    recentlyActive: recentlyActive.map(mapPlugin),
    mostStarred: mostStarred.map(mapPlugin),
  };
}

// ===== Cached accessors =====
export async function getCachedPluginList(
  query: PluginListQuery
): Promise<PluginListResult> {
  // Cache only for the default view (no search/filter); custom queries hit DB directly
  const isCacheable = !query.q && !query.grade && query.page === 1 && query.sort === "score" && query.order === "desc";
  if (!isCacheable) return listPlugins(query);

  const cacheKey = cacheKeys.pluginsList;
  const cached = await cacheGet<PluginListResult>(cacheKey);
  if (cached) return cached;

  const result = await listPlugins(query);
  await cacheSet(cacheKey, result, CACHE_TTL.pluginsList);
  return result;
}

export async function getCachedPluginDetail(name: string): Promise<PluginDetail> {
  const cacheKey = cacheKeys.pluginDetail(name);
  const cached = await cacheGet<PluginDetail>(cacheKey);
  if (cached) return cached;

  const result = await getPluginDetail(name);
  await cacheSet(cacheKey, result, CACHE_TTL.pluginDetail);
  return result;
}

export async function getCachedSecurity(
  type: SecurityFlagType | undefined,
  limit: number
): Promise<{ items: Array<{ plugin: ApiPlugin; flags: SecurityFlag[] }>; total: number }> {
  const cacheKey = cacheKeys.security;
  const cached = await cacheGet<{ items: Array<{ plugin: ApiPlugin; flags: SecurityFlag[] }>; total: number }>(cacheKey);
  if (cached) return cached;

  const result = await getSecurityItems(undefined, 500);
  await cacheSet(cacheKey, result, CACHE_TTL.security);

  // Apply type filter after cache (cache stores unfiltered)
  if (type) {
    const matched = result.items.filter((item) =>
      item.flags.some((f) => f.type === type)
    );
    return { items: matched.slice(0, limit), total: matched.length };
  }
  return { items: result.items.slice(0, limit), total: result.total };
}

export async function getCachedTrending(
  limit: number
): Promise<{ recentlyActive: ApiPlugin[]; mostStarred: ApiPlugin[] }> {
  const cacheKey = cacheKeys.trending;
  const cached = await cacheGet<{ recentlyActive: ApiPlugin[]; mostStarred: ApiPlugin[] }>(cacheKey);
  if (cached) return cached;

  const result = await getTrending(limit);
  await cacheSet(cacheKey, result, CACHE_TTL.trending);
  return result;
}
