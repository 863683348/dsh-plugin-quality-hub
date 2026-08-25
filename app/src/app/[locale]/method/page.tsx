import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { MethodContent } from '@/components/method-content';

interface MethodPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: MethodPageProps): Promise<Metadata> {
  const { locale } = params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/method' : `/${locale}/method`;
  const title =
    locale === 'zh'
      ? 'DSH 插件评分方法——四维度模型 | DSH Quality'
      : 'How We Score DSH Plugins — The 4-Dimension Method | DSH Quality';
  const description =
    locale === 'zh'
      ? '每个 DSH Quality 分数都由四个加权维度计算，数据来自公开的 GitHub 与 npm 元数据。无人工判断，无付费排名。'
      : 'Every DSH Quality score is computed from four weighted dimensions using public GitHub and npm metadata. No human judgment, no paid placements.';
  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/method`,
        zh: `${siteUrl}/zh/method`,
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

export default async function MethodPage({ params }: MethodPageProps) {
  setRequestLocale(params.locale);
  return <MethodContent />;
}
