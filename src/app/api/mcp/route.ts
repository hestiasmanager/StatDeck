import { NextRequest, NextResponse } from "next/server";
import { DeckSchema } from "@/lib/schemas/deck-schema";
import { z } from "zod";

/**
 * Lightweight MCP (Model Context Protocol) Endpoint.
 * Allows external LLMs (Claude Desktop, ChatGPT Actions, Cursor) to submit
 * already-structured markdown outlines or raw JSON ASTs directly into StatDeck
 * at $0.00 token cost to StatDeck.
 */
const McpToolCallSchema = z.object({
  method: z.literal("tools/call").default("tools/call"),
  params: z.object({
    name: z.literal("create_statdeck"),
    arguments: z.object({
      title: z.string().min(3),
      subtitle: z.string().optional(),
      kpis: z.array(
        z.object({
          value: z.string(),
          label: z.string(),
          delta: z.string().optional(),
        })
      ).min(1).max(4),
      chart: z
        .object({
          type: z.enum(["bar", "horizontal_bar", "donut", "line"]),
          title: z.string(),
          unit: z.string().default(""),
          data: z.array(z.object({ label: string(), value: z.number() })),
        })
        .optional(),
      format: z.enum(["infographic", "carousel", "presentation"]).default("carousel"),
      templateId: z.string().default("clean-bento"),
    }),
  }),
});

function string() {
  return z.string();
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();

    // Check if client is doing MCP tool discovery
    if (json.method === "tools/list") {
      return NextResponse.json({
        tools: [
          {
            name: "create_statdeck",
            description:
              "Generate an editorial, brand-grade infographic, LinkedIn carousel, or native PowerPoint deck from data. Returns a direct interactive preview link.",
            inputSchema: {
              type: "object",
              properties: {
                title: { type: "string", description: "Headline title" },
                subtitle: { type: "string", description: "Sub-headline thesis" },
                format: {
                  type: "string",
                  enum: ["infographic", "carousel", "presentation"],
                  default: "carousel",
                },
                templateId: { type: "string", default: "clean-bento" },
                kpis: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      value: { type: "string" },
                      label: { type: "string" },
                      delta: { type: "string" },
                    },
                    required: ["value", "label"],
                  },
                },
                chart: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["bar", "horizontal_bar", "donut", "line"] },
                    title: { type: "string" },
                    unit: { type: "string" },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          label: { type: "string" },
                          value: { type: "number" },
                        },
                        required: ["label", "value"],
                      },
                    },
                  },
                  required: ["type", "title", "data"],
                },
              },
              required: ["title", "kpis"],
            },
          },
        ],
      });
    }

    const parse = McpToolCallSchema.safeParse(json);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Invalid MCP Tool Call syntax", details: parse.error.flatten() },
        { status: 400 }
      );
    }

    const { arguments: args } = parse.data.params;

    // Build validated DeckSchema AST
    const fullAst = DeckSchema.parse({
      meta: {
        title: args.title,
        subtitle: args.subtitle || "",
        sourceCitations: ["Generated via MCP Agent"],
      },
      kpis: args.kpis.map((kpi, idx) => ({
        id: `mcp-kpi-${idx + 1}`,
        value: kpi.value,
        label: kpi.label,
        delta: kpi.delta,
        deltaType: "neutral" as const,
      })),
      charts: args.chart
        ? [
            {
              id: "mcp-chart-1",
              type: args.chart.type,
              title: args.chart.title,
              unit: args.chart.unit || "",
              data: args.chart.data,
            },
          ]
        : [],
      blocks: [],
      templateId: args.templateId,
      format: args.format,
      watermark: true,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const compressedAst = encodeURIComponent(JSON.stringify(fullAst));
    const previewUrl = `${appUrl}/studio?ast=${compressedAst}`;

    return NextResponse.json({
      content: [
        {
          type: "text",
          text: `Deck successfully constructed in StatDeck! View, edit and export here:\n${previewUrl}`,
        },
      ],
      previewUrl,
    });
  } catch (err) {
    console.error("MCP handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "MCP Execution Error" },
      { status: 500 }
    );
  }
}
