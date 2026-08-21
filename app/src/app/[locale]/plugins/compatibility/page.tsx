import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { fetchPlugins } from "@/lib/api";
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

export default async function CompatibilityPage({ params }: CompatibilityPageProps) {
  setRequestLocale(params.locale);

  const topPlugins = (await fetchPlugins(1, 30, "", "all", "score", "desc")) ?? {
    items: mockData.rankings.items.slice(0, 30),
    total: mockData.rankings.items.length,
    page: 1,
    totalPages: 1,
  };

  return (
    <div className="container-page py-[var(--section-y-sm)] md:py-[var(--section-y)]">
      <CompatibilityMatrix plugins={topPlugins.items} />
    </div>
  );
}
