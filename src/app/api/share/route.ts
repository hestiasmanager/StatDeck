import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { redis } from "@/lib/cache/redis";
import { DeckSchema } from "@/lib/schemas/deck-schema";

export interface SharedDeckRecord {
  id: string;
  ast: unknown;
  format: string;
  templateId: string;
  createdAt: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ast, format = "carousel", templateId } = body;

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

    // Store in Redis with 30 days TTL (2,592,000 seconds)
    const redisKey = `statdeck:share:${token}`;
    await redis.set(redisKey, record, { ex: 30 * 24 * 60 * 60 });

    const origin =
      req.headers.get("x-forwarded-host") ||
      req.headers.get("host") ||
      "stat-deck.vercel.app";
    const protocol = origin.includes("localhost") ? "http" : "https";
    const shareUrl = `${protocol}://${origin}/s/${token}`;

    return NextResponse.json({
      ok: true,
      token,
      shareUrl,
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

    const redisKey = `statdeck:share:${token}`;
    const record = await redis.get<SharedDeckRecord>(redisKey);

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
