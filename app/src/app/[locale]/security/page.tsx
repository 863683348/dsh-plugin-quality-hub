import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { fetchSecurity } from '@/lib/api';
import { mockData } from '@/lib/mock-data';
import { SecurityClient } from '@/components/security-client';

interface SecurityPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: SecurityPageProps): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'meta' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SecurityPage({ params }: SecurityPageProps) {
  setRequestLocale(params.locale);

  const data = (await fetchSecurity(undefined, 100)) ?? mockData.security;

  return (
    <SecurityClient items={data.items ?? []} total={data.total ?? 0} />
  );
}
