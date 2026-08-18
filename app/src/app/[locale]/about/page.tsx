import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AboutContent } from '@/components/about-content';

interface AboutPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/about' : `/${locale}/about`;
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/about`,
        zh: `${siteUrl}/zh/about`,
      },
    },
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  setRequestLocale(params.locale);
  return <AboutContent />;
}
