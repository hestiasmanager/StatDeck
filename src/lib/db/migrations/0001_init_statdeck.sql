-- Migration: 0001_init_statdeck.sql
-- Description: Complete initial schema for StatDeck with Paddle Billing and RLS policies

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    paddle_customer_id TEXT UNIQUE,
    paddle_subscription_id TEXT UNIQUE,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'creator', 'agency')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing', 'paused')),
    subscription_period_end TIMESTAMPTZ,
    weekly_export_count INT NOT NULL DEFAULT 0,
    export_count_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Workspace Members
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 4. Brand Kits
CREATE TABLE IF NOT EXISTS brand_kits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    domain TEXT,
    logo_url TEXT,
    colors JSONB NOT NULL DEFAULT '{"primary": "#2563EB", "secondary": "#1E293B", "accent": "#10B981", "background": "#FFFFFF", "surface": "#F8FAFC", "text": "#0F172A"}'::jsonb,
    fonts JSONB NOT NULL DEFAULT '{"display": "Inter", "body": "Inter"}'::jsonb,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'carousel' CHECK (format IN ('infographic', 'carousel', 'presentation')),
    template_id TEXT NOT NULL DEFAULT 'clean-bento',
    brand_kit_id UUID REFERENCES brand_kits(id) ON DELETE SET NULL,
    ast JSONB NOT NULL,
    input_source_type TEXT CHECK (input_source_type IN ('url', 'csv', 'excel', 'pdf', 'text', 'preset', 'mcp')),
    input_hash TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    share_token TEXT UNIQUE,
    view_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Exports Log
CREATE TABLE IF NOT EXISTS exports_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    format TEXT NOT NULL CHECK (format IN ('infographic', 'carousel', 'presentation')),
    file_type TEXT NOT NULL CHECK (file_type IN ('png', 'svg', 'pdf', 'pptx')),
    has_watermark BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Paddle Webhook Events (Idempotency storage)
CREATE TABLE IF NOT EXISTS paddle_events (
    id TEXT PRIMARY KEY, -- Paddle Event ID (evt_xxx)
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payload JSONB NOT NULL
);

-- Indexes for high-performance lookups
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_share_token ON projects(share_token);
CREATE INDEX IF NOT EXISTS idx_projects_input_hash ON projects(input_hash);
CREATE INDEX IF NOT EXISTS idx_brand_kits_workspace ON brand_kits(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_users_paddle_sub ON users(paddle_subscription_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports_log ENABLE ROW LEVEL SECURITY;

-- Workspace-scoped RLS policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can access their own profile') THEN
        CREATE POLICY "Users can access their own profile" ON users FOR ALL USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Members can view their workspaces') THEN
        CREATE POLICY "Members can view their workspaces" ON workspaces FOR SELECT
        USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = workspaces.id AND user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Members can access projects in their workspace') THEN
        CREATE POLICY "Members can access projects in their workspace" ON projects FOR ALL
        USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = projects.workspace_id AND user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public projects are viewable by anyone') THEN
        CREATE POLICY "Public projects are viewable by anyone" ON projects FOR SELECT
        USING (is_public = TRUE);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Members can access brand kits in their workspace') THEN
        CREATE POLICY "Members can access brand kits in their workspace" ON brand_kits FOR ALL
        USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = brand_kits.workspace_id AND user_id = auth.uid()));
    END IF;
END
$$;
