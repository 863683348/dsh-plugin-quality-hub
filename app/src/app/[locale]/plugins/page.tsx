import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { listPlugins } from "@/services/plugin-service";
import { mockData } from "@/lib/mock-data";
import { PluginsBrowser } from "@/components/plugins-browser";

interface PluginsPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: PluginsPageProps): Promise<Metadata> {
  const { locale } = params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  const path = locale === 'en' ? '/plugins' : `/${locale}/plugins`;
  let total = 0;
  try {
    const data = await listPlugins({
      page: 1,
      limit: 1,
      q: '',
      grade: undefined,
      sort: 'score',
      order: 'desc',
    });
    total = data.total;
  } catch {
    total = 0;
  }
  const title =
    locale === 'zh'
      ? 'DSH 插件目录——浏览、对比、挑选安全插件 | DSH Quality'
      : 'DSH Plugin Directory — Browse, Compare & Find Safe Plugins | DSH Quality';
  const description = (
    locale === 'zh'
      ? '浏览 {total} 个已评估的 DeepSeek Harness 插件——支持搜索、按等级筛选，安装前对比质量评分。'
      : 'Browse {total} evaluated DeepSeek Harness plugins — search, filter by grade, and compare quality scores before you install.'
  ).replace('{total}', total.toLocaleString('en-US'));
  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/plugins`,
        zh: `${siteUrl}/zh/plugins`,
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

export const dynamic = "force-dynamic";

export default async function PluginsPage({ params }: PluginsPageProps) {
  setRequestLocale(params.locale);

  // SSR 直接走 service 层（同一进程内查库，绕过 HTTP 自我请求的 8s 超时，
  // 避免 Vercel 上自我 fetch 公共域名失败导致回退 mock 21 个的 bug）
  let data: {
    items: Array<import("@/types/api").Plugin>;
    total: number;
    page: number;
    totalPages: number;
  };
  try {
    data = await listPlugins({
      page: 1,
      limit: 50,
      q: "",
      grade: undefined,
      sort: "score",
      order: "desc",
    });
  } catch {
    data = {
      items: mockData.rankings.items.slice(0, 50),
      total: mockData.rankings.items.length,
      page: 1,
      totalPages: 1,
    };
  }

  return (
    <PluginsBrowser
      initialPlugins={data.items}
      initialTotal={data.total}
    />
  );
}
