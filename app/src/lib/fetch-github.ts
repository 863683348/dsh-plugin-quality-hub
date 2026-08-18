// GitHub + npm data fetching
// Strategy (ADR-003): authenticated token + ETag conditional requests + serial queue (wait 1s per 10) + exponential backoff

import { cacheGet, cacheSet, cacheKeys, CACHE_TTL } from "@/lib/cache";
import type { GithubRepoInput, NpmInput } from "@/lib/scoring";

const GITHUB_API = "https://api.github.com";
const NPM_REGISTRY = "https://registry.npmjs.org";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ===== Serial queue with per-10-requests 1s pause =====
let requestCount = 0;

async function rateLimitPause(): Promise<void> {
  requestCount += 1;
  if (requestCount % 10 === 0) {
    await sleep(1000);
  }
}

// ===== Exponential backoff fetch =====
async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  maxRetries = 4
): Promise<Response> {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(url, options);
      if (res.status === 403 || res.status === 429) {
        // Respect GitHub rate-limit reset header
        const reset = res.headers.get("X-RateLimit-Reset");
        if (reset) {
          const waitMs = Math.max(1000, Number(reset) * 1000 - Date.now());
          await sleep(Math.min(waitMs, 60_000));
        }
      }
      if (res.status >= 500 && attempt < maxRetries) {
        const delay = 1000 * 2 ** attempt; // 1s -> 2s -> 4s -> 8s
        await sleep(delay);
        attempt += 1;
        continue;
      }
      return res;
    } catch {
      if (attempt < maxRetries) {
        const delay = 1000 * 2 ** attempt;
        await sleep(delay);
        attempt += 1;
        continue;
      }
      throw new Error(`Network failure after ${maxRetries} retries: ${url}`);
    }
  }
}

// ===== GitHub API =====

export interface GithubRepoRaw {
  full_name: string;
  owner: { login: string };
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  pushed_at: string | null;
  archived: boolean;
  open_issues_count: number;
  default_branch: string | null;
}

export interface GithubRepoEnriched extends GithubRepoRaw {
  // Heuristic fields
  readmeLength: number;
  hasLicense: boolean;
  hasCi: boolean;
  hasDshBundle: boolean;
  installScriptText: string;
}

