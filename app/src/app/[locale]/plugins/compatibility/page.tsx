import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { listPlugins } from "@/services/plugin-service";
import { mockData } from "@/lib/mock-data";
import { CompatibilityMatrix } from "@/components/compatibility-matrix";

interface CompatibilityPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: CompatibilityPageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "compatibility" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dshquality.com";
  const path = locale === "en" ? "/plugins/compatibility" : `/${locale}/plugins/compatibility`;
  return {
    title: `${t("title")} — DSH Quality`,
    description: t("description"),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/plugins/compatibility`,
        zh: `${siteUrl}/zh/plugins/compatibility`,
      },
    },
  };
}

export const dynamic = "force-dynamic";

export default async function CompatibilityPage({ params }: CompatibilityPageProps) {
  setRequestLocale(params.locale);

  // SSR 直接走 service 层（绕过 HTTP 自我请求超时回退 mock 的问题）
  let topPlugins: Array<import("@/types/api").Plugin>;
  try {
    const data = await listPlugins({
      page: 1,
      limit: 30,
      q: "",
      grade: undefined,
      sort: "score",
      order: "desc",
    });
    topPlugins = data.items;
  } catch {
    topPlugins = mockData.rankings.items.slice(0, 30);
  }

  return (
    <div className="container-page py-[var(--section-y-sm)] md:py-[var(--section-y)]">
      <CompatibilityMatrix plugins={topPlugins} />
    </div>
  );
}
