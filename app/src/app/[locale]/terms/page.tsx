import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { LegalPageContent } from '@/components/legal-page-content';

interface TermsPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: TermsPageProps): Promise<Metadata> {
  const { locale } = params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/terms' : `/${locale}/terms`;
  const title =
    locale === 'zh'
      ? '服务条款——DSH Quality'
      : 'Terms of Service — DSH Quality';
  const description =
    locale === 'zh'
      ? '使用 DSH Quality 的条款——为 DSH 插件提供独立的启发式评分，按“现状”提供。'
      : 'The terms governing your use of DSH Quality — independent heuristic scoring for DSH plugins, provided as-is.';
  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/terms`,
        zh: `${siteUrl}/zh/terms`,
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

export default async function TermsPage({ params }: TermsPageProps) {
  setRequestLocale(params.locale);
  return <LegalPageContent ns="terms" />;
}
