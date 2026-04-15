"use client";

import { dailyCheckinAction } from "@/app/billing/actions";
import { createClient } from "@/lib/supabase/client";
import { SUBSCRIPTION_TIERS } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  CreditCard,
  Download,
  Receipt,
  Settings,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { getPath } from "@/lib/public-base-path";
import { useEffect, useState, useTransition } from "react";

interface MainSidebarProps {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  initialBalance: number;
  subscriptionTier: string;
  dailyFreeTextUsed: number;
  lastCheckinDate: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function MainSidebar({
  userId,
  displayName,
  avatarUrl,
  initialBalance,
  subscriptionTier,
  dailyFreeTextUsed: initialDailyUsed,
  lastCheckinDate: initialLastCheckin,
  isOpen,
  onClose,
}: MainSidebarProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [tier, setTier] = useState(subscriptionTier);
  const [dailyUsed, setDailyUsed] = useState(initialDailyUsed);
  const [lastCheckin, setLastCheckin] = useState(initialLastCheckin);
  const [checkinDone, setCheckinDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isFreeTier = tier === "FREE";
  const today = getTodayISO();
  const canCheckin = !checkinDone && lastCheckin !== today;
  const freeRemaining = Math.max(0, 5 - dailyUsed);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`user-billing-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const u = payload.new as {
            echo_balance?: number;
            subscription_tier?: string;
            daily_free_text_used?: number;
            last_checkin_date?: string | null;
          };
          if (typeof u.echo_balance === "number") setBalance(u.echo_balance);
          if (typeof u.subscription_tier === "string")
            setTier(u.subscription_tier);
          if (typeof u.daily_free_text_used === "number")
            setDailyUsed(u.daily_free_text_used);
          if ("last_checkin_date" in u)
            setLastCheckin(u.last_checkin_date ?? null);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleCheckin = () => {
    startTransition(async () => {
      const result = await dailyCheckinAction();
      if (result.success && typeof result.balance === "number") {
        setBalance(result.balance);
        setLastCheckin(today);
        setCheckinDone(true);
      }
    });
  };

  const sidebarContent = (
    <div
      className="flex h-full w-64 flex-col"
      style={{
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div
        className="flex h-14 shrink-0 items-center justify-between px-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span
          className="text-xs font-medium tracking-widest uppercase"
          style={{ color: "var(--text-secondary)" }}
        >
          控制面板
        </span>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* User */}
        <Link href={getPath("/settings")} onClick={onClose}>
          <div className="group flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-white/4">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border overflow-hidden"
              style={{
                borderColor: "rgba(212,160,23,0.2)",
                background: "rgba(212,160,23,0.07)",
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName ?? "U"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="font-serif italic text-sm"
                  style={{ color: "var(--accent-gold)" }}
                >
                  {displayName ? displayName[0] : "U"}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {displayName ?? "我的账户"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                点击进入设置
              </p>
            </div>
            <Settings
              size={13}
              className="shrink-0"
              style={{ color: "rgba(255,255,255,0.25)" }}
            />
          </div>
        </Link>

        <div className="h-px my-2" style={{ background: "var(--border)" }} />

        <div
          className="rounded-xl p-3"
          style={{
            background: "rgba(212,160,23,0.05)",
            border: "1px solid rgba(212,160,23,0.12)",
          }}
        >
          {/* Subscription Tier Indicator */}
          <div className="mb-3 flex items-center justify-between">
            <span
              className="text-[10px] font-bold tracking-widest uppercase opacity-40"
              style={{ color: "var(--text-secondary)" }}
            >
              当前方案
            </span>
            <span
              className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
              style={{
                background: `${SUBSCRIPTION_TIERS[tier]?.color || "#D4A017"}22`,
                color: SUBSCRIPTION_TIERS[tier]?.color || "var(--accent-gold)",
                border: `1px solid ${SUBSCRIPTION_TIERS[tier]?.color || "#D4A017"}44`,
              }}
            >
              {SUBSCRIPTION_TIERS[tier]?.label || "未知方案"}
            </span>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={12} style={{ color: "var(--accent-gold)" }} />
              <span
                className="text-[11px] font-medium tracking-widest uppercase"
                style={{ color: "var(--text-secondary)" }}
              >
                回声余额
              </span>
            </div>
            <Link href={getPath("/billing?tab=recharge")} onClick={onClose}>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-70 cursor-pointer"
                style={{
                  background: "rgba(212,160,23,0.12)",
                  color: "var(--accent-gold)",
                  border: "1px solid rgba(212,160,23,0.2)",
                }}
              >
                充值
              </span>
            </Link>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: "var(--accent-gold)" }}
            >
              {(balance ?? 0).toLocaleString()}
            </span>
            <span
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              回声
            </span>
          </div>

          {/* FREE tier FUP bar */}
          {isFreeTier && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-[10px]"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  剩余免费对话次数
                </span>
                <span
                  className="text-[10px] font-medium tabular-nums"
                  style={{
                    color:
                      freeRemaining === 0 ? "#EF4444" : "var(--accent-gold)",
                  }}
                >
                  {freeRemaining}/5
                </span>
              </div>
              <div
                className="h-1 w-full overflow-hidden rounded-full"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(freeRemaining / 5) * 100}%`,
                    background:
                      freeRemaining === 0
                        ? "#EF4444"
                        : freeRemaining <= 2
                          ? "#F59E0B"
                          : "var(--accent-gold)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Low balance nudge */}
          {!isFreeTier && balance <= 100 && (
            <Link href={getPath("/billing?tab=recharge")} onClick={onClose}>
              <p
                className="mt-2 text-[11px] text-center transition-opacity hover:opacity-70"
                style={{ color: "var(--accent-gold)" }}
              >
                余额不足 — 立即充值
              </p>
            </Link>
          )}

          {/* Checkin */}
          {canCheckin && (
            <button
              onClick={handleCheckin}
              disabled={isPending}
              className="mt-2 w-full text-[11px] text-center transition-opacity hover:opacity-70 disabled:opacity-40"
              style={{ color: "var(--text-secondary)" }}
            >
              {isPending ? "连接中…" : "✧ 签到 (+20 回声)"}
            </button>
          )}
          {checkinDone && (
            <p
              className="mt-2 text-[11px] text-center"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              ✓ 今日已签到
            </p>
          )}
        </div>

        <div className="h-px my-2" style={{ background: "var(--border)" }} />

        {/* Account management */}
        <div className="space-y-0.5">
          <p
            className="px-3 py-1 text-[11px] font-medium tracking-widest uppercase"
            style={{ color: "var(--text-secondary)" }}
          >
            账户管理
          </p>
          <Link href={getPath("/billing?tab=history")} onClick={onClose}>
            <button
              className="flex w-full items-center gap-3 rounded-xl p-3 text-sm transition-colors hover:bg-white/4"
              style={{ color: "var(--text-secondary)" }}
            >
              <Receipt size={13} />
              <span>消耗记录</span>
            </button>
          </Link>
          <Link href={getPath("/billing?tab=recharge")} onClick={onClose}>
            <button
              className="flex w-full items-center gap-3 rounded-xl p-3 text-sm transition-colors hover:bg-white/4"
              style={{ color: "var(--text-secondary)" }}
            >
              <CreditCard size={13} />
              <span>套餐订阅</span>
            </button>
          </Link>
        </div>

        <div className="h-px my-2" style={{ background: "var(--border)" }} />

        {/* Data actions */}
        <div className="space-y-0.5">
          <p
            className="px-3 py-1 text-[11px] font-medium tracking-widest uppercase"
            style={{ color: "var(--text-secondary)" }}
          >
            数据操作
          </p>
          <button
            className="flex w-full items-center gap-3 rounded-xl p-3 text-sm transition-colors hover:bg-white/4"
            style={{ color: "var(--text-secondary)" }}
            onClick={async () => {
              const res = await fetch("/api/export-chat");
              if (!res.ok) { alert("导出失败，请稍后再试"); return; }
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `cyberimmo-${new Date().toISOString().split("T")[0]}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={13} />
            <span>导出对话记录</span>
          </button>
          <button
            className="flex w-full items-center gap-3 rounded-xl p-3 text-sm transition-colors hover:bg-white/4"
            style={{ color: "var(--text-secondary)" }}
          >
            <Shield size={13} />
            <span>隐私保护设置</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
        <p
          className="text-center text-[10px]"
          style={{ color: "rgba(255,255,255,0.15)" }}
        >
          CyberImmo · 数字记忆空间
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <motion.div
        className="hidden md:block h-dvh shrink-0 sticky top-0 overflow-hidden"
        initial={false}
        animate={{ width: isOpen ? 256 : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
      >
        <div className="w-64 h-full">{sidebarContent}</div>
      </motion.div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="mobile-backdrop"
              className="fixed inset-0 z-30 md:hidden"
              style={{ background: "rgba(0,0,0,0.6)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              key="mobile-sidebar"
              className="fixed left-0 top-0 bottom-0 z-40 md:hidden"
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
