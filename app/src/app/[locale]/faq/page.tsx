import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { FaqContent } from '@/components/faq-content';

interface FaqPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: FaqPageProps): Promise<Metadata> {
  const { locale } = params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/faq' : `/${locale}/faq`;
  const title =
    locale === 'zh'
      ? 'DSH Quality 常见问题——评分、等级与安全信号'
      : 'DSH Quality FAQ — Scores, Grades & Security Signals Explained';
  const description =
    locale === 'zh'
      ? '关于 DSH Quality 的常见问题：插件分数如何计算、等级含义，以及安全标记如何运作。'
      : 'Common questions about DSH Quality: how plugin scores are computed, what grades mean, and how security flags work.';
  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/faq`,
        zh: `${siteUrl}/zh/faq`,
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

export default async function FaqPage({ params }: FaqPageProps) {
  setRequestLocale(params.locale);
  return <FaqContent />;
}
