// POST /api/v1/waffo/checkout — 创建 waffo 订阅 (v1.3)
// 需要登录; plan 从服务端 PLAN_PRICES 映射, 不读客户端金额
// Body: { plan: "pro_monthly" | "pro_yearly" }

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ok, fail } from '@/lib/api-response';
import { ApiError } from '@/lib/errors';
import {
  createWaffoSubscription,
  waffoEnabled,
  PLAN_PRICES,
  type PlanId,
} from '@/services/waffo-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!waffoEnabled()) {
      throw ApiError.badParam('Waffo is not configured. Contact support.');
    }
    const user = await getCurrentUser();
    if (!user) throw ApiError.unauthorized('Please sign in first');

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      throw ApiError.badParam('Invalid JSON body');
    }

    const plan = body.plan as PlanId;
    if (!PLAN_PRICES[plan]) {
      throw ApiError.badParam('Unknown plan');
    }

    const result = await createWaffoSubscription({
      plan,
      userId: user.id,
      userEmail: user.email,
    });

    if (!result.redirectUrl) {
      // 无跳转 URL 时回读 subscriptionId 手动处理
      throw ApiError.internal('Waffo did not return a checkout URL');
    }

    return ok({ checkoutUrl: result.redirectUrl });
  } catch (err) {
    return fail(err);
  }
}
