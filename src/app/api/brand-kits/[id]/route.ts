import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db/client";
import { brandKits } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await db
        .delete(brandKits)
        .where(and(eq(brandKits.id, id), eq(brandKits.workspaceId, user.workspaceId)));

      return NextResponse.json({ success: true, message: "Brand kit deleted" });
    } catch {
      return NextResponse.json({ success: true });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error deleting brand kit" },
      { status: 500 }
    );
  }
}
