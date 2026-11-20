import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { DeckAST, OutputFormat } from "@/lib/schemas/deck-schema";
import { z } from "zod";

const SaveProjectSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200),
  format: z.enum(["infographic", "carousel", "presentation"]).default("carousel"),
  templateId: z.string().default("clean-bento"),
  brandKitId: z.string().uuid().optional().nullable(),
  ast: z.record(z.unknown()),
  dataSourceUrl: z.string().optional().nullable(),
  inputSourceType: z.string().optional().nullable(),
});

// In-memory fallback if database is offline in local sandbox
const memoryProjects: Array<{
  id: string;
  workspaceId: string;
  title: string;
  format: OutputFormat;
  templateId: string;
  brandKitId: string | null;
  ast: DeckAST;
  dataSourceUrl: string | null;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}> = [];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const userProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.workspaceId, user.workspaceId))
        .orderBy(desc(projects.updatedAt));

      return NextResponse.json({ projects: userProjects });
    } catch {
      // In-memory fallback
      const userProjects = memoryProjects
        .filter((p) => p.workspaceId === user.workspaceId)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      return NextResponse.json({ projects: userProjects });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch projects" },
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
    const parsed = SaveProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { id, title, format, templateId, brandKitId, ast, dataSourceUrl, inputSourceType } = parsed.data;

    try {
      if (id) {
        // Update existing project
        const [updated] = await db
          .update(projects)
          .set({
            title,
            format: format as OutputFormat,
            templateId,
            brandKitId: brandKitId || null,
            ast: ast as unknown as DeckAST,
            dataSourceUrl: dataSourceUrl || null,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, id))
          .returning();

        if (updated) {
          return NextResponse.json({ success: true, project: updated });
        }
      }

      // Create new project
      const [newProject] = await db
        .insert(projects)
        .values({
          workspaceId: user.workspaceId,
          title,
          format: format as OutputFormat,
          templateId,
          brandKitId: brandKitId || null,
          ast: ast as unknown as DeckAST,
          dataSourceUrl: dataSourceUrl || null,
          inputSourceType: (inputSourceType as any) || "preset",
        })
        .returning();

      return NextResponse.json({ success: true, project: newProject });
    } catch {
      // In-memory fallback
      const existingIdx = id ? memoryProjects.findIndex((p) => p.id === id) : -1;
      const now = new Date();
      if (existingIdx !== -1) {
        memoryProjects[existingIdx] = {
          ...memoryProjects[existingIdx],
          title,
          format: format as OutputFormat,
          templateId,
          brandKitId: brandKitId || null,
          ast: ast as unknown as DeckAST,
          dataSourceUrl: dataSourceUrl || null,
          updatedAt: now,
        };
        return NextResponse.json({ success: true, project: memoryProjects[existingIdx] });
      } else {
        const newProj = {
          id: id || `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          workspaceId: user.workspaceId,
          title,
          format: format as OutputFormat,
          templateId,
          brandKitId: brandKitId || null,
          ast: ast as unknown as DeckAST,
          dataSourceUrl: dataSourceUrl || null,
          lastSyncedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        memoryProjects.unshift(newProj);
        return NextResponse.json({ success: true, project: newProj });
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save project" },
      { status: 500 }
    );
  }
}
