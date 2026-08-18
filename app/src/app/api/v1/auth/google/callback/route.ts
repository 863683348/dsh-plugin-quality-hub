// GET /api/v1/auth/google/callback — Google OAuth 回调
// 校验 state -> 换 token -> 拉 profile -> upsert user -> 写 session cookie

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  exchangeGoogleCode,
  fetchGoogleProfile,
  googleEnabled,
} from '@/lib/google-oauth';
import { upsertGoogleUser } from '@/services/user-service';
import { setSessionCookie } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function baseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;

  // 1. state 校验 (CSRF)
  const state = url.searchParams.get('state');
  const stored = (await cookies()).get('dsh_oauth_state')?.value;
  if (!state || !stored || state !== stored) {
    return NextResponse.redirect(new URL('/login?error=state_mismatch', baseUrl()));
  }

  // 2. error 处理
  const error = url.searchParams.get('error');
  if (error) {
    return NextResponse.redirect(new URL('/login?error=' + error, baseUrl()));
  }

  // 3. code 交换
  const code = url.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', baseUrl()));
  }
  if (!googleEnabled()) {
    return NextResponse.redirect(new URL('/login?error=not_configured', baseUrl()));
  }

  try {
    const { accessToken } = await exchangeGoogleCode(code);
    const profile = await fetchGoogleProfile(accessToken);
    const user = await upsertGoogleUser(profile);

    await setSessionCookie({
      sub: user.id,
      email: user.email,
      tier: user.tier,
    });

    // 清理 oauth state cookie
    (await cookies()).delete('dsh_oauth_state');

    const next = url.searchParams.get('next');
    const safeNext =
      next && next.startsWith('/') && !next.startsWith('//') ? next : '/account';
    return NextResponse.redirect(new URL(safeNext, baseUrl()));
  } catch (err) {
    console.error('[auth/callback]', err);
    return NextResponse.redirect(new URL('/login?error=callback_failed', baseUrl()));
  }
}
