import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MethodContent } from '@/components/method-content';

interface MethodPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: MethodPageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/method' : `/${locale}/method`;
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/method`,
        zh: `${siteUrl}/zh/method`,
      },
    },
  };
}

export default async function MethodPage({ params }: MethodPageProps) {
  setRequestLocale(params.locale);
  return <MethodContent />;
}
