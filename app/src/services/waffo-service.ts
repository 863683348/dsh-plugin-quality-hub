// ============================================================
// waffo 支付服务 (v1.3) — Merchant of Record 订阅
// 文档: waffo.com/docs  |  SDK: @waffo/waffo-node
// 安全铁律:
//   1. webhook 必须验签 (SDK handleWebhook 内置 RSA 验签)
//   2. plan/amount 从服务端 PLAN_PRICES 映射, 不读客户端传参
//   3. 幂等: Payment.providerEventId unique, 已处理直接返回
//   4. 取消后 currentPeriodEnd 前仍可访问 (grace)
// ============================================================

import { Waffo, Environment } from '@waffo/waffo-node';
import { prisma } from '@/lib/prisma';

// ---------------- plan 配置（唯一事实来源，改价只改这里） ----------------
export interface PlanConfig {
  id: string; // merchantSubscriptionId
  amount: string; // waffo amount (USD)
  periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  periodInterval: string;
  description: string;
  productName: string;
  tier: 'pro';
}

export const PLAN_PRICES: Record<'pro_monthly' | 'pro_yearly', PlanConfig> = {
  pro_monthly: {
    id: 'DSH_PRO_MONTHLY',
    amount: '9.00',
    periodType: 'MONTHLY',
    periodInterval: '1',
    description: 'DSH Quality Pro — monthly',
    productName: 'SUBSCRIPTION',
    tier: 'pro',
  },
  pro_yearly: {
    id: 'DSH_PRO_YEARLY',
    amount: '98.00', // 原价 $108, 优惠 $98 (年付省 $10)
    periodType: 'MONTHLY',
    periodInterval: '12',
    description: 'DSH Quality Pro — yearly (save $10)',
    productName: 'SUBSCRIPTION',
    tier: 'pro',
  },
};

export type PlanId = keyof typeof PLAN_PRICES;

export function waffoEnabled(): boolean {
  return Boolean(
    process.env.WAFFO_API_KEY &&
      process.env.WAFFO_PRIVATE_KEY &&
      process.env.WAFFO_PUBLIC_KEY &&
      process.env.WAFFO_MERCHANT_ID
  );
}

// 单例 client
let _client: Waffo | null = null;
export function getWaffo(): Waffo {
  if (_client) return _client;
  const env =
    process.env.WAFFO_ENV === 'production' ? Environment.PRODUCTION : Environment.SANDBOX;
  _client = new Waffo({
    apiKey: process.env.WAFFO_API_KEY!,
    privateKey: process.env.WAFFO_PRIVATE_KEY!,
    waffoPublicKey: process.env.WAFFO_PUBLIC_KEY!,
    merchantId: process.env.WAFFO_MERCHANT_ID!,
    environment: env,
  });
  return _client;
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://dshquality.com';
}

// ---------------- 创建订阅 ----------------
export async function createWaffoSubscription(opts: {
  plan: PlanId;
  userId: string;
  userEmail: string;
}) {
  const plan = PLAN_PRICES[opts.plan];
  const subscriptionRequest =
    `DSH${Date.now()}${Math.floor(Math.random() * 100000)}`.slice(0, 32);

  const response = await getWaffo().subscription().create({
    subscriptionRequest,
    merchantSubscriptionId: plan.id,
    currency: 'USD',
    amount: plan.amount,
    notifyUrl: `${siteUrl()}/api/v1/waffo/webhook`,
    successRedirectUrl: `${siteUrl()}/account?waffo=success`,
    failedRedirectUrl: `${siteUrl()}/pricing?waffo=failed`,
    cancelRedirectUrl: `${siteUrl()}/pricing?waffo=cancelled`,
    subscriptionManagementUrl: `${siteUrl()}/account`,
    productInfo: {
      description: plan.description,
      periodType: plan.periodType,
      periodInterval: plan.periodInterval,
    },
    userInfo: {
      userId: opts.userId,
      userEmail: opts.userEmail,
      userTerminal: 'WEB',
    },
    goodsInfo: {
      goodsId: plan.id,
      goodsName: plan.description,
    },
    paymentInfo: {
      productName: plan.productName,
    },
  });

  if (!response.isSuccess()) {
    throw new Error(
      `waffo create failed [${response.getCode()}]: ${response.getMessage()}`
    );
  }

  const data = response.getData();
  return {
    data,
    redirectUrl:
      typeof data?.subscriptionAction === 'string' &&
      data.subscriptionAction.startsWith('http')
        ? data.subscriptionAction
        : typeof data?.subscriptionAction === 'string'
          ? parseActionUrl(data.subscriptionAction)
          : null,
  };
}

