// POST /api/v1/auth/logout — 退出登录，清 session cookie

import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';
import { ok } from '@/lib/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  await clearSessionCookie();
  return ok({ loggedOut: true });
}
