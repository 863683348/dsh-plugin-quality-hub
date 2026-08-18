// ============================================================
// 内容查询服务 (Spec §5.1, 决策 D6)
// 仅允许 server component 调用; 页面内 Promise.all 并行查询,
// 不新增 API route。教程/实例低频内容 -> SSG + revalidate=3600。
// ============================================================

import { prisma } from '@/lib/prisma';
import { mapPlugin } from '@/lib/mappers';
import type { Tutorial, Example, Plugin } from '@prisma/client';
import type { Plugin as ApiPlugin } from '@/types/api';

export async function getPublishedTutorials(): Promise<Tutorial[]> {
  return prisma.tutorial.findMany({
    where: { status: 'published' },
    orderBy: [{ order: 'asc' }, { publishedAt: 'desc' }],
  });
}

export async function getTutorialBySlug(slug: string): Promise<Tutorial | null> {
  return prisma.tutorial.findUnique({ where: { slug } });
}

export async function getPublishedExamples(): Promise<Example[]> {
  return prisma.example.findMany({
    where: { status: 'published' },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function getExampleBySlug(slug: string): Promise<Example | null> {
  return prisma.example.findUnique({ where: { slug } });
}

export async function getRelatedExamples(slugs: string[]): Promise<Example[]> {
  if (slugs.length === 0) return [];
  return prisma.example.findMany({
    where: { slug: { in: slugs }, status: 'published' },
  });
}

export async function getRelatedTutorials(slugs: string[]): Promise<Tutorial[]> {
  if (slugs.length === 0) return [];
  return prisma.tutorial.findMany({
    where: { slug: { in: slugs }, status: 'published' },
  });
}

export async function getRelatedPlugins(
  names: string[]
): Promise<ApiPlugin[]> {
  if (names.length === 0) return [];
  const rows: Plugin[] = await prisma.plugin.findMany({
    where: { name: { in: names } },
  });
  return rows.map(mapPlugin);
}
