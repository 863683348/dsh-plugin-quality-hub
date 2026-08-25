import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { LegalPageContent } from '@/components/legal-page-content';

interface PrivacyPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { locale } = params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/privacy' : `/${locale}/privacy`;
  const title =
    locale === 'zh'
      ? '隐私政策——DSH Quality'
      : 'Privacy Policy — DSH Quality';
  const description =
    locale === 'zh'
      ? 'DSH Quality 如何收集、使用并保护你的数据——极简分析、不出售、符合 GDPR。'
      : 'How DSH Quality collects, uses, and protects your data — minimal analytics, no selling, GDPR-friendly.';
  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/privacy`,
        zh: `${siteUrl}/zh/privacy`,
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

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  setRequestLocale(params.locale);
  return <LegalPageContent ns="privacy" />;
}
