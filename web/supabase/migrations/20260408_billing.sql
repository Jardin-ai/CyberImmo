-- migration_003_billing.sql
-- CyberImmo 商业化架构与计费系统实现蓝图

-- 1. 扩展 public.users 表
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR DEFAULT 'FREE';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS echo_balance INT DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS daily_free_text_used INT DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_checkin_date DATE DEFAULT NULL;

-- 2. 创建计费日志表
CREATE TABLE IF NOT EXISTS public.billing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
    delta INT NOT NULL,
    balance_after INT NOT NULL,
    event_type VARCHAR NOT NULL, -- 'grant_free', 'consume_chat', 'manual_adjust', 'recharge', 'expire'
    source_ref VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 创建原子扣费函数 (RPC)
CREATE OR REPLACE FUNCTION process_echo_transaction(
    p_user_id UUID,
    p_action_type VARCHAR, -- 'TEXT', 'IMAGE', 'VOICE'
    p_cost INT,
    p_persona_id UUID DEFAULT NULL,
    p_source_ref VARCHAR DEFAULT NULL
) 
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER -- 以定义者权限运行，允许外部调用
AS $$
DECLARE
    v_current_balance INT;
    v_tier VARCHAR;
BEGIN
    -- 获取用户信息
    SELECT echo_balance, subscription_tier INTO v_current_balance, v_tier
    FROM public.users
    WHERE id = p_user_id
    FOR UPDATE; -- 锁定行以确保原子性

    IF NOT FOUND THEN
        RAISE EXCEPTION '用户未找到';
    END IF;

    -- 逻辑处理：如果是文本并且不是免费用户，直接返回 TRUE (免扣费)
    IF p_action_type = 'TEXT' AND v_tier != 'FREE' THEN
        RETURN TRUE;
    END IF;

    -- 余额检查
    IF v_current_balance < p_cost THEN
        RAISE EXCEPTION '余额不足，当前回声: %, 需要: %', v_current_balance, p_cost;
    END IF;

    -- 执行扣费
    UPDATE public.users 
    SET echo_balance = echo_balance - p_cost 
    WHERE id = p_user_id;

    -- 写入日志
    INSERT INTO public.billing_logs (user_id, persona_id, delta, balance_after, event_type, source_ref)
    VALUES (p_user_id, p_persona_id, -p_cost, v_current_balance - p_cost, 'consume_chat', p_source_ref);

    RETURN TRUE;
END;
$$;

-- 4. 创建签到函数 (daily_checkin)
CREATE OR REPLACE FUNCTION daily_checkin(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_last_checkin DATE;
    v_new_balance INT;
BEGIN
    SELECT last_checkin_date INTO v_last_checkin FROM public.users WHERE id = p_user_id FOR UPDATE;
    
    IF v_last_checkin IS NOT NULL AND v_last_checkin = v_today THEN
        RETURN jsonb_build_object('success', false, 'message', '今天已经领过波长碎片了');
    END IF;
    
    UPDATE public.users 
    SET echo_balance = echo_balance + 20,
        last_checkin_date = v_today
    WHERE id = p_user_id
    RETURNING echo_balance INTO v_new_balance;
    
    -- 记录日志
    INSERT INTO public.billing_logs (user_id, delta, balance_after, event_type, source_ref)
    VALUES (p_user_id, 20, v_new_balance, 'grant_free', 'daily_checkin');
    
    RETURN jsonb_build_object('success', true, 'balance', v_new_balance, 'message', '成功收集 20 枚回声碎片');
END;
$$;

-- 5. 开启 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
