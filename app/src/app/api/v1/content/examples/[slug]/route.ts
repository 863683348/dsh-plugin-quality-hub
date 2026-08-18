// GET /api/v1/content/examples/[slug] — 鉴权获取完整实例拆解 (v1.3)
// pro 实例: 非 pro 用户 403; 完整三维度拆解绝不在 SSG HTML 中

import { NextRequest } from 'next/server';
import { isPro } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const example = await prisma.example.findUnique({
    where: { slug: params.slug },
  });
  if (!example) {
    return Response.json({ code: 4040, data: null, message: 'Not found' }, { status: 404 });
  }
  if (example.tier === 'pro') {
    const pro = await isPro();
    if (!pro) {
      return Response.json({ code: 4010, data: null, message: 'Pro subscription required' }, { status: 403 });
    }
  }
  return Response.json({
    code: 0,
    data: {
      slug: example.slug,
      configEn: example.configEn,
      configZh: example.configZh,
      codeEn: example.codeEn,
      codeZh: example.codeZh,
      highlightsEn: example.highlightsEn,
      highlightsZh: example.highlightsZh,
    },
  });
}
