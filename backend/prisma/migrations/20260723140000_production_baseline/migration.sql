-- Production baseline generated from the reviewed Prisma schema.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT 'client', "tier" TEXT DEFAULT 'Regular',
  "status" TEXT NOT NULL DEFAULT 'pending', "portfolio_code" TEXT UNIQUE, "phone" TEXT,
  "kyc_status" TEXT DEFAULT 'pending', "password_hash" TEXT, "profile_data" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "portfolios" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL DEFAULT 'المحفظة الرئيسية', "name_en" TEXT,
  "total_valuation" DECIMAL(18,2) NOT NULL DEFAULT 0, "risk_profile" TEXT NOT NULL DEFAULT 'balanced',
  "currency" TEXT NOT NULL DEFAULT 'SAR', "growth_percent" DECIMAL(5,2) DEFAULT 0,
  "inception_date" DATE DEFAULT CURRENT_DATE, "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "portfolio_data" JSONB, "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "transactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "portfolio_id" UUID REFERENCES "portfolios"("id") ON DELETE SET NULL, "type" TEXT NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL CHECK ("amount" > 0), "currency" TEXT NOT NULL DEFAULT 'SAR',
  "method" TEXT, "status" TEXT NOT NULL DEFAULT 'pending', "reference_code" TEXT UNIQUE, "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "assets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "portfolio_id" UUID NOT NULL REFERENCES "portfolios"("id") ON DELETE CASCADE,
  "symbol" TEXT NOT NULL, "name" TEXT NOT NULL, "name_en" TEXT, "asset_class" TEXT NOT NULL,
  "weight_percent" DECIMAL(5,2) NOT NULL DEFAULT 0, "quantity" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "avg_price" DECIMAL(18,6) NOT NULL DEFAULT 0, "valuation" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "annual_yield" DECIMAL(5,2) DEFAULT 0, "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "support_tickets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "assigned_to" UUID REFERENCES "users"("id") ON DELETE SET NULL, "title" TEXT NOT NULL, "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending', "priority" TEXT NOT NULL DEFAULT 'medium', "reply" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL, "title_en" TEXT, "message" TEXT NOT NULL, "message_en" TEXT,
  "type" TEXT NOT NULL DEFAULT 'info', "is_read" BOOLEAN NOT NULL DEFAULT FALSE, "action_url" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "content_sections" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "section_key" TEXT NOT NULL UNIQUE,
  "title_ar" TEXT, "title_en" TEXT, "content_ar" TEXT, "content_en" TEXT, "content_data" JSONB,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE, "order_index" INTEGER DEFAULT 0,
  "updated_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "site_settings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "key" TEXT NOT NULL UNIQUE, "value" JSONB, "description" TEXT,
  "updated_by" UUID REFERENCES "users"("id") ON DELETE SET NULL, "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "sub_admins" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL, "email" TEXT NOT NULL UNIQUE, "phone" TEXT, "permissions" JSONB,
  "status" TEXT NOT NULL DEFAULT 'active', "last_active_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "meetings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "advisor_id" UUID REFERENCES "users"("id") ON DELETE SET NULL, "advisor_name" TEXT NOT NULL,
  "meeting_date" DATE NOT NULL, "meeting_time" TEXT NOT NULL, "duration_minutes" INTEGER NOT NULL DEFAULT 60,
  "type" TEXT NOT NULL DEFAULT 'consultation', "status" TEXT NOT NULL DEFAULT 'confirmed', "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "actor_email" TEXT NOT NULL, "action" TEXT NOT NULL, "action_en" TEXT, "resource_type" TEXT, "resource_id" TEXT,
  "details" JSONB, "ip_address" INET, "user_agent" TEXT, "result" TEXT NOT NULL DEFAULT 'success',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "login_attempts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "email" TEXT NOT NULL, "ip_address" INET, "user_agent" TEXT,
  "result" TEXT NOT NULL, "failure_reason" TEXT, "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "refresh_sessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" TEXT NOT NULL UNIQUE, "expires_at" TIMESTAMPTZ NOT NULL, "revoked_at" TIMESTAMPTZ,
  "ip_address" INET, "user_agent" TEXT, "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "ticket_messages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "ticket_id" UUID NOT NULL REFERENCES "support_tickets"("id") ON DELETE CASCADE,
  "sender_id" UUID REFERENCES "users"("id") ON DELETE SET NULL, "sender_role" TEXT NOT NULL, "message" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "notification_receipts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "notification_id" UUID NOT NULL REFERENCES "notifications"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE, "read_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE("notification_id", "user_id")
);
CREATE TABLE IF NOT EXISTS "platform_data" (
  "key" TEXT PRIMARY KEY, "value" JSONB NOT NULL, "updated_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");
CREATE INDEX IF NOT EXISTS "idx_users_status" ON "users"("status");
CREATE INDEX IF NOT EXISTS "idx_portfolios_user_id" ON "portfolios"("user_id");
CREATE INDEX IF NOT EXISTS "idx_transactions_user_created" ON "transactions"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_transactions_status_created" ON "transactions"("status", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_assets_portfolio_id" ON "assets"("portfolio_id");
CREATE INDEX IF NOT EXISTS "idx_tickets_user_status" ON "support_tickets"("user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_notifications_user_created" ON "notifications"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_audit_created" ON "audit_logs"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_login_email_created" ON "login_attempts"("email", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_sessions_user_expiry" ON "refresh_sessions"("user_id", "expires_at");
CREATE INDEX IF NOT EXISTS "idx_ticket_messages_ticket_date" ON "ticket_messages"("ticket_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_receipts_user_read_date" ON "notification_receipts"("user_id", "read_at", "created_at");
