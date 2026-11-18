import { NextRequest, NextResponse } from "next/server";
import { scrapeBrandKitFromDomain } from "@/lib/brand/scraper";
import { checkRateLimit } from "@/lib/cache/rate-limit";
import { z } from "zod";

const DomainQuerySchema = z.object({
  domain: z.string().min(3),
});

export async function GET(req: NextRequest) {
  try {
    const domain = req.nextUrl.searchParams.get("domain");
    const parse = DomainQuerySchema.safeParse({ domain });
    if (!parse.success) {
      return NextResponse.json(
        { error: "Query param 'domain' is required (e.g. ?domain=stripe.com)" },
        { status: 400 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateLimit = await checkRateLimit(`rate:brand:${ip}`, 30, 600000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many brand kit requests. Please slow down." },
        { status: 429 }
      );
    }

    const brandKit = await scrapeBrandKitFromDomain(parse.data.domain);

    return NextResponse.json({
      success: true,
      brandKit,
    });
  } catch (error) {
    console.error("Brand kit scraper API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to extract brand kit" },
      { status: 500 }
    );
  }
}
