import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db/client";
import { users, exportsLog } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

const LogExportSchema = z.object({
  projectId: z.string().uuid().optional().nullable(),
  format: z.enum(["infographic", "carousel", "presentation"]),
  fileType: z.enum(["png", "svg", "pdf", "pptx"]),
  hasWatermark: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const parsed = LogExportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (user) {
      try {
        await db.insert(exportsLog).values({
          userId: user.id,
          projectId: parsed.data.projectId || null,
          format: parsed.data.format,
          fileType: parsed.data.fileType,
          hasWatermark: parsed.data.hasWatermark,
        });

        // Increment user's weekly export count
        await db
          .update(users)
          .set({
            weeklyExportCount: sql`${users.weeklyExportCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
      } catch (dbErr) {
        console.warn("Could not log export to database:", dbErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to log export" },
      { status: 500 }
    );
  }
}
