import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
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
  const t = await getTranslations({ locale, namespace: "plugins" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dshquality.com";
  const path = locale === "en" ? "/plugins" : `/${locale}/plugins`;
  return {
    title: `${t("title")} — DSH Quality`,
    description: t("subtitle", { total: "all" }),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/plugins`,
        zh: `${siteUrl}/zh/plugins`,
      },
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
