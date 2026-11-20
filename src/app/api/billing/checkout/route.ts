import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { PADDLE_PRICES } from "@/lib/paddle/client";
import { z } from "zod";

const CheckoutQuerySchema = z.object({
  tier: z.enum(["creator", "agency"]),
  billingCycle: z.enum(["monthly", "annual"]).default("monthly"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to upgrade." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CheckoutQuerySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid plan selection" }, { status: 400 });
    }

    const priceId =
      parsed.data.tier === "agency"
        ? PADDLE_PRICES.agencyMonthly
        : PADDLE_PRICES.creatorMonthly;

    return NextResponse.json({
      success: true,
      priceId,
      tier: parsed.data.tier,
      userId: user.id,
      customerEmail: user.email,
      workspaceId: user.workspaceId,
      clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "test_token",
      environment: process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to initiate checkout" },
      { status: 500 }
    );
  }
}
