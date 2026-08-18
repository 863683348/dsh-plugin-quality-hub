import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { LoginClient } from '@/components/login-client';

interface LoginPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'membership.login' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/login' : `/${locale}/login`;
  return {
    title: `${t('title')} — DSH Quality`,
    description: t('subtitle'),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/login`,
        zh: `${siteUrl}/zh/login`,
      },
    },
  };
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container-page">
      <section className="mx-auto max-w-md py-[var(--section-y-sm)] md:py-[var(--section-y)]">
        <LoginClient />
      </section>
    </div>
  );
}
