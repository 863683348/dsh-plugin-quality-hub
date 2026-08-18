import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { fetchTrending } from '@/lib/api';
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

export default async function TrendingPage({ params }: TrendingPageProps) {
  setRequestLocale(params.locale);

  const data = (await fetchTrending(10)) ?? mockData.trending;

  return (
    <TrendingClient
      recentlyActive={data.recentlyActive ?? []}
      mostStarred={data.mostStarred ?? []}
    />
  );
}
