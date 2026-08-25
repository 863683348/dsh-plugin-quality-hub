import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { getTrending } from '@/services/plugin-service';
import type { Plugin } from '@/types/api';
import { mockData } from '@/lib/mock-data';
import { TrendingClient } from '@/components/trending-client';

interface TrendingPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: TrendingPageProps): Promise<Metadata> {
  const { locale } = params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/trending' : `/${locale}/trending`;
  const title =
    locale === 'zh'
      ? 'DSH 插件趋势榜——最近活跃与最多 Star | DSH Quality'
      : 'Trending DSH Plugins — Most Active & Most Starred | DSH Quality';
  const description =
    locale === 'zh'
      ? '查看生态中最近活跃、最多 Star 的 DeepSeek Harness 插件，均由 DSH Quality 评分排序。'
      : 'See the most recently active and most-starred DeepSeek Harness plugins in the ecosystem, ranked and scored by DSH Quality.';
  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/trending`,
        zh: `${siteUrl}/zh/trending`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${path}`,
      siteName: 'DSH Quality',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      type: 'website',
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function TrendingPage({ params }: TrendingPageProps) {
  setRequestLocale(params.locale);

  // SSR 直接走 service 层（绕过 HTTP 自我请求超时回退 mock 的问题）
  let data: { recentlyActive: Plugin[]; mostStarred: Plugin[] };
  try {
    const t = await getTrending(10);
    data = { recentlyActive: t.recentlyActive, mostStarred: t.mostStarred };
  } catch {
    data = {
      recentlyActive: mockData.trending.recentlyActive ?? [],
      mostStarred: mockData.trending.mostStarred ?? [],
    };
  }

  return (
    <TrendingClient
      recentlyActive={data.recentlyActive ?? []}
      mostStarred={data.mostStarred ?? []}
    />
  );
}
