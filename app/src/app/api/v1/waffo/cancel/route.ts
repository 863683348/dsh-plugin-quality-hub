// POST /api/v1/waffo/cancel — 取消订阅 (v1.3)
// 需要登录; 取消后 currentPeriodEnd 前仍可访问 (grace)
// Body: { subscriptionId: waffo 侧 id }

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ok, fail } from '@/lib/api-response';
import { ApiError } from '@/lib/errors';
import { getWaffo, getActiveSubscription, waffoEnabled } from '@/services/waffo-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    if (!waffoEnabled()) throw ApiError.badParam('Waffo not configured');
    const user = await getCurrentUser();
    if (!user) throw ApiError.unauthorized('Please sign in first');

    const sub = await getActiveSubscription(user.id);
    if (!sub) throw ApiError.notFound('No active subscription');
    if (!sub.providerSubscriptionId) throw ApiError.notFound('No waffo subscription id');

    const response = await getWaffo()
      .subscription()
      .cancel({ subscriptionId: sub.providerSubscriptionId });

    if (!response.isSuccess()) {
      throw ApiError.internal(
        `waffo cancel failed [${response.getCode()}]: ${response.getMessage()}`
      );
    }

    // 本地标记 canceled（保留 currentPeriodEnd 为 grace）
    const prisma = (await import('@/lib/prisma')).prisma;
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'canceled' },
    });

    return ok({ canceled: true, subscriptionId: sub.providerSubscriptionId });
  } catch (err) {
    return fail(err);
  }
}
