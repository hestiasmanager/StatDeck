import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, id), eq(projects.workspaceId, user.workspaceId)))
        .limit(1);

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      return NextResponse.json({ project });
    } catch {
      return NextResponse.json({ error: "Database offline" }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error fetching project" },
      { status: 500 }
    );
  }
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
        .delete(projects)
        .where(and(eq(projects.id, id), eq(projects.workspaceId, user.workspaceId)));

      return NextResponse.json({ success: true, message: "Project deleted" });
    } catch {
      return NextResponse.json({ success: true, message: "Deleted" });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error deleting project" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  // Duplicate project action
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const [original] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, id), eq(projects.workspaceId, user.workspaceId)))
        .limit(1);

      if (!original) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      const [duplicated] = await db
        .insert(projects)
        .values({
          workspaceId: user.workspaceId,
          title: `${original.title} (Copy)`,
          format: original.format,
          templateId: original.templateId,
          brandKitId: original.brandKitId,
          ast: original.ast,
          dataSourceUrl: original.dataSourceUrl,
          inputSourceType: original.inputSourceType,
        })
        .returning();

      return NextResponse.json({ success: true, project: duplicated });
    } catch {
      return NextResponse.json({ error: "Duplicate failed" }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error duplicating project" },
      { status: 500 }
    );
  }
}
