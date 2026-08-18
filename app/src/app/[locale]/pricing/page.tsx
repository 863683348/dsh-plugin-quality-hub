import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { PricingClient } from '@/components/pricing-client';

interface PricingPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: PricingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricing' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/pricing' : `/${locale}/pricing`;
  return {
    title: `${t('meta.title')} — DSH Quality`,
    description: t('meta.description'),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/pricing`,
        zh: `${siteUrl}/zh/pricing`,
      },
    },
  };
}

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container-page">
      <section className="py-[var(--section-y-sm)] md:py-[var(--section-y)]">
        <PricingClient />
      </section>
    </div>
  );
}
