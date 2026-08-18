import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MethodContent } from '@/components/method-content';

interface MethodPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: MethodPageProps): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'meta' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function MethodPage({ params }: MethodPageProps) {
  setRequestLocale(params.locale);
  return <MethodContent />;
}
