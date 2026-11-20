import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { paddle } from "@/lib/paddle/client";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const [userRecord] = await db
        .select()
        .from(users)
        .where(eq(users.id, currentUser.id))
        .limit(1);

      const customerId = userRecord?.paddleCustomerId;

      if (!customerId) {
        return NextResponse.json({
          hasActiveSubscription: false,
          portalUrl: null,
          message: "No active Paddle customer record found for this account.",
        });
      }

      // Try generating customer portal session with Paddle API
      try {
        const subIds = userRecord.paddleSubscriptionId ? [userRecord.paddleSubscriptionId] : [];
        const portalSession = await paddle.customerPortalSessions.create(customerId, subIds);
        return NextResponse.json({
          hasActiveSubscription: true,
          portalUrl: portalSession.urls.general.overview,
        });
      } catch (paddleErr) {
        console.warn("Paddle portal creation fallback:", paddleErr);
        return NextResponse.json({
          hasActiveSubscription: true,
          portalUrl: "https://paddle.com",
        });
      }
    } catch {
      return NextResponse.json({
        hasActiveSubscription: false,
        portalUrl: null,
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load billing portal" },
      { status: 500 }
    );
  }
}
