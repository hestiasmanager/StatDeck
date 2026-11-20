import { ImageResponse } from "next/og";
import { getSharedDeck } from "@/lib/share/share-store";
import type { DeckAST, OutputFormat } from "@/lib/schemas/deck-schema";

export const alt = "StatDeck Presentation Preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let ast: DeckAST | null = null;
  let format: OutputFormat = "carousel";

  const record = await getSharedDeck(token);
  if (record?.ast) {
    ast = record.ast as DeckAST;
    format = (record.format || ast.format || "carousel") as OutputFormat;
  }

  const title = ast?.meta?.title || "StatDeck Presentation";
  const subtitle =
    ast?.meta?.subtitle ||
    ast?.executiveSummary?.slice(0, 110) ||
    "Turn data and bullet points into boardroom-ready visual decks.";
  const category = ast?.meta?.category || "Visual Report";
  const firstKpi = ast?.kpis?.[0];
  const secondKpi = ast?.kpis?.[1];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 70px",
          backgroundColor: "#090D16",
          color: "#F8FAFC",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle Background Glow */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37,99,235,0.25) 0%, rgba(9,13,22,0) 70%)",
          }}
        />

        {/* Top Header Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Brand Pill */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: "20px",
                fontWeight: 900,
              }}
            >
              S
            </div>
            <span style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.5px" }}>
              Stat<span style={{ color: "#3B82F6" }}>Deck</span>
            </span>
          </div>

          {/* Category & Format Pill */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                backgroundColor: "rgba(37,99,235,0.15)",
                border: "1px solid rgba(59,130,246,0.3)",
                color: "#60A5FA",
                fontSize: "13px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {category}
            </span>
            <span
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#CBD5E1",
                fontSize: "13px",
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {format}
            </span>
          </div>
        </div>

        {/* Main Center Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "980px" }}>
          <h1
            style={{
              fontSize: title.length > 40 ? "48px" : "56px",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              color: "#FFFFFF",
              margin: 0,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: "22px",
              lineHeight: 1.4,
              color: "#94A3B8",
              margin: 0,
              maxWidth: "850px",
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Bottom Metrics Strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "24px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {firstKpi ? (
            <div style={{ display: "flex", gap: "36px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span
                  style={{
                    fontSize: "36px",
                    fontWeight: 900,
                    color: "#38BDF8",
                    fontFamily: "monospace",
                    letterSpacing: "-1px",
                  }}
                >
                  {firstKpi.value}
                </span>
                <span style={{ fontSize: "14px", color: "#94A3B8", fontWeight: 600 }}>
                  {firstKpi.label} {firstKpi.delta ? `(${firstKpi.delta})` : ""}
                </span>
              </div>

              {secondKpi && (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span
                    style={{
                      fontSize: "36px",
                      fontWeight: 900,
                      color: "#34D399",
                      fontFamily: "monospace",
                      letterSpacing: "-1px",
                    }}
                  >
                    {secondKpi.value}
                  </span>
                  <span style={{ fontSize: "14px", color: "#94A3B8", fontWeight: 600 }}>
                    {secondKpi.label} {secondKpi.delta ? `(${secondKpi.delta})` : ""}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <span style={{ fontSize: "15px", color: "#64748B", fontWeight: 500 }}>
              Interactive Presentation Viewer
            </span>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "12px",
              backgroundColor: "rgba(37,99,235,0.12)",
              border: "1px solid rgba(37,99,235,0.3)",
              color: "#93C5FD",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            <span>View Deck & Remix</span>
            <span style={{ fontSize: "16px" }}>→</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
