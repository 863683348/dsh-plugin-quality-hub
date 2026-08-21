"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Plugin } from "@/types/api";

interface CompatibilityMatrixProps {
  plugins: Plugin[];
}

export function CompatibilityMatrix({ plugins }: CompatibilityMatrixProps) {
  const t = useTranslations("compatibility");
  const [selectedPlugins, setSelectedPlugins] = useState<string[]>([]);

  const togglePlugin = (name: string) => {
    setSelectedPlugins((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const topPlugins = plugins.slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-xl">{t("title")}</h1>
        <p className="mt-4 text-lg text-[var(--color-text-muted)]">
          {t("description")}
        </p>
      </div>

      <div className="card">
        <h2 className="heading-lg mb-4">{t("selectedPlugins")}</h2>
        <div className="flex flex-wrap gap-2">
          {topPlugins.map((plugin) => (
            <button
              key={plugin.name}
              onClick={() => togglePlugin(plugin.name)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-fast ease-standard ${
                selectedPlugins.includes(plugin.name)
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              {plugin.name} ({plugin.grade})
            </button>
          ))}
        </div>
      </div>

      {selectedPlugins.length >= 2 && (
        <div className="card">
          <h2 className="heading-lg mb-4">{t("compatibilityMatrix")}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-3 px-4">{t("plugin")}</th>
                  {selectedPlugins.map((name) => {
                    const plugin = plugins.find((p) => p.name === name);
                    return (
                      <th key={name} className="text-center py-3 px-4">
                        {plugin?.name || name}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {selectedPlugins.map((name1) => {
                  const plugin1 = plugins.find((p) => p.name === name1);
                  return (
                    <tr key={name1} className="border-b border-[var(--color-border)]">
                      <td className="py-3 px-4 font-medium">{plugin1?.name}</td>
                      {selectedPlugins.map((name2) => {
                        const plugin2 = plugins.find((p) => p.name === name2);
                        const isCompatible =
                          name1 === name2 ||
                          (plugin1?.grade === "A" && plugin2?.grade === "A") ||
                          (plugin1?.grade === "A" && plugin2?.grade === "B") ||
                          (plugin1?.grade === "B" && plugin2?.grade === "A");
                        return (
                          <td key={name2} className="text-center py-3 px-4">
                            {name1 === name2 ? (
                              <span className="text-[var(--color-text-muted)]">—</span>
                            ) : isCompatible ? (
                              <span className="text-[var(--color-success)]">✓</span>
                            ) : (
                              <span className="text-[var(--color-warning)]">~</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            {t("legend")}
          </p>
        </div>
      )}

      <div className="card">
        <h2 className="heading-lg mb-4">{t("topPlugins")}</h2>
        <div className="grid gap-3">
          {topPlugins.map((plugin) => (
            <div
              key={plugin.name}
              className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] transition-colors duration-fast"
            >
              <div>
                <div className="font-medium">{plugin.name}</div>
                <div className="text-sm text-[var(--color-text-muted)]">
                  {plugin.description?.slice(0, 80)}...
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-bold ${
                    plugin.grade === "A"
                      ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                      : plugin.grade === "B"
                      ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                      : "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                  }`}
                >
                  {plugin.grade}
                </span>
                <span className="text-sm text-[var(--color-text-muted)]">
                  ⭐ {plugin.stars?.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