// Search repos with dsh-plugin topic
export async function searchDshRepos(options?: {
  perPage?: number;
  page?: number;
}): Promise<GithubRepoRaw[]> {
  const perPage = options?.perPage ?? 50;
  const page = options?.page ?? 1;
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "dsh-plugin-quality-hub",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  await rateLimitPause();
  const res = await fetchWithBackoff(
    `${GITHUB_API}/search/repositories?q=topic:dsh-plugin&sort=stars&order=desc&per_page=${perPage}&page=${page}`,
    { headers }
  );
  if (res.status === 304) return [];
  if (!res.ok) {
    throw new Error(`GitHub search failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { items?: GithubRepoRaw[] };
  return data.items ?? [];
}

// Fetch repo detail with ETag conditional request (cache in KV, TTL 7d)
export async function fetchRepoDetail(
  owner: string,
  repoName: string
): Promise<GithubRepoRaw | null> {
  const repoKey = `${owner}/${repoName}`;
  const etagKey = cacheKeys.githubEtag(repoKey);
  const etag = await cacheGet<string>(etagKey);

  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "dsh-plugin-quality-hub",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (etag) headers["If-None-Match"] = etag;

  await rateLimitPause();
  const res = await fetchWithBackoff(`${GITHUB_API}/repos/${owner}/${repoName}`, { headers });

  if (res.status === 304) {
    // Not modified - use cached repo body (github:repo:{repo}, TTL 7d)
    return await cacheGet<GithubRepoRaw>(`github:repo:${repoKey}`);
  }
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub repo fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as GithubRepoRaw;
  // Cache body + etag for 7 days
  const newEtag = res.headers.get("ETag");
  if (newEtag) {
    await cacheSet(etagKey, newEtag, CACHE_TTL.githubEtag);
    await cacheSet(`github:repo:${repoKey}`, data, CACHE_TTL.githubEtag);
  }
  return data;
}

// Fetch repo content heuristics: README, license, CI workflows, dsh.bundle, install scripts
export async function fetchRepoHeuristics(
  owner: string,
  repoName: string
): Promise<{
  readmeLength: number;
  hasLicense: boolean;
  hasCi: boolean;
  hasDshBundle: boolean;
  installScriptText: string;
}> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "dsh-plugin-quality-hub",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let readmeLength = 0;
  let hasLicense = false;
  let hasCi = false;
  let hasDshBundle = false;
  let installScriptText = "";

  // README (README.md or README.MD)
  await rateLimitPause();
  const readmeRes = await fetchWithBackoff(
    `${GITHUB_API}/repos/${owner}/${repoName}/readme`,
    { headers }
  );
  if (readmeRes.ok) {
    const readme = (await readmeRes.json()) as { content?: string; encoding?: string };
    if (readme.content) {
      const text =
        readme.encoding === "base64"
          ? Buffer.from(readme.content, "base64").toString("utf8")
          : readme.content;
      readmeLength = text.length;
      // Install script heuristics: scan README for curl|sh patterns
      installScriptText += text;
    }
  }

  // License file
  await rateLimitPause();
  const licenseRes = await fetchWithBackoff(
    `${GITHUB_API}/repos/${owner}/${repoName}/license`,
    { headers }
  );
  hasLicense = licenseRes.ok;

  // CI: check for .github/workflows directory
  await rateLimitPause();
  const ciRes = await fetchWithBackoff(
    `${GITHUB_API}/repos/${owner}/${repoName}/contents/.github/workflows`,
    { headers }
  );
  hasCi = ciRes.ok && Array.isArray(await ciRes.json());

  // dsh.bundle declaration: check root contents for dsh.bundle / dsh-bundle files
  await rateLimitPause();
  const rootRes = await fetchWithBackoff(
    `${GITHUB_API}/repos/${owner}/${repoName}/contents/`,
    { headers }
  );
  if (rootRes.ok) {
    const entries = (await rootRes.json()) as Array<{ name: string }>;
    hasDshBundle = entries.some((e) =>
      /^dsh\.bundle(\.ya?ml|\.json)?$/i.test(e.name)
    );
  }

  // package.json install scripts (if repo is an npm package)
  await rateLimitPause();
  const pkgRes = await fetchWithBackoff(
    `${GITHUB_API}/repos/${owner}/${repoName}/contents/package.json`,
    { headers }
  );
  if (pkgRes.ok) {
    const pkg = (await pkgRes.json()) as { content?: string; encoding?: string };
    if (pkg.content) {
      const text =
        pkg.encoding === "base64"
          ? Buffer.from(pkg.content, "base64").toString("utf8")
          : pkg.content;
      try {
        const parsed = JSON.parse(text) as {
          scripts?: Record<string, string>;
        };
        const scripts = parsed.scripts ?? {};
        installScriptText += " " + Object.values(scripts).join(" ");
      } catch {
        // ignore malformed package.json
      }
    }
  }

  return { readmeLength, hasLicense, hasCi, hasDshBundle, installScriptText };
}

// Build enriched repo input for scoring
export async function buildRepoInput(raw: GithubRepoRaw): Promise<GithubRepoInput> {
  const heuristics = await fetchRepoHeuristics(raw.owner.login, raw.name);
  return {
    name: raw.full_name,
    owner: raw.owner.login,
    repoName: raw.name,
    githubUrl: raw.html_url,
    description: raw.description,
    stars: raw.stargazers_count,
    pushedAt: raw.pushed_at,
    archived: raw.archived,
    readmeLength: heuristics.readmeLength,
    hasLicense: heuristics.hasLicense,
    hasCi: heuristics.hasCi,
    openIssues: raw.open_issues_count,
    hasDshBundle: heuristics.hasDshBundle,
    installScriptText: heuristics.installScriptText,
  };
}

// ===== npm registry =====

export async function fetchNpmPackage(packageName: string): Promise<NpmInput | null> {
  const cacheKey = cacheKeys.npm(packageName);
  const cached = await cacheGet<NpmInput>(cacheKey);
  if (cached) return cached;

  const res = await fetchWithBackoff(`${NPM_REGISTRY}/${encodeURIComponent(packageName)}`, {
    headers: { Accept: "application/vnd.npm.install-v1+json" },
  });

  if (!res.ok) {
    // Package not found on npm
    const result: NpmInput = {
      name: packageName,
      version: null,
      lastPublishAt: null,
      weeklyDownloads: 0,
      hasInstallScripts: false,
      exists: false,
    };
    await cacheSet(cacheKey, result, CACHE_TTL.npm);
    return result;
  }

  const data = (await res.json()) as {
    "dist-tags"?: { latest?: string };
    time?: Record<string, string>;
    versions?: Record<string, { scripts?: Record<string, string> }>;
  };

  const version = data["dist-tags"]?.latest ?? null;
  const lastPublishAt = version ? (data.time?.[version] ?? null) : null;

  // Weekly downloads from api.npmjs.org/downloads/point/last-week/{name}
  let weeklyDownloads = 0;
  const dlRes = await fetchWithBackoff(
    `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`,
    { headers: { Accept: "application/json" } }
  );
  if (dlRes.ok) {
    const dl = (await dlRes.json()) as { downloads?: number };
    weeklyDownloads = dl.downloads ?? 0;
  }

  // Install scripts detection
  let hasInstallScripts = false;
  if (version && data.versions?.[version]?.scripts) {
    const scripts = data.versions[version].scripts as Record<string, string>;
    hasInstallScripts = ["install", "preinstall", "postinstall"].some(
      (key) => typeof scripts[key] === "string"
    );
  }

  const result: NpmInput = {
    name: packageName,
    version,
    lastPublishAt,
    weeklyDownloads,
    hasInstallScripts,
    exists: true,
  };
  await cacheSet(cacheKey, result, CACHE_TTL.npm);
  return result;
}

// ===== Serial queue runner =====
export async function runSerial<T>(
  items: T[],
  worker: (item: T) => Promise<void>,
  concurrency = 1
): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: concurrency }, async () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const item = queue.shift();
      if (item === undefined) break;
      try {
        await worker(item);
      } catch {
        // Individual item failures do not break the pipeline (Spec 6.4 partial failure)
      }
    }
  });
  await Promise.all(workers);
}
