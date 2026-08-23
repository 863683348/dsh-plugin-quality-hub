import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getSecurityItems } from '@/services/plugin-service';
import { mockData } from '@/lib/mock-data';
import { SecurityClient, type SecurityClientProps } from '@/components/security-client';

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

export const dynamic = 'force-dynamic';

export default async function SecurityPage({ params }: SecurityPageProps) {
  setRequestLocale(params.locale);

  // SSR 直接走 service 层（绕过 HTTP 自我请求超时回退 mock 的问题）
  let items: SecurityClientProps['items'];
  let total: number;
  try {
    const sec = await getSecurityItems(undefined, 100);
    items = sec.items;
    total = sec.total;
  } catch {
    items = mockData.security.items;
    total = mockData.security.total;
  }
  // advisories 仍走 mock（advisory-service 无 SSR 直调封装，保留原有兜底）
  const advisories = mockData.advisories.items;

  return (
    <SecurityClient
      items={items}
      total={total}
      advisories={advisories}
    />
  );
}
