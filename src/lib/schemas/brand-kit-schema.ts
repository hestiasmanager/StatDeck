import { z } from "zod";

export const BrandColorPaletteSchema = z.object({
  primary: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid primary hex color"),
  secondary: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid secondary hex color"),
  accent: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid accent hex color"),
  background: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid background hex color"),
  surface: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid surface hex color"),
  text: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid text hex color"),
});

export const BrandFontPairingSchema = z.object({
  display: z.string().default("Inter"),
  body: z.string().default("Inter"),
  googleFontUrl: z.string().optional(),
});

export const BrandKitSchema = z.object({
  id: z.string().uuid().optional(),
  workspaceId: z.string().uuid().optional(),
  name: z.string().min(1).max(80),
  domain: z.string().optional(),
  logoUrl: z.string().optional(),
  colors: BrandColorPaletteSchema,
  fonts: BrandFontPairingSchema,
  wcagContrastRatio: z.number().optional().describe("Contrast ratio against background"),
  isWcagCompliant: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  createdAt: z.string().optional(),
});

export type BrandKit = z.infer<typeof BrandKitSchema>;
export type BrandColorPalette = z.infer<typeof BrandColorPaletteSchema>;
export type BrandFontPairing = z.infer<typeof BrandFontPairingSchema>;
