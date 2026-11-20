import { NextRequest, NextResponse } from "next/server";
import { normalizeGoogleSheetsUrl } from "@/lib/parsers/live-sync";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "Query param 'url' is required." }, { status: 400 });
    }

    const exportUrl = normalizeGoogleSheetsUrl(url);

    const response = await fetch(exportUrl, {
      headers: {
        "User-Agent": "StatDeck/1.0 (LiveSheetSync)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Could not fetch Google Sheet / CSV. Please ensure the link is public ("Anyone with the link can view"). Status: ${response.status}`,
        },
        { status: 400 }
      );
    }

    const csvText = await response.text();

    return NextResponse.json({
      success: true,
      csvText,
      exportUrl,
      refreshedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch live sheet" },
      { status: 500 }
    );
  }
}
