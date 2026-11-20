import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { DeckAST } from "@/lib/schemas/deck-schema";
import type { BrandColorPalette, BrandFontPairing } from "@/lib/schemas/brand-kit-schema";

// 1. Users table (synced with Supabase Auth or Clerk)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  paddleCustomerId: text("paddle_customer_id").unique(),
  paddleSubscriptionId: text("paddle_subscription_id").unique(),
  subscriptionTier: text("subscription_tier", { enum: ["free", "creator", "agency"] })
    .default("free")
    .notNull(),
  subscriptionStatus: text("subscription_status", {
    enum: ["active", "past_due", "canceled", "trialing", "paused"],
  }).default("active"),
  subscriptionPeriodEnd: timestamp("subscription_period_end", { withTimezone: true }),
  weeklyExportCount: integer("weekly_export_count").default(0).notNull(),
  exportCountResetAt: timestamp("export_count_reset_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Workspaces table
export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. Workspace Members
export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "admin", "member"] })
      .default("member")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.workspaceId, t.userId)]
);

// 4. Brand Kits table
export const brandKits = pgTable("brand_kits", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  domain: text("domain"),
  logoUrl: text("logo_url"),
  colors: jsonb("colors").$type<BrandColorPalette>().notNull(),
  fonts: jsonb("fonts").$type<BrandFontPairing>().notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 5. Projects table
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  format: text("format", { enum: ["infographic", "carousel", "presentation"] })
    .default("carousel")
    .notNull(),
  templateId: text("template_id").default("clean-bento").notNull(),
  brandKitId: uuid("brand_kit_id").references(() => brandKits.id, { onDelete: "set null" }),
  ast: jsonb("ast").$type<DeckAST>().notNull(),
  inputSourceType: text("input_source_type", {
    enum: ["url", "csv", "excel", "pdf", "text", "preset", "mcp"],
  }),
  inputHash: text("input_hash"),
  dataSourceUrl: text("data_source_url"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  isPublic: boolean("is_public").default(false).notNull(),
  shareToken: text("share_token").unique(),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 6. Exports Log table
export const exportsLog = pgTable("exports_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  format: text("format", { enum: ["infographic", "carousel", "presentation"] }).notNull(),
  fileType: text("file_type", { enum: ["png", "svg", "pdf", "pptx"] }).notNull(),
  hasWatermark: boolean("has_watermark").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 7. Paddle Events table (Idempotency deduplication)
export const paddleEvents = pgTable("paddle_events", {
  id: text("id").primaryKey(), // Paddle Event ID (evt_xxx)
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow().notNull(),
  payload: jsonb("payload").notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  workspaceMembers: many(workspaceMembers),
  exports: many(exportsLog),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  members: many(workspaceMembers),
  brandKits: many(brandKits),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [projects.workspaceId], references: [workspaces.id] }),
  brandKit: one(brandKits, { fields: [projects.brandKitId], references: [brandKits.id] }),
  exports: many(exportsLog),
}));
