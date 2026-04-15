-- ============================================================
-- CyberImmo MVP — Initial Schema (4 tables)
-- Run in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. users — 业务用户（id 对齐 auth.users）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email          TEXT,
  phone          TEXT,
  status         TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'suspended', 'churned')),
  token_balance  INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.users IS '业务用户档案，id 与 auth.users 对齐';
COMMENT ON COLUMN public.users.token_balance IS '读优化字段，真相来源为 billing_tokens ledger';

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 用户只能读自己的行
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- 用户只能改自己的行
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Service role 可以插入（server action 使用）
CREATE POLICY "users_insert_service"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 2. personas — 逝者人设
-- ============================================================
CREATE TABLE IF NOT EXISTS public.personas (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  display_name         TEXT NOT NULL,
  relationship_label   TEXT NOT NULL,
  speaking_style       TEXT,
  opening_message      TEXT,
  system_prompt        TEXT NOT NULL,
  questionnaire_data   JSONB,
  language             TEXT NOT NULL DEFAULT 'zh-CN',
  status               TEXT NOT NULL DEFAULT 'active'
                       CHECK (status IN ('draft', 'active', 'archived')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.personas IS '逝者人设，包含 system_prompt 和原始问卷数据';
COMMENT ON COLUMN public.personas.questionnaire_data IS '完整问卷 JSON，便于日后重新生成 system_prompt';

ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personas_select_own"
  ON public.personas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "personas_insert_own"
  ON public.personas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "personas_update_own"
  ON public.personas FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role 也需要插入（onboarding server action）
CREATE POLICY "personas_insert_service"
  ON public.personas FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_personas_user_id
  ON public.personas(user_id);

-- ============================================================
-- 3. chat_logs — 对话记录
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id   UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id   UUID NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content      TEXT NOT NULL,
  token_cost   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.chat_logs IS '全量对话记录，MVP 使用 Sliding Window 读取最近 20 条';

ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_logs_select_own"
  ON public.chat_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "chat_logs_insert_service"
  ON public.chat_logs FOR INSERT
  WITH CHECK (true);

-- 核心查询索引：按 persona + session + 时间倒序
CREATE INDEX idx_chat_logs_session
  ON public.chat_logs(persona_id, session_id, created_at DESC);

-- ============================================================
-- 4. billing_tokens — 计费账本
-- ============================================================
CREATE TABLE IF NOT EXISTS public.billing_tokens (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  persona_id     UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  delta          INT NOT NULL,
  balance_after  INT NOT NULL,
  event_type     TEXT NOT NULL
                 CHECK (event_type IN ('grant_free', 'consume_chat', 'manual_adjust', 'recharge', 'expire')),
  source_ref     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.billing_tokens IS '计费账本，可审计所有 token 变动';

ALTER TABLE public.billing_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billing_tokens_select_own"
  ON public.billing_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "billing_tokens_insert_service"
  ON public.billing_tokens FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_billing_user_created
  ON public.billing_tokens(user_id, created_at DESC);
