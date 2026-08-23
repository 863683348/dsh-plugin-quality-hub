import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getRankings, listPlugins } from '@/services/plugin-service';
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

export const dynamic = 'force-dynamic';

export default async function HomePage({ params }: HomePageProps) {
  setRequestLocale(params.locale);

  // SSR 直接走 service 层（同一进程内查库，绕过 HTTP 自我请求的 8s 超时，
  // 避免 Vercel 上自我 fetch 公共域名失败导致回退 mock 21 个的 bug）
  let items: Awaited<ReturnType<typeof getRankings>>['items'] = [];
  let total = 0;
  try {
    const ranking = await getRankings('score', 100);
    items = ranking.items;
    const countData = await listPlugins({
      page: 1,
      limit: 1,
      sort: 'score',
      order: 'desc',
      q: '',
      grade: undefined,
    });
    total = countData.total;
  } catch {
    // 数据库异常 → mock 兜底
    items = mockData.rankings.items;
    total = mockData.rankings.items.length;
  }
  const updatedAt = new Date().toISOString();

  return (
    <HomeClient
      plugins={items}
      total={total}
      updatedAt={updatedAt}
    />
  );
}
