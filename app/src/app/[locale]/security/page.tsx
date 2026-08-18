import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { fetchSecurity, fetchAdvisories } from '@/lib/api';
import { mockData } from '@/lib/mock-data';
import { SecurityClient } from '@/components/security-client';

interface SecurityPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: SecurityPageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/security' : `/${locale}/security`;
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/security`,
        zh: `${siteUrl}/zh/security`,
      },
    },
  };
}

export default async function SecurityPage({ params }: SecurityPageProps) {
  setRequestLocale(params.locale);

  // 并行获取：安全标记 + CVE 风格公告（v0.3）
  const [securityData, advisoryData] = await Promise.all([
    fetchSecurity(undefined, 100),
    fetchAdvisories(undefined, undefined, 100),
  ]);

  const items = securityData?.items ?? mockData.security.items;
  const total = securityData?.total ?? mockData.security.total;
  const advisories = advisoryData?.items ?? mockData.advisories.items;

  return (
    <SecurityClient
      items={items}
      total={total}
      advisories={advisories}
    />
  );
}
