// GET /api/v1/auth/google — 发起 Google OAuth 登录
// 生成 state (CSRF) 存 cookie 后 302 跳 Google 授权页

import { NextRequest, NextResponse } from 'next/server';
import { buildGoogleAuthUrl, googleEnabled } from '@/lib/google-oauth';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  if (!googleEnabled()) {
    return NextResponse.redirect(
      new URL('/login?error=not_configured', process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com')
    );
  }
  const state = randomBytes(24).toString('hex');
  const url = buildGoogleAuthUrl(state);
  const res = NextResponse.redirect(url);
  res.cookies.set('dsh_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 min
  });
  return res;
}
