-- ============================================================
-- Migration 004: RLS 安全加固 + pg_cron 激活
-- 前置：migration_001 / 002 / 003 已执行
-- ============================================================

-- ── 1. 修复过于宽松的 INSERT 策略 ──────────────────────────
-- WITH CHECK(true) 等同于允许任意 authenticated 用户直接插入计费记录
-- 改为 WITH CHECK(false)，只有 service_role (admin client) 才能写入

DROP POLICY IF EXISTS "users_insert_service"          ON public.users;
DROP POLICY IF EXISTS "billing_tokens_insert_service" ON public.billing_tokens;
DROP POLICY IF EXISTS "personas_insert_service"       ON public.personas;

CREATE POLICY "users_insert_service"
  ON public.users FOR INSERT WITH CHECK (false);

CREATE POLICY "billing_tokens_insert_service"
  ON public.billing_tokens FOR INSERT WITH CHECK (false);

-- personas 的合法 INSERT 已由 personas_insert_own 覆盖
-- service_role 绕过 RLS，所以 server actions 不受影响

-- ── 2. 激活 pg_cron 每日重置 FREE 配额 ─────────────────────
-- 前提：Supabase Dashboard → Database → Extensions → 启用 pg_cron

SELECT cron.unschedule('reset-free-daily-quota')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'reset-free-daily-quota'
  );

SELECT cron.schedule(
  'reset-free-daily-quota',
  '0 16 * * *',   -- UTC 16:00 = 北京时间 00:00
  $$
    UPDATE public.users
    SET daily_free_text_used = 0, updated_at = now()
    WHERE subscription_tier = 'FREE' AND daily_free_text_used > 0;
  $$
);

-- 验证：SELECT * FROM cron.job WHERE jobname = 'reset-free-daily-quota';
