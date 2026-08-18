import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPageContent } from '@/components/legal-page-content';

interface PrivacyPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'legal.privacy' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/privacy' : `/${locale}/privacy`;
  return {
    title: t('title'),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/privacy`,
        zh: `${siteUrl}/zh/privacy`,
      },
    },
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  setRequestLocale(params.locale);
  return <LegalPageContent ns="privacy" />;
}
