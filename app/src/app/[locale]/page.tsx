import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { fetchRankings } from '@/lib/api';
import { mockData } from '@/lib/mock-data';
import { HomeClient } from '@/components/home-client';

interface HomePageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'meta' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function HomePage({ params }: HomePageProps) {
  setRequestLocale(params.locale);

  // 后端未就绪 / 失败 → mock 兜底
  const ranking = (await fetchRankings('score', 100)) ?? mockData.rankings;
  const items = ranking?.items ?? [];
  const total = items.length;
  const updatedAt = ranking?.updatedAt ?? new Date().toISOString();

  return (
    <HomeClient
      plugins={items}
      total={total}
      updatedAt={updatedAt}
    />
  );
}
