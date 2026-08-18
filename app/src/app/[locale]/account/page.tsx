import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { AccountClient } from '@/components/account-client';

interface AccountPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: AccountPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'membership.account' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/account' : `/${locale}/account`;
  return {
    title: `${t('title')} — DSH Quality`,
    description: t('title'),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/account`,
        zh: `${siteUrl}/zh/account`,
      },
    },
  };
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container-page">
      <section className="mx-auto max-w-2xl py-[var(--section-y-sm)] md:py-[var(--section-y)]">
        <AccountClient />
      </section>
    </div>
  );
}
