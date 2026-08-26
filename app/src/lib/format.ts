// ============================================================
// 格式化工具 — 数字/相对时间/星标缩写
// ============================================================

/** 1200 → "1.2k"，1200000 → "1.2M" */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v >= 10 ? Math.round(v) : v.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v >= 10 ? Math.round(v) : v.toFixed(1)}k`;
  }
  return String(n);
}

/** 1234567 → "1,234,567" */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * ISO 日期 → 相对时间（en/zh 双语）
 * locale: 'en' | 'zh'
 */
export function formatRelativeTime(
  iso: string | null | undefined,
  locale: 'en' | 'zh'
): string {
  if (!iso) return locale === 'zh' ? '未知' : 'Unknown';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return locale === 'zh' ? '未知' : 'Unknown';
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (minutes < 1) return locale === 'zh' ? '刚刚' : 'just now';
  if (minutes < 60) {
    return locale === 'zh' ? `${minutes} 分钟前` : `${minutes} min ago`;
  }
  if (hours < 24) {
    return locale === 'zh' ? `${hours} 小时前` : `${hours} hr ago`;
  }
  if (days < 30) {
    return locale === 'zh' ? `${days} 天前` : `${days} days ago`;
  }
  if (months < 12) {
    return locale === 'zh' ? `${months} 个月前` : `${months} mo ago`;
  }
  return locale === 'zh' ? `${years} 年前` : `${years} yr ago`;
}

/** ISO 日期 → 绝对时间 "2026-08-10" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toISOString().slice(0, 10);
}

/** 分数 → 等级（与评分算法一致的阈值：A>=90 / B>=75 / C>=60 / D<60） */
export function gradeFromScore(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}
