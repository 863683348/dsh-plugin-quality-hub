import type { MetadataRoute } from "next";
import { getBlogPosts } from '@/data/blog/posts';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dshquality.com";

const STATIC_PATHS = [
  "",
  "/about",
  "/account",
  "/blog",
  "/contact",
  "/examples",
  "/faq",
  "/login",
  "/low-quality",
  "/method",
  "/plugins",
  "/pricing",
  "/privacy",
  "/security",
  "/terms",
  "/trending",
  "/tutorials",
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

  // 博客单篇：en/zh 各一条
  const posts = getBlogPosts();
  for (const post of posts) {
    entries.push({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "yearly",
      priority: 0.6,
    });
    entries.push({
      url: `${SITE_URL}/zh/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "yearly",
      priority: 0.6,
    });
  }

  return entries;
}

