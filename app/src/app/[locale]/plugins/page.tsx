import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { fetchPlugins } from "@/lib/api";
import { mockData } from "@/lib/mock-data";
import { PluginsBrowser } from "@/components/plugins-browser";

interface PluginsPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: PluginsPageProps): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "plugins" });
  return {
    title: `${t("title")} — DSH Quality`,
    description: t("subtitle", { total: "all" }),
  };
}

export default async function PluginsPage({ params }: PluginsPageProps) {
  setRequestLocale(params.locale);

  // 首屏数据（SSR）：后端就绪时真实数据，否则 mock 兜底
  const data = (await fetchPlugins(1, 50, "", "all", "score", "desc")) ?? {
    items: mockData.rankings.items.slice(0, 50),
    total: mockData.rankings.items.length,
    page: 1,
    totalPages: 1,
  };

  return (
    <PluginsBrowser
      initialPlugins={data.items}
      initialTotal={data.total}
    />
  );
}
