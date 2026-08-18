import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { Mail, Newspaper } from "lucide-react";
import { NewsletterSubscribe } from "@/components/newsletter-subscribe";
import { ShareButtons } from "@/components/share-buttons";

interface WeeklyPageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params,
}: WeeklyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "weekly" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dshquality.com";
  const path = locale === "en" ? "/weekly" : `/${locale}/weekly`;
  return {
    title: `${t("hero.title")} — DSH Quality`,
    description: t("hero.body"),
    alternates: {
      canonical: `${siteUrl}${path}`,
      languages: {
        en: `${siteUrl}/weekly`,
        zh: `${siteUrl}/zh/weekly`,
      },
    },
  };
}

export default async function WeeklyPage({ params }: WeeklyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("weekly");
  const tc = await getTranslations("common");

  return (
    <div className="container-page">
      <section className="mx-auto max-w-2xl py-[var(--section-y-sm)] text-center md:py-[var(--section-y)]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
          <Newspaper className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden="true" />
          {t("hero.badge")}
        </span>
        <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-[var(--color-text)]">
          {t("hero.title")}
        </h1>
        <p className="mx-auto mt-4 max-w-prose text-lg leading-relaxed text-[var(--color-muted)]">
          {t("hero.body")}
        </p>

        {/* 订阅表单 */}
        <div className="mx-auto mt-8 max-w-md">
          <NewsletterSubscribe source="web" />
          <p className="mt-2 text-xs text-[var(--color-meta)]">
            {t("subscribe.privacy")}
          </p>
        </div>

        {/* HN / Reddit 首发分享 */}
        <div className="mt-10 flex justify-center border-t border-[var(--color-border)] pt-6">
          <ShareButtons title={t("share.defaultTitle")} />
        </div>

        {/* 内容预览 */}
        <div className="mt-10 grid gap-3 text-left sm:grid-cols-3">
          {[
            { icon: Mail, key: "new" },
            { icon: Mail, key: "security" },
            { icon: Mail, key: "ecosystem" },
          ].map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <Icon
                className="h-4 w-4 text-[var(--color-primary)]"
                aria-hidden="true"
              />
              <p className="mt-2 text-sm font-medium text-[var(--color-text)]">
                {t(`content.${key}`)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
