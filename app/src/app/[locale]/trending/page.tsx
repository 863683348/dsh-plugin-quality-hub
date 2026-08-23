import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
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
  const t = await getTranslations({ locale, namespace: 'meta' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/trending' : `/${locale}/trending`;
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/trending`,
        zh: `${siteUrl}/zh/trending`,
      },
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