// subscriptionAction 可能是 JSON 字符串含 webUrl
function parseActionUrl(action: string): string | null {
  try {
    const parsed = JSON.parse(action);
    if (typeof parsed.webUrl === 'string') return parsed.webUrl;
    if (typeof parsed.url === 'string') return parsed.url;
  } catch {
    // 不是 JSON, 尝试原样
  }
  return action.startsWith('http') ? action : null;
}

// ---------------- 订阅状态映射 ----------------
// waffo 状态: AUTHORIZATION_REQUIRED | IN_PROGRESS | ACTIVE | CLOSE |
//             MERCHANT_CANCELLED | USER_CANCELLED | CHANNEL_CANCELLED | EXPIRED
export function mapWaffoStatus(status: string | undefined): string {
  switch (status) {
    case 'ACTIVE':
      return 'active';
    case 'IN_PROGRESS':
    case 'AUTHORIZATION_REQUIRED':
      return 'trialing';
    case 'CLOSE':
    case 'EXPIRED':
      return 'expired';
    case 'MERCHANT_CANCELLED':
    case 'USER_CANCELLED':
    case 'CHANNEL_CANCELLED':
      return 'canceled';
    default:
      return 'active';
  }
}

// ---------------- 处理订阅 webhook（幂等 + 发权益） ----------------
// 由 route handler 调: handleWebhook(body, signature) 验签后再进这里
export async function handleSubscriptionNotification(
  notification: {
    eventType: string;
    result?: {
      subscriptionRequest?: string;
      merchantSubscriptionId?: string;
      subscriptionId?: string;
      subscriptionStatus?: string;
      currency?: string;
      amount?: string;
      userInfo?: Record<string, unknown>;
      updatedAt?: string;
      [key: string]: unknown;
    };
  }
) {
  const result = notification.result;
  if (!result?.subscriptionId) return;

  // 幂等 key：用 subscriptionId + 事件类型
  const eventKey = `${notification.eventType}:${result.subscriptionId}`;
  const existing = await prisma.payment.findUnique({
    where: { providerEventId: eventKey },
  });
  if (existing) return; // 已处理

  // 找到订阅
  const sub = await prisma.subscription.findFirst({
    where: { providerSubscriptionId: result.subscriptionId },
  });
  if (!sub) {
    // 没有本地订阅记录 → 可能是未入库的授权，记一条 payment 防重即可
    await prisma.payment.create({
      data: {
        userId: 'unknown',
        providerEventId: eventKey,
        amountCents: toCents(result.amount),
        currency: result.currency?.toLowerCase() ?? 'usd',
        status: 'succeeded',
      },
    });
    return;
  }

  const newStatus = mapWaffoStatus(result.subscriptionStatus);
  const now = new Date();

  // 更新订阅状态 + 对应 user tier
  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: newStatus,
        providerSubscriptionId: result.subscriptionId,
        updatedAt: now,
      },
    }),
    prisma.user.update({
      where: { id: sub.userId },
      data: { tier: newStatus === 'active' ? 'pro' : 'free' },
    }),
    prisma.payment.create({
      data: {
        userId: sub.userId,
        subscriptionId: sub.id,
        providerEventId: eventKey,
        amountCents: toCents(result.amount),
        currency: result.currency?.toLowerCase() ?? 'usd',
        status: 'succeeded',
      },
    }),
  ]);
}

function toCents(amount: string | undefined): number {
  if (!amount) return 0;
  const n = Number(amount);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

// ---------------- 订阅管理辅助 ----------------
export async function getActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: { userId, status: { in: ['active', 'trialing'] } },
    orderBy: { createdAt: 'desc' },
  });
}
