import { NextRequest, NextResponse } from "next/server";
import { paddle } from "@/lib/paddle/client";
import { recordPaddleEvent } from "@/lib/paddle/idempotency";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { PaddleWebhookEventPayload } from "@/lib/paddle/types";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("paddle-signature");
    const rawBody = await req.text();
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET_KEY;

    // Verify webhook signature if secret key is configured
    if (webhookSecret && signature) {
      try {
        paddle.webhooks.unmarshal(rawBody, webhookSecret, signature);
      } catch (sigErr) {
        console.error("Paddle webhook signature verification failed:", sigErr);
        return NextResponse.json({ error: "Invalid Paddle signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody) as PaddleWebhookEventPayload;
    const eventId = payload.event_id || `evt_${Date.now()}`;
    const eventType = payload.event_type;

    // Idempotency check: guarantee event is not processed twice
    const { isDuplicate } = await recordPaddleEvent(
      eventId,
      eventType,
      payload as unknown as Record<string, unknown>
    );

    if (isDuplicate) {
      return NextResponse.json({ received: true, message: "Duplicate event skipped" });
    }

    // Handle Subscription Events
    switch (eventType) {
      case "subscription.created":
      case "subscription.updated": {
        const subData = payload.data;
        const customerId = subData.customer_id;
        const subId = subData.id;
        const status = subData.status === "active" ? "active" : "past_due";
        const userId = subData.custom_data?.userId;
        const priceId = subData.items?.[0]?.price?.id;

        const isAgency = priceId === process.env.PADDLE_AGENCY_PRICE_ID;
        const tier = isAgency ? "agency" : "creator";

        if (userId) {
          await db
            .update(users)
            .set({
              paddleCustomerId: customerId,
              paddleSubscriptionId: subId,
              subscriptionTier: tier,
              subscriptionStatus: status,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId));
        }
        break;
      }

      case "subscription.canceled": {
        const subData = payload.data;
        const subId = subData.id;

        await db
          .update(users)
          .set({
            subscriptionTier: "free",
            subscriptionStatus: "canceled",
            updatedAt: new Date(),
          })
          .where(eq(users.paddleSubscriptionId, subId));
        break;
      }

      default:
        // Acknowledge unhandled event types gracefully
        break;
    }

    return NextResponse.json({ received: true, eventId, eventType });
  } catch (error) {
    console.error("Paddle webhook handling error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal webhook processing error" },
      { status: 500 }
    );
  }
}
