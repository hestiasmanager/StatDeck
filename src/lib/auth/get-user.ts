import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { users, workspaces, workspaceMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { SubscriptionTier } from "@/lib/paddle/types";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: string | null;
  weeklyExportCount: number;
  workspaceId: string;
}

// In-memory fallback for local offline testing when database is unreachable
const memoryUsers = new Map<string, CurrentUser>();

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser || !authUser.email) {
      return null;
    }

    const email = authUser.email.toLowerCase();

    try {
      // 1. Query user from PostgreSQL via Drizzle
      const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
      let userRecord = existingUsers[0];

      if (!userRecord) {
        // Create user record
        const [newUser] = await db
          .insert(users)
          .values({
            email,
            fullName: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
            avatarUrl: authUser.user_metadata?.avatar_url || null,
            subscriptionTier: "free",
            subscriptionStatus: "active",
            weeklyExportCount: 0,
          })
          .returning();
        userRecord = newUser;

        // Create default workspace
        const [newWorkspace] = await db
          .insert(workspaces)
          .values({
            name: `${userRecord.fullName || userRecord.email.split("@")[0]}'s Workspace`,
            slug: `ws-${userRecord.id.slice(0, 8)}`,
            ownerId: userRecord.id,
          })
          .returning();

        // Add user as workspace owner
        await db.insert(workspaceMembers).values({
          workspaceId: newWorkspace.id,
          userId: userRecord.id,
          role: "owner",
        });

        return {
          id: userRecord.id,
          email: userRecord.email,
          fullName: userRecord.fullName,
          avatarUrl: userRecord.avatarUrl,
          subscriptionTier: userRecord.subscriptionTier as SubscriptionTier,
          subscriptionStatus: userRecord.subscriptionStatus,
          weeklyExportCount: userRecord.weeklyExportCount,
          workspaceId: newWorkspace.id,
        };
      }

      // Find user workspace
      const memberRecord = await db
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.userId, userRecord.id))
        .limit(1);

      let workspaceId = memberRecord[0]?.workspaceId;

      if (!workspaceId) {
        const [newWorkspace] = await db
          .insert(workspaces)
          .values({
            name: `${userRecord.fullName || userRecord.email.split("@")[0]}'s Workspace`,
            slug: `ws-${userRecord.id.slice(0, 8)}`,
            ownerId: userRecord.id,
          })
          .returning();

        await db.insert(workspaceMembers).values({
          workspaceId: newWorkspace.id,
          userId: userRecord.id,
          role: "owner",
        });
        workspaceId = newWorkspace.id;
      }

      return {
        id: userRecord.id,
        email: userRecord.email,
        fullName: userRecord.fullName,
        avatarUrl: userRecord.avatarUrl,
        subscriptionTier: userRecord.subscriptionTier as SubscriptionTier,
        subscriptionStatus: userRecord.subscriptionStatus,
        weeklyExportCount: userRecord.weeklyExportCount,
        workspaceId,
      };
    } catch (dbError) {
      console.warn("Database query failed, using in-memory session fallback:", dbError);
      // In-memory fallback
      let mem = memoryUsers.get(email);
      if (!mem) {
        mem = {
          id: authUser.id,
          email,
          fullName: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
          avatarUrl: authUser.user_metadata?.avatar_url || null,
          subscriptionTier: "free",
          subscriptionStatus: "active",
          weeklyExportCount: 0,
          workspaceId: `mem-ws-${authUser.id.slice(0, 8)}`,
        };
        memoryUsers.set(email, mem);
      }
      return mem;
    }
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}
