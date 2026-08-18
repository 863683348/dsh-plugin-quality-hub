// ============================================================
// Auth session — JWT (jose HS256) in httpOnly cookie (v1.3)
// 登录: Google OAuth (邮箱登录, 无密码)
// 会话: 自签 JWT, cookie name: dsh_session
// ============================================================

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const SESSION_COOKIE = 'dsh_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE,
};

export interface SessionPayload {
  sub: string; // user id
  email: string;
  tier: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    // Dev fallback — never use in production (documented in .env.example)
    return new TextEncoder().encode('dev-only-insecure-secret-change-me-0123456789');
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email, tier: payload.tier })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ['HS256'],
    });
    if (!payload.sub || typeof payload.email !== 'string') return null;
    return {
      sub: payload.sub,
      email: payload.email,
      tier: typeof payload.tier === 'string' ? payload.tier : 'free',
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  (await cookies()).set(SESSION_COOKIE, token, COOKIE_OPTS);
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

// 从 session 取用户（含 tier，服务端强制校验用）
// 每次查库以保证 tier 实时（订阅到期/升级立即生效）
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        locale: true,
        tier: true,
        status: true,
      },
    });
    if (!user || user.status !== 'active') return null;
    return user;
  } catch {
    // DB 不可达时退回 session 内缓存 tier（避免整站崩溃）
    return {
      id: session.sub,
      email: session.email,
      name: null,
      avatarUrl: null,
      locale: 'en',
      tier: session.tier,
      status: 'active',
    };
  }
}

// 判断是否 pro 用户（含 DB 降级回退）
export async function isPro(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.tier === 'pro' || user?.tier === 'team';
}
