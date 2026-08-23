import type {
  AdvisoryListData,
  ApiEnvelope,
  PluginDetail,
  PluginListData,
  RankingData,
  SecurityData,
  TrendingData,
} from '@/types/api';

// ============================================================
// 前端 API 客户端
// 契约：统一包装 { code, data, message }（api-spec.md）
// 兜底：后端未就绪 / 网络失败 / 非 0 code → 回退 mock 数据
// ============================================================

async function request<T>(path: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    // 冷启动 + Neon 连接可能 5-6s，放宽到 20s 避免偶发超时
    const timeout = setTimeout(() => controller.abort(), 20000);
    // Server-side rendering needs an absolute URL; fall back to relative
    // (browser) when no site URL is configured. next: { revalidate } is a
    // no-op for relative fetches from the client but enables ISR caching
    // when the absolute URL form is used in Server Components.
    const base = process.env.NEXT_PUBLIC_SITE_URL || "";
    const url = base ? `${base.replace(/\/$/, "")}${path}` : path;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const envelope = (await res.json()) as ApiEnvelope<T>;
    if (envelope.code !== 0 || envelope.data == null) return null;
    return envelope.data;
  } catch {
    // 网络错误 / 后端未就绪 → 交给调用方回退 mock
    return null;
  }
}

export async function fetchRankings(
  sort: 'score' | 'stars' | 'recent' = 'score',
  limit = 50
): Promise<RankingData | null> {
  return request<RankingData>(
    `/api/v1/rankings?sort=${sort}&limit=${limit}`
  );
}

export async function fetchPlugins(
  page = 1,
  limit = 50,
  q = '',
  grade = 'all',
  sort = 'score',
  order = 'desc'
): Promise<PluginListData | null> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort,
    order,
  });
  if (q.trim()) params.set('q', q.trim());
  if (grade !== 'all') params.set('grade', grade);
  return request<PluginListData>(`/api/v1/plugins?${params.toString()}`);
}

export async function fetchPluginDetail(
  name: string
): Promise<PluginDetail | null> {
  const encoded = encodeURIComponent(name);
  return request<PluginDetail>(`/api/v1/plugins/${encoded}`);
}

export async function fetchSecurity(
  type?: 'danger' | 'warning' | 'info',
  limit = 50
): Promise<SecurityData | null> {
  const q = type ? `?type=${type}&limit=${limit}` : `?limit=${limit}`;
  return request<SecurityData>(`/api/v1/security${q}`);
}

export async function fetchAdvisories(
  severity?: string,
  status?: string,
  limit = 50
): Promise<AdvisoryListData | null> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (severity) params.set('severity', severity);
  if (status) params.set('status', status);
  return request<AdvisoryListData>(
    `/api/v1/security/advisories?${params.toString()}`
  );
}

export async function fetchTrending(limit = 10): Promise<TrendingData | null> {
  return request<TrendingData>(`/api/v1/trending?limit=${limit}`);
}
