// POST /api/v1/waffo/webhook — waffo 订阅通知 (v1.3)
// 必须: SDK handleWebhook 验签 (RSA), 拒绝未验签请求
// 幂等: handleSubscriptionNotification 内 providerEventId unique

import { NextRequest } from 'next/server';
import { getWaffo, handleSubscriptionNotification, waffoEnabled } from '@/services/waffo-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!waffoEnabled()) {
    return new Response(JSON.stringify({ message: 'failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 读原始 body
  const body = await req.text();
  const signature = req.headers.get('x-signature') ?? '';

  try {
    const handler = getWaffo()
      .webhook()
      .onSubscriptionStatus(async (notification) => {
        await handleSubscriptionNotification(notification as never);
      })
      .onSubscriptionPeriodChanged(async (notification) => {
        await handleSubscriptionNotification(notification as never);
      })
      .onPayment(async (notification) => {
        // 订阅支付订单通知：记录但不重复发权益（订阅状态通知为准）
        await handleSubscriptionNotification(notification as never);
      });

    const result = await handler.handleWebhook(body, signature);

    // 按 waffo 要求回签名 + 200
    return new Response(result.responseBody, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-SIGNATURE': result.responseSignature,
      },
    });
  } catch (err) {
    console.error('[waffo/webhook]', err);
    return new Response(JSON.stringify({ message: 'failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
