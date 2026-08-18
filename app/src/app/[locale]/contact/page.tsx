import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ContactContent } from '@/components/contact-content';

interface ContactPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'legal.contact' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/contact' : `/${locale}/contact`;
  return {
    title: t('title'),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/contact`,
        zh: `${siteUrl}/zh/contact`,
      },
    },
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  setRequestLocale(params.locale);
  return <ContactContent />;
}
