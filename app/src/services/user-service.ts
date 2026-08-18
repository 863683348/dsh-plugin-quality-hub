// ============================================================
// 用户服务 (v1.3) — Google OAuth 登录后的 upsert
// ============================================================

import { prisma } from '@/lib/prisma';
import type { GoogleProfile } from '@/lib/google-oauth';

export async function upsertGoogleUser(profile: GoogleProfile) {
  const data = {
    name: profile.name ?? null,
    avatarUrl: profile.picture ?? null,
    locale: 'en',
  };

  // 优先按 googleSub 匹配
  const bySub = await prisma.user.findUnique({
    where: { googleSub: profile.id },
  });
  if (bySub) {
    return prisma.user.update({ where: { id: bySub.id }, data });
  }

  // 其次按 email 匹配（同一邮箱不同 google 账号升级）
  const byEmail = await prisma.user.findUnique({
    where: { email: profile.email },
  });
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: { ...data, googleSub: profile.id },
    });
  }

  // 新建
  return prisma.user.create({
    data: {
      email: profile.email,
      googleSub: profile.id,
      ...data,
    },
  });
}
