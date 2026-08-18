import type { MetadataRoute } from "next";
import { getBlogPosts } from "@/data/blog/posts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dshquality.com";

const STATIC_PATHS = [
  "",
  "/about",
  "/blog",
  "/contact",
  "/faq",
  "/method",
  "/plugins",
  "/privacy",
  "/security",
  "/terms",
  "/trending",
  "/weekly",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  // 核心静态页：zh + en 双语言（en 为默认 locale，走裸路径）
  for (const path of STATIC_PATHS) {
    entries.push({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: path === "" ? 1 : 0.8,
    });
    entries.push({
      url: `${SITE_URL}/zh${path}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: path === "" ? 1 : 0.8,
    });
  }

  // 博客单篇：en 裸路径 + zh 前缀，每篇 0.7
  for (const post of getBlogPosts()) {
    entries.push({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date + "T00:00:00Z"),
      changeFrequency: "monthly",
      priority: 0.7,
    });
    entries.push({
      url: `${SITE_URL}/zh/blog/${post.slug}`,
      lastModified: new Date(post.date + "T00:00:00Z"),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return entries;
}
