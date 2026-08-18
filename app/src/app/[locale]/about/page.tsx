import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AboutContent } from '@/components/about-content';

interface AboutPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'meta' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  setRequestLocale(params.locale);
  return <AboutContent />;
}
