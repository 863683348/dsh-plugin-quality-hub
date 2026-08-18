import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPageContent } from '@/components/legal-page-content';

interface TermsPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: TermsPageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'legal.terms' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/terms' : `/${locale}/terms`;
  return {
    title: t('title'),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/terms`,
        zh: `${siteUrl}/zh/terms`,
      },
    },
  };
}

export default async function TermsPage({ params }: TermsPageProps) {
  setRequestLocale(params.locale);
  return <LegalPageContent ns="terms" />;
}
