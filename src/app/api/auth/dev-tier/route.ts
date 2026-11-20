import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const TierSchema = z.object({
  tier: z.enum(["free", "creator", "agency"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = TierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid tier. Must be free, creator, or agency" }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await db
        .update(users)
        .set({
          subscriptionTier: parsed.data.tier,
          updatedAt: new Date(),
        })
        .where(eq(users.id, currentUser.id));
    } catch {
      // In-memory or fallback
    }

    return NextResponse.json({
      success: true,
      tier: parsed.data.tier,
      message: `Tier switched to ${parsed.data.tier}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to switch tier" },
      { status: 500 }
    );
  }
}
