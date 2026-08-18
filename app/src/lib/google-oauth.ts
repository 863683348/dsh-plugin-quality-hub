// ============================================================
// Google OAuth — email login (v1.3)
// 流程: GET /api/v1/auth/google -> 跳 Google 授权页
//       GET /api/v1/auth/google/callback?code=.. -> 换 token + profile
// 需要 env: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / NEXT_PUBLIC_SITE_URL
// ============================================================

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_PROFILE_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export interface GoogleProfile {
  id: string; // googleSub
  email: string;
  name?: string;
  picture?: string;
  verified_email?: boolean;
}

export function googleEnabled(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

export function googleRedirectUri(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
  return `${site}/api/v1/auth/google/callback`;
}

// 生成授权 URL（state 用于 CSRF 防护，本地存 cookie）
export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
    access_type: 'online',
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

// 用授权码换 token
export async function exchangeGoogleCode(code: string): Promise<{
  accessToken: string;
}> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Google token exchange failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { access_token: string; id_token?: string };
  if (!data.access_token) throw new Error('Google token exchange: no access_token');
  return { accessToken: data.access_token };
}

// 拉用户资料
export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const res = await fetch(GOOGLE_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Google profile fetch failed (${res.status})`);
  }
  const data = (await res.json()) as GoogleProfile;
  if (!data.id || !data.email) {
    throw new Error('Google profile: missing id or email');
  }
  return data;
}
