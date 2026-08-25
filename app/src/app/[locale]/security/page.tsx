import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/security' : `/${locale}/security`;
  const title =
    locale === 'zh'
      ? 'DSH 插件安全预警——安装前识别风险插件 | DSH Quality'
      : 'DSH Plugin Security Watch — Spot Risky Plugins Before You Install | DSH Quality';
  const description =
    locale === 'zh'
      ? '对危险安装脚本、缺失 dsh.bundle 声明与归档仓库的启发式安全标记，覆盖整个 DSH 插件生态。'
      : 'Heuristic security flags for dangerous install scripts, missing dsh.bundle declarations, and archived repositories across the DSH plugin ecosystem.';
  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/security`,
        zh: `${siteUrl}/zh/security`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${path}`,
      siteName: 'DSH Quality',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      type: 'website',
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
