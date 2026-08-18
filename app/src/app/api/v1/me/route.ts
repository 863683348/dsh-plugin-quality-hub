// GET /api/v1/me — 当前登录用户 + 订阅状态 (v1.3)
// 未登录返回 4010 UNAUTHORIZED

import { getCurrentUser } from '@/lib/auth';
import { getActiveSubscription } from '@/services/waffo-service';
import { ok, fail } from '@/lib/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response(JSON.stringify({ code: 4010, data: null, message: 'Not signed in' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const subscription = await getActiveSubscription(user.id);
    const isPro = user.tier === 'pro' || user.tier === 'team';
    return ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        locale: user.locale,
      },
      tier: isPro ? 'pro' : user.tier,
      isPro,
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            provider: subscription.provider,
          }
        : null,
    });
  } catch (err) {
    return fail(err);
  }
}
