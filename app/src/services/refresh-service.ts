// Data refresh service - fetch + score + upsert pipeline (Spec §6.1)

import { prisma } from "@/lib/prisma";
import { cacheDelPrefix, cacheDel, cacheGet, cacheSet, cacheKeys, CACHE_TTL } from "@/lib/cache";
import {
  searchDshRepos,
  fetchRepoDetail,
  buildRepoInput,
  fetchNpmPackage,
  runSerial,
} from "@/lib/fetch-github";
import { scorePlugin, type GithubRepoInput, type NpmInput } from "@/lib/scoring";
import type { Plugin as DbPlugin } from "@prisma/client";

// ===== Refresh lock (in-memory + KV best-effort) =====
const REFRESH_LOCK_KEY = "refresh:lock";
const REFRESH_COOLDOWN_MS = 30 * 60 * 1000; // 30 min

interface RefreshState {
  lock: boolean;
  lastRefreshAt: number | null;
}

let memoryRefreshState: RefreshState = { lock: false, lastRefreshAt: null };

async function getRefreshState(): Promise<RefreshState> {
  const cached = await cacheGet<RefreshState>(REFRESH_LOCK_KEY);
  if (cached) return cached;
  return memoryRefreshState;
}

async function tryAcquireLock(): Promise<boolean> {
  const state = await getRefreshState();
  if (state.lock) return false;
  if (
    state.lastRefreshAt !== null &&
    Date.now() - state.lastRefreshAt < REFRESH_COOLDOWN_MS
  ) {
    return false;
  }
  const next: RefreshState = { lock: true, lastRefreshAt: state.lastRefreshAt };
  await cacheSet(REFRESH_LOCK_KEY, next, 30 * 60);
  memoryRefreshState = next;
  return true;
}

async function releaseLock(): Promise<void> {
  const state = await getRefreshState();
  const next: RefreshState = { lock: false, lastRefreshAt: Date.now() };
  await cacheSet(REFRESH_LOCK_KEY, next, 30 * 60);
  memoryRefreshState = next;
}

export function getLastRefreshAt(): number | null {
  return memoryRefreshState.lastRefreshAt;
}

export async function canRefresh(): Promise<{ allowed: boolean; retryAfter: Date | null }> {
  const state = await getRefreshState();
  if (state.lock) {
    return { allowed: false, retryAfter: null };
  }
  if (
    state.lastRefreshAt !== null &&
    Date.now() - state.lastRefreshAt < REFRESH_COOLDOWN_MS
  ) {
    return { allowed: false, retryAfter: new Date(state.lastRefreshAt + REFRESH_COOLDOWN_MS) };
  }
  return { allowed: true, retryAfter: null };
}

// ===== Pipeline =====

interface RefreshOutcome {
  pluginsFetched: number;
  pluginsUpdated: number;
  errors: string[];
}

export async function runRefresh(trigger: "cron" | "manual" | "deploy" = "manual"): Promise<RefreshOutcome> {
  const log = await prisma.refreshLog.create({
    data: { trigger, status: "running" },
  });

  const errors: string[] = [];
  let fetched = 0;
  let updated = 0;

  try {
    // 1. Discover repos (dsh-plugin topic)
    const rawRepos = await searchDshRepos({ perPage: 50, page: 1 });
    fetched = rawRepos.length;

    // 2-6. Serial pipeline: detail -> heuristics -> npm -> score -> upsert
    await runSerial(rawRepos, async (repo) => {
      try {
        const detail = await fetchRepoDetail(repo.owner.login, repo.name);
        if (!detail) return;

        const repoInput = await buildRepoInput(detail);
        // npm package name heuristic: try repoName first, then dsh-{repoName}
        const npmName = repoInput.repoName;
        const npmInput = await fetchNpmPackage(npmName);
        const result = scorePlugin({ repo: repoInput, npm: npmInput });

        await upsertPlugin(repoInput, npmInput, result);
        updated += 1;
      } catch (err) {
        errors.push(
          `${repo.full_name}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    });

    // 7. Clear caches + revalidate handled by caller
    await clearDataCaches();

    await prisma.refreshLog.update({
      where: { id: log.id },
      data: {
        status: "success",
        pluginsFetched: fetched,
        pluginsUpdated: updated,
        finishedAt: new Date(),
        error: errors.length > 0 ? errors.slice(0, 5).join(" | ") : null,
      },
    });
  } catch (err) {
    await prisma.refreshLog.update({
      where: { id: log.id },
      data: {
        status: "failed",
        pluginsFetched: fetched,
        pluginsUpdated: updated,
        finishedAt: new Date(),
        error: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }

  return { pluginsFetched: fetched, pluginsUpdated: updated, errors };
}

async function upsertPlugin(
  repoInput: GithubRepoInput,
  npmInput: NpmInput | null,
  result: ReturnType<typeof scorePlugin>
): Promise<void> {
  const flagsJson = JSON.stringify(result.flags);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.plugin.findUnique({ where: { name: repoInput.name } });

    const data = {
      owner: repoInput.owner,
      repoName: repoInput.repoName,
      githubUrl: repoInput.githubUrl,
      npmName: npmInput?.exists ? npmInput.name : null,
      description: repoInput.description,
      score: result.score,
      grade: result.grade,
      maintenance: result.dimensions.maintenance,
      docs: result.dimensions.docs,
      npm: result.dimensions.npm,
      ecosystem: result.dimensions.ecosystem,
      flags: flagsJson,
      stars: repoInput.stars,
      lastPush: repoInput.pushedAt ? new Date(repoInput.pushedAt) : null,
      archived: repoInput.archived,
      // v1.1 snapshot fields
      npmVersion: npmInput?.version ?? null,
      evalSource: "github",
      lastEvalAt: new Date(),
      evalMeta: { via: "refresh-endpoint" },
    };

    const plugin: DbPlugin = await tx.plugin.upsert({
      where: { name: repoInput.name },
      update: data,
      create: { name: repoInput.name, ...data },
    });

    // Only write ScoreLog if score changed (or first time) to avoid history spam
    if (!existing || existing.score !== result.score) {
      await tx.scoreLog.create({
        data: {
          pluginId: plugin.id,
          score: result.score,
          grade: result.grade,
          details: JSON.stringify(result.details),
        },
      });
    }
  });
}

// Invalidate cache keys affected by refresh (Spec §6.3 / api-spec §4.1)
export async function clearDataCaches(): Promise<void> {
  await Promise.all([
    cacheDelPrefix("plugins:"),
    cacheDelPrefix("scores:"),
    cacheDel("security:flags"),
    cacheDel("trending"),
  ]);
}
