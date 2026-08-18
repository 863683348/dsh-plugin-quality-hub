// GET /api/v1/content/tutorials/[slug] — 鉴权获取完整教程正文 (v1.3)
// pro 教程: 非 pro 用户 403; 完整正文绝不在 SSG HTML 中

import { NextRequest } from 'next/server';
import { isPro } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const tutorial = await prisma.tutorial.findUnique({
    where: { slug: params.slug },
  });
  if (!tutorial) {
    return Response.json({ code: 4040, data: null, message: 'Not found' }, { status: 404 });
  }
  if (tutorial.tier === 'pro') {
    const pro = await isPro();
    if (!pro) {
      return Response.json({ code: 4010, data: null, message: 'Pro subscription required' }, { status: 403 });
    }
  }
  return Response.json({
    code: 0,
    data: {
      slug: tutorial.slug,
      contentEn: tutorial.contentEn,
      contentZh: tutorial.contentZh,
    },
  });
}
