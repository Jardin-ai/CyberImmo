"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Zap, TrendingDown, TrendingUp, Clock } from "lucide-react";
import PricingTable from "@/components/billing/PricingTable";
import { SUBSCRIPTION_TIERS } from "@/lib/types";

interface BillingToken {
  id: string;
  delta: number;
  balance_after: number;
  event_type: string;
  source_ref: string | null;
  created_at: string;
}

interface BillingClientProps {
  echoBalance: number;
  subscriptionTier: string;
  subscriptionExpiresAt: string | null;
  transactions: BillingToken[];
}

const EVENT_LABELS: Record<string, string> = {
  grant_free:    "初始赠送",
  consume_chat:  "对话消耗",
  manual_adjust: "手动调整",
  recharge:      "充值",
  expire:        "余额过期",
  checkin:       "每日签到",
};

export default function BillingClient({
  echoBalance,
  subscriptionTier,
  subscriptionExpiresAt,
  transactions,
}: BillingClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") === "history" ? "history" : "recharge";
  const [activeTab, setActiveTab] = useState<"recharge" | "history">(initialTab);

  const tierInfo = SUBSCRIPTION_TIERS[subscriptionTier] ?? SUBSCRIPTION_TIERS["FREE"];

  const handleTabChange = (tab: "recharge" | "history") => {
    setActiveTab(tab);
    router.replace(`/billing?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-accent/4 blur-[120px] opacity-40" />

      {/* Header */}
      <header
        className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b px-6 backdrop-blur-md"
        style={{ borderColor: "#2D3139", background: "rgba(24,26,31,0.85)" }}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm transition-colors hover:text-accent"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <ArrowLeft size={16} />
          返回控制台
        </Link>
        <h1
          className="flex-1 text-center font-serif text-lg font-medium"
          style={{ color: "var(--accent-gold)" }}
        >
          账户与充值
        </h1>
        <div className="w-[100px]" />
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Balance card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(212,175,55,0.06)",
            border: "1px solid rgba(212,175,55,0.2)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap size={16} style={{ color: "var(--accent-gold)" }} />
                <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--text-secondary)" }}>
                  回声余额
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tabular-nums" style={{ color: "var(--accent-gold)" }}>
                  {echoBalance.toLocaleString()}
                </span>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>回声</span>
              </div>
            </div>

            <div className="text-right">
              <span
                className="inline-block rounded-full px-4 py-1.5 text-sm font-medium"
                style={{
                  background: `${tierInfo.color}20`,
                  color: tierInfo.color,
                  border: `1px solid ${tierInfo.color}40`,
                }}
              >
                {tierInfo.label}
              </span>
              {subscriptionExpiresAt && (
                <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  到期：{new Date(subscriptionExpiresAt).toLocaleDateString("zh-CN")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex rounded-xl p-1"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #2D3139" }}
        >
          {(["recharge", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className="flex-1 rounded-lg py-2.5 text-sm font-medium transition-all"
              style={
                activeTab === tab
                  ? {
                      background: "rgba(212,175,55,0.12)",
                      color: "var(--accent-gold)",
                      border: "1px solid rgba(212,175,55,0.25)",
                    }
                  : { color: "rgba(255,255,255,0.45)" }
              }
            >
              {tab === "recharge" ? "✦ 套餐订阅" : "📋 消耗记录"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "recharge" && (
          <PricingTable currentTier={subscriptionTier} />
        )}

        {activeTab === "history" && (
          <TransactionHistory transactions={transactions} />
        )}
      </div>
    </div>
  );
}

function TransactionHistory({ transactions }: { transactions: BillingToken[] }) {
  if (transactions.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed"
        style={{ borderColor: "#2D3139" }}
      >
        <Clock size={24} style={{ color: "rgba(255,255,255,0.2)" }} className="mb-3" />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          暂无消耗记录
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const isPositive = tx.delta > 0;
        const label = EVENT_LABELS[tx.event_type] ?? tx.event_type;
        const modelRef = tx.source_ref?.startsWith("model:")
          ? tx.source_ref.replace("model:", "")
          : null;

        return (
          <div
            key={tx.id}
            className="flex items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-white/3"
            style={{ border: "1px solid #2D3139", background: "rgba(255,255,255,0.02)" }}
          >
            {/* Icon */}
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{
                background: isPositive ? "rgba(74,222,128,0.1)" : "rgba(212,175,55,0.08)",
              }}
            >
              {isPositive ? (
                <TrendingUp size={14} style={{ color: "#4ade80" }} />
              ) : (
                <TrendingDown size={14} style={{ color: "var(--accent-gold)" }} />
              )}
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
                {label}
              </p>
              <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                {modelRef ? `使用模型: ${modelRef} · ` : ""}
                余额: {tx.balance_after.toLocaleString()} 回声
              </p>
            </div>

            {/* Delta + time */}
            <div className="text-right shrink-0">
              <p
                className="text-sm font-bold tabular-nums"
                style={{ color: isPositive ? "#4ade80" : "var(--accent-gold)" }}
              >
                {isPositive ? "+" : ""}{tx.delta}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                {new Date(tx.created_at).toLocaleDateString("zh-CN", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
