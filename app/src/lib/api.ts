import type {
  ApiEnvelope,
  PluginDetail,
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
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(path, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
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

export async function fetchTrending(limit = 10): Promise<TrendingData | null> {
  return request<TrendingData>(`/api/v1/trending?limit=${limit}`);
}
