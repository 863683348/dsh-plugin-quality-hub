// POST /api/v1/evaluate - self-service plugin quality evaluation
// Body:   { "repo": "owner/repo" } | { "url": "https://github.com/owner/repo" }
// Query:  ?repo=owner/repo   (GET, for quick curl/browser testing)
//
// Behavior:
//   - If the plugin is already ranked, returns the stored score (fast path).
//   - Otherwise fetches live GitHub + npm data, runs the scoring engine, and
//     returns the result WITHOUT persisting it (pure read-only evaluation).
//   - No GITHUB_TOKEN? GitHub unauthenticated rate limit applies; the call may
//     degrade but the API itself never 500s the badge path.

import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { ApiError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import {
  fetchRepoDetail,
  buildRepoInput,
  fetchNpmPackage,
} from "@/lib/fetch-github";
import { scorePlugin } from "@/lib/scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_BASE = "https://dshquality.com";

interface ParsedRepo {
  owner: string;
  repoName: string;
  name: string;
}

function parseRepoInput(input: unknown): ParsedRepo | null {
  if (typeof input !== "string" || input.trim().length === 0) return null;
  let s = input.trim().replace(/\.git$/, "").replace(/\/$/, "");

  const urlMatch = s.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
  if (urlMatch) {
    const owner = urlMatch[1];
    const repoName = urlMatch[2];
    return { owner, repoName, name: `${owner}/${repoName}` };
  }

  const parts = s.split("/");
  if (
    parts.length === 2 &&
    /^[\w.-]+$/.test(parts[0]) &&
    /^[\w.-]+$/.test(parts[1])
  ) {
    return { owner: parts[0], repoName: parts[1], name: s };
  }
  return null;
}

function badgeUrl(name: string): string {
  return `${SITE_BASE}/api/v1/badge/${name}`;
}

async function evaluate(req: NextRequest): Promise<ReturnType<typeof ok>> {
  let rawRepo: string | null = null;
  if (req.method === "GET") {
    rawRepo = req.nextUrl.searchParams.get("repo");
  } else {
    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    rawRepo =
      (typeof body.repo === "string" && body.repo) ||
      (typeof body.url === "string" && body.url) ||
      (typeof body.github === "string" && body.github) ||
      null;
  }

  const parsed = parseRepoInput(rawRepo);
  if (!parsed) {
    throw ApiError.badParam(
      "Invalid repo. Provide owner/repo, a GitHub URL, or ?repo=owner/repo",
      "repo"
    );
  }
  const { owner, repoName, name } = parsed;

  // 1) Already ranked → return stored score (fast path)
  const existing = await prisma.plugin.findUnique({ where: { name } });
  if (existing) {
    return ok({
      name: existing.name,
      githubUrl: existing.githubUrl,
      score: existing.score,
      grade: existing.grade,
      dimensions: {
        maintenance: existing.maintenance,
        docs: existing.docs,
        npm: existing.npm,
        ecosystem: existing.ecosystem,
      },
      npmName: existing.npmName,
      source: "cached",
      badgeUrl: badgeUrl(name),
      evaluatedAt: new Date().toISOString(),
    });
  }

  // 2) Live evaluation (read-only, not persisted)
  const raw = await fetchRepoDetail(owner, repoName);
  if (!raw) {
    throw ApiError.notFound(
      `Repository ${name} not found on GitHub or is private`
    );
  }
  const repoInput = await buildRepoInput(raw);
  const npm = await fetchNpmPackage(repoInput.repoName);
  const result = scorePlugin({ repo: repoInput, npm });

  return ok({
    name,
    githubUrl: raw.html_url,
    score: result.score,
    grade: result.grade,
    dimensions: result.dimensions,
    flags: result.flags,
    details: result.details,
    npmName: npm?.exists ? npm.name : null,
    source: "live",
    badgeUrl: badgeUrl(name),
    evaluatedAt: new Date().toISOString(),
  });
}

export async function GET(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    await rateLimit(`evaluate:${ip}`);
    return await evaluate(req);
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    await rateLimit(`evaluate:${ip}`);
    return await evaluate(req);
  } catch (err) {
    return fail(err);
  }
}
