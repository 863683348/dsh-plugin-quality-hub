// GET /api/v1/badge/[...name] - DSH Quality SVG badge (shields.io style)
// Display a plugin's quality grade + score as an embeddable SVG badge.
//
// Usage (README / GitHub):
//   ![DSH Quality](https://dshquality.com/api/v1/badge/owner/repo)
//
// The route is a catch-all ([...name]) so that owner/repo (which contains a
// slash) maps to a single plugin name. e.g. /api/v1/badge/owner/repo -> name="owner/repo".

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NAME_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

// Grade colors aligned with tokens.css --grade-* (light theme, the canonical brand palette)
const GRADE_COLORS: Record<string, string> = {
  A: "#059669",
  B: "#2563EB",
  C: "#D97706",
  D: "#DC2626",
};
const UNKNOWN_COLOR = "#64748B";
const LABEL_COLOR = "#1E3A5F"; // --color-primary
const TEXT_COLOR = "#FFFFFF";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function badgeSvg(label: string, value: string, valueColor: string): string {
  const fs = 11;
  const labelW = Math.max(16, Math.round(label.length * 6.8) + 12);
  const valueW = Math.max(16, Math.round(value.length * 6.8) + 12);
  const totalW = labelW + valueW;
  const safeLabel = escapeXml(label);
  const safeValue = escapeXml(value);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="20" viewBox="0 0 ${totalW} 20" role="img" aria-label="${safeLabel}: ${safeValue}">
  <title>${safeLabel}: ${safeValue}</title>
  <linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity="0.15"/><stop offset="1" stop-color="#000" stop-opacity="0.15"/></linearGradient>
  <clipPath id="r"><rect width="${totalW}" height="20" rx="3"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="20" fill="${LABEL_COLOR}"/>
    <rect x="${labelW}" width="${valueW}" height="20" fill="${valueColor}"/>
    <rect width="${totalW}" height="20" fill="url(#b)"/>
    <text x="${labelW / 2}" y="14" fill="${TEXT_COLOR}" font-family="Verdana,Geneva,sans-serif" font-size="${fs}" text-anchor="middle">${safeLabel}</text>
    <text x="${labelW + valueW / 2}" y="14" fill="${TEXT_COLOR}" font-family="Verdana,Geneva,sans-serif" font-size="${fs}" font-weight="bold" text-anchor="middle">${safeValue}</text>
  </g>
</svg>`;
}

function respond(svg: string): Response {
  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { name: string[] } }
) {
  const name = params.name.join("/");
  if (!NAME_PATTERN.test(name)) {
    return respond(badgeSvg("DSH Quality", "invalid", UNKNOWN_COLOR));
  }

  try {
    const plugin = await prisma.plugin.findUnique({ where: { name } });
    if (!plugin) {
      return respond(badgeSvg("DSH Quality", "not ranked", UNKNOWN_COLOR));
    }
    const color = GRADE_COLORS[plugin.grade] ?? UNKNOWN_COLOR;
    return respond(badgeSvg("DSH Quality", `${plugin.grade} · ${plugin.score}`, color));
  } catch {
    // DB unreachable — still return a valid badge so embeds never break
    return respond(badgeSvg("DSH Quality", "error", UNKNOWN_COLOR));
  }
}
