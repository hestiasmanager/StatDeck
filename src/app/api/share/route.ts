import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { DeckSchema } from "@/lib/schemas/deck-schema";
import { saveSharedDeck, getSharedDeck, SharedDeckRecord } from "@/lib/share/share-store";

export type { SharedDeckRecord };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ast, format = "carousel", templateId, projectId } = body;

    if (!ast) {
      return NextResponse.json(
        { error: "Missing AST in request body." },
        { status: 400 }
      );
    }

    // Validate AST schema
    const parseResult = DeckSchema.safeParse(ast);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid Deck AST.", issues: parseResult.error.format() },
        { status: 422 }
      );
    }

    // Generate unique 10-char token
    const token = crypto.randomBytes(6).toString("base64url").slice(0, 10);
    const resolvedTemplateId = templateId || parseResult.data.templateId || "editorial-slate";

    const record: SharedDeckRecord = {
      id: token,
      ast: parseResult.data,
      format: format || parseResult.data.format || "carousel",
      templateId: resolvedTemplateId,
      createdAt: Date.now(),
    };

    // Await and persist to Redis and/or Supabase
    const persistResult = await saveSharedDeck(record, projectId);
    if (!persistResult.ok) {
      return NextResponse.json(
        { error: persistResult.error || "Failed to persist share link to storage." },
        { status: 500 }
      );
    }

    const hostHeader =
      req.headers.get("x-forwarded-host") ||
      req.headers.get("host") ||
      (process.env.NEXT_PUBLIC_APP_URL
        ? process.env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, "")
        : "stat-deck.vercel.app");

    const protocol = hostHeader.includes("localhost") ? "http" : "https";
    const shareUrl = `${protocol}://${hostHeader}/s/${token}`;

    return NextResponse.json({
      ok: true,
      token,
      shareUrl,
      source: persistResult.source,
    });
  } catch (err) {
    console.error("Error creating share link:", err);
    return NextResponse.json(
      { error: "Failed to create share link." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token parameter." }, { status: 400 });
    }

    const record = await getSharedDeck(token);

    if (!record) {
      return NextResponse.json(
        { error: "Presentation not found or expired." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: record });
  } catch (err) {
    console.error("Error retrieving shared deck:", err);
    return NextResponse.json(
      { error: "Failed to retrieve shared deck." },
      { status: 500 }
    );
  }
}
