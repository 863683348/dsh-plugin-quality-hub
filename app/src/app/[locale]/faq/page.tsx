import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FaqContent } from '@/components/faq-content';

interface FaqPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: FaqPageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'legal.faq' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/faq' : `/${locale}/faq`;
  return {
    title: t('title'),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/faq`,
        zh: `${siteUrl}/zh/faq`,
      },
    },
  };
}

export default async function FaqPage({ params }: FaqPageProps) {
  setRequestLocale(params.locale);
  return <FaqContent />;
}
