export type SubscriptionTier = "free" | "creator" | "agency";

export interface TierEntitlements {
  maxSavedBrandKits: number;
  weeklyExports: number | "unlimited";
  hasWatermark: boolean;
  allowedExportFormats: Array<"png" | "svg" | "pdf" | "pptx">;
  bulkCsvBatching: boolean;
  customFooterBranding: boolean;
}

export const TIER_ENTITLEMENTS: Record<SubscriptionTier, TierEntitlements> = {
  free: {
    maxSavedBrandKits: 1, // Preview only
    weeklyExports: 3,
    hasWatermark: true,
    allowedExportFormats: ["png", "pdf"],
    bulkCsvBatching: false,
    customFooterBranding: false,
  },
  creator: {
    maxSavedBrandKits: 3,
    weeklyExports: "unlimited",
    hasWatermark: false,
    allowedExportFormats: ["png", "svg", "pdf"],
    bulkCsvBatching: false,
    customFooterBranding: false,
  },
  agency: {
    maxSavedBrandKits: 999, // Unlimited
    weeklyExports: "unlimited",
    hasWatermark: false,
    allowedExportFormats: ["png", "svg", "pdf", "pptx"],
    bulkCsvBatching: true,
    customFooterBranding: true,
  },
};

export interface PaddleWebhookEventPayload {
  event_id: string;
  event_type: string;
  occurred_at: string;
  data: {
    id: string;
    customer_id?: string;
    status?: string;
    items?: Array<{
      price: {
        id: string;
        product_id: string;
      };
    }>;
    current_billing_period?: {
      ends_at: string;
    };
    custom_data?: {
      userId?: string;
      workspaceId?: string;
    };
  };
}
