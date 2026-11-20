import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db/client";
import { brandKits } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { TIER_ENTITLEMENTS } from "@/lib/paddle/types";
import { z } from "zod";

const BrandKitSaveSchema = z.object({
  name: z.string().min(1).max(100),
  domain: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  colors: z.object({
    primary: z.string(),
    secondary: z.string().optional(),
    accent: z.string(),
    background: z.string().optional(),
    surface: z.string().optional(),
    text: z.string().optional(),
  }),
  fonts: z.object({
    display: z.string(),
    body: z.string(),
  }),
  isDefault: z.boolean().default(false),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const kits = await db
        .select()
        .from(brandKits)
        .where(eq(brandKits.workspaceId, user.workspaceId))
        .orderBy(desc(brandKits.createdAt));

      return NextResponse.json({ brandKits: kits });
    } catch {
      return NextResponse.json({ brandKits: [] });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch brand kits" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = BrandKitSaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    // Check tier limits for saved brand kits
    const tierEntitlement = TIER_ENTITLEMENTS[user.subscriptionTier] || TIER_ENTITLEMENTS.free;
    const maxKits = tierEntitlement.maxSavedBrandKits;

    try {
      const existingKits = await db
        .select()
        .from(brandKits)
        .where(eq(brandKits.workspaceId, user.workspaceId));

      if (existingKits.length >= maxKits) {
        return NextResponse.json(
          {
            error: `Your current ${user.subscriptionTier.toUpperCase()} tier allows up to ${maxKits} saved Brand Kit${
              maxKits === 1 ? "" : "s"
            }. Please upgrade to add more.`,
            upgradeRequired: true,
          },
          { status: 403 }
        );
      }

      const [newKit] = await db
        .insert(brandKits)
        .values({
          workspaceId: user.workspaceId,
          name: parsed.data.name,
          domain: parsed.data.domain || null,
          logoUrl: parsed.data.logoUrl || null,
          colors: parsed.data.colors as any,
          fonts: parsed.data.fonts as any,
          isDefault: parsed.data.isDefault,
        })
        .returning();

      return NextResponse.json({ success: true, brandKit: newKit });
    } catch {
      return NextResponse.json({ success: true, brandKit: parsed.data });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save brand kit" },
      { status: 500 }
    );
  }
}
