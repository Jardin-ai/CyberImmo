-- ============================================================
-- CyberImmo MVP — Billing & Subscription Schema
-- migration_003_billing.sql
-- 运行顺序：必须在 migration_001 和 migration_002 之后执行
-- ============================================================

-- ── 1. 扩展 public.users 表 ──────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS subscription_tier      VARCHAR(20)  NOT NULL DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS echo_balance            INT          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS daily_free_text_used    INT          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_checkin_date       DATE;

-- 将旧 token_balance 迁移至 echo_balance（保留 token_balance 不删除）
UPDATE public.users
SET echo_balance = token_balance
WHERE token_balance > 0 AND echo_balance = 0;

-- ── 2. 扩展 billing_tokens event_type 枚举（加入 checkin）────
ALTER TABLE public.billing_tokens
  DROP CONSTRAINT IF EXISTS billing_tokens_event_type_check;

ALTER TABLE public.billing_tokens
  ADD CONSTRAINT billing_tokens_event_type_check
  CHECK (event_type IN (
    'grant_free', 'consume_chat', 'manual_adjust',
    'recharge', 'expire', 'checkin'
  ));

-- ── 3. apply_billing_delta RPC（原子扣/加 echo_balance）──────
-- 供 api/chat/route.ts 调用，后流式落库使用
CREATE OR REPLACE FUNCTION public.apply_billing_delta(
  p_user_id    UUID,
  p_persona_id UUID,
  p_delta      INT,        -- 负数 = 扣费，正数 = 充值
  p_event_type TEXT,
  p_source_ref TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before INT;
  v_after  INT;
BEGIN
  -- 行锁防并发超扣
  SELECT echo_balance INTO v_before
  FROM public.users WHERE id = p_user_id FOR UPDATE;

  v_after := v_before + p_delta;

  IF v_after < 0 THEN
    RAISE EXCEPTION 'InsufficientBalance: balance=% delta=%', v_before, p_delta;
  END IF;

  UPDATE public.users
  SET echo_balance = v_after,
      updated_at   = now()
  WHERE id = p_user_id;

  -- 同步写账本
  INSERT INTO public.billing_tokens
    (user_id, persona_id, delta, balance_after, event_type, source_ref)
  VALUES
    (p_user_id, p_persona_id, p_delta, v_after, p_event_type, p_source_ref);
END;
$$;

-- ── 4. daily_checkin RPC（每日签到 +20 回声）─────────────────
CREATE OR REPLACE FUNCTION public.daily_checkin(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today        DATE := CURRENT_DATE;
  v_last_checkin DATE;
  v_before       INT;
  v_after        INT;
BEGIN
  SELECT last_checkin_date, echo_balance
  INTO v_last_checkin, v_before
  FROM public.users WHERE id = p_user_id FOR UPDATE;

  -- 已签到则拒绝
  IF v_last_checkin = v_today THEN
    RETURN jsonb_build_object('success', false, 'message', 'already_checked_in');
  END IF;

  v_after := v_before + 20;

  UPDATE public.users
  SET echo_balance       = v_after,
      last_checkin_date  = v_today,
      updated_at         = now()
  WHERE id = p_user_id;

  -- 写账本
  INSERT INTO public.billing_tokens
    (user_id, persona_id, delta, balance_after, event_type, source_ref)
  VALUES
    (p_user_id, NULL, 20, v_after, 'checkin', '每日精神碎片签到');

  RETURN jsonb_build_object('success', true, 'balance', v_after);
END;
$$;

-- ── 5. increment_daily_text_used（FREE 用户每轮自增）─────────
CREATE OR REPLACE FUNCTION public.increment_daily_text_used(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET daily_free_text_used = daily_free_text_used + 1,
      updated_at           = now()
  WHERE id = p_user_id
    AND subscription_tier = 'FREE';
END;
$$;

-- ── 6. grant_subscription_echoes（订阅成功回调用）────────────
-- 供未来 Stripe Webhook handler 调用
CREATE OR REPLACE FUNCTION public.grant_subscription_echoes(
  p_user_id    UUID,
  p_tier       VARCHAR(20),
  p_echoes     INT,
  p_expires_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before INT;
  v_after  INT;
BEGIN
  SELECT echo_balance INTO v_before
  FROM public.users WHERE id = p_user_id FOR UPDATE;

  v_after := v_before + p_echoes;

  UPDATE public.users
  SET echo_balance            = v_after,
      subscription_tier       = p_tier,
      subscription_expires_at = p_expires_at,
      updated_at              = now()
  WHERE id = p_user_id;

  INSERT INTO public.billing_tokens
    (user_id, persona_id, delta, balance_after, event_type, source_ref)
  VALUES
    (p_user_id, NULL, p_echoes, v_after, 'recharge', '订阅充值: ' || p_tier);

  RETURN jsonb_build_object('success', true, 'balance', v_after, 'tier', p_tier);
END;
$$;

-- ── 7. pg_cron：北京时间 00:00 重置免费用户每日计数 ──────────
-- 如果 Supabase 项目启用了 pg_cron 扩展，取消注释后执行：
--
-- SELECT cron.schedule(
--   'reset-free-daily-quota',
--   '0 16 * * *',   -- UTC 16:00 = 北京时间 00:00
--   $$UPDATE public.users
--     SET daily_free_text_used = 0
--     WHERE subscription_tier = 'FREE'$$
-- );
