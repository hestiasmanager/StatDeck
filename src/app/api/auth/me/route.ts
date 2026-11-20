import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      weeklyExportCount: user.weeklyExportCount,
      workspaceId: user.workspaceId,
    },
  });
}
