"use client";

import { useState } from "react";
import { Check, Zap } from "lucide-react";

/* ── plan data ─────────────────────────────────────────────── */
interface Plan {
  id: string;
  name: string;
  nameSub: string;
  price: string;
  period: string;
  echoes: string;
  highlight?: boolean;
  features: string[];
}

const MONTHLY_PLANS: Plan[] = [
  {
    id: "FREE",
    name: "寄托体验",
    nameSub: "Remembrance Trial",
    price: "¥0",
    period: "永久",
    echoes: "20 回声/签到",
    features: [
      "DeepSeek 文字对话（每日 5 次）",
      "每日签到获取 20 回声",
      "基础档案建立（最多 1 个）",
      "对话记录本地保存",
    ],
  },
  {
    id: "MONTHLY_BASIC",
    name: "灵犀通讯",
    nameSub: "Telepathy Link",
    price: "¥29.9",
    period: "/月",
    echoes: "6,000 回声/月",
    highlight: true,
    features: [
      "文字对话无限制，零扣费",
      "每月注入 6,000 回声",
      "图片理解 50 回声/张",
      "语音合成 100 回声/条",
      "档案数量无上限",
    ],
  },
  {
    id: "MONTHLY_PRO",
    name: "深度共鸣",
    nameSub: "Resonance Plus",
    price: "¥49.9",
    period: "/月",
    echoes: "15,000 回声/月",
    features: [
      "文字对话无限制，零扣费",
      "每月注入 15,000 回声",
      "高并发优先处理队列",
      "图片 + 语音全功能",
      "档案数量无上限",
    ],
  },
];

const ANNUAL_PLANS: Plan[] = [
  {
    id: "FREE",
    name: "寄托体验",
    nameSub: "Remembrance Trial",
    price: "¥0",
    period: "永久",
    echoes: "20 回声/签到",
    features: [
      "DeepSeek 文字对话（每日 5 次）",
      "每日签到获取 20 回声",
      "基础档案建立（最多 1 个）",
      "对话记录本地保存",
    ],
  },
  {
    id: "ANNUAL_BASIC",
    name: "岁月长卷",
    nameSub: "Chronicle Annual",
    price: "¥268",
    period: "/年",
    echoes: "8,000 回声/月",
    highlight: true,
    features: [
      "文字对话无限制，零扣费",
      "每月注入 8,000 回声",
      "相当于 ¥22.3/月，省 25%",
      "图片 + 语音全功能",
      "全年稳定连接保障",
    ],
  },
  {
    id: "5YEAR_ULTRA",
    name: "时空契约",
    nameSub: "Spacetime Covenant",
    price: "¥999",
    period: "/5年",
    echoes: "20,000 回声/月",
    features: [
      "文字对话无限制，零扣费",
      "每月注入 20,000 回声",
      "相当于 ¥16.6/月，省 44%",
      "专属 UI 皮肤解锁",
      "五年优先体验资格",
    ],
  },
];

/* ── component ─────────────────────────────────────────────── */
interface PricingTableProps {
  currentTier?: string;
}

export default function PricingTable({ currentTier = "FREE" }: PricingTableProps) {
  const [annual, setAnnual] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const plans = annual ? ANNUAL_PLANS : MONTHLY_PLANS;

  const handlePurchase = (planId: string) => {
    if (planId === "FREE" || planId === currentTier) return;
    setToast("支付功能开发中，敬请期待 ✧");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 rounded-full px-6 py-3 text-sm"
          style={{
            background: "rgba(212,160,23,0.12)",
            border: "1px solid rgba(212,160,23,0.35)",
            color: "var(--accent-gold)",
            backdropFilter: "blur(14px)",
          }}
        >
          {toast}
        </div>
      )}

      {/* Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span
          className="text-sm"
          style={{ color: !annual ? "var(--text-primary)" : "var(--text-secondary)" }}
        >
          按月付费
        </span>
        <button
          onClick={() => setAnnual((v) => !v)}
          className="relative h-6 w-11 rounded-full transition-colors"
          style={{
            background: annual ? "rgba(212,160,23,0.35)" : "rgba(255,255,255,0.1)",
            border: "1px solid rgba(212,160,23,0.25)",
          }}
          aria-label="切换年付"
        >
          <div
            className="absolute top-0.5 h-5 w-5 rounded-full transition-all"
            style={{
              background: "var(--accent-gold)",
              left: annual ? "calc(100% - 1.375rem)" : "0.125rem",
              boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
            }}
          />
        </button>
        <span
          className="text-sm flex items-center gap-1.5"
          style={{ color: annual ? "var(--text-primary)" : "var(--text-secondary)" }}
        >
          年付/长约
          {annual && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: "rgba(212,160,23,0.15)", color: "var(--accent-gold)" }}
            >
              更省钱
            </span>
          )}
        </span>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={currentTier === plan.id}
            onPurchase={handlePurchase}
          />
        ))}
      </div>

      <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
        所有套餐均包含已建立记忆档案的永久保留。到期后自动降级为免费档，数据不丢失。
      </p>
    </div>
  );
}

/* ── plan card ─────────────────────────────────────────────── */
function PlanCard({
  plan,
  isCurrent,
  onPurchase,
}: {
  plan: Plan;
  isCurrent: boolean;
  onPurchase: (id: string) => void;
}) {
  const gold = "var(--accent-gold)";
  const goldAlpha = (a: number) => `rgba(212,160,23,${a})`;

  return (
    <div
      className="relative flex flex-col rounded-2xl p-5 transition-all"
      style={
        plan.highlight
          ? {
              background: `linear-gradient(160deg, ${goldAlpha(0.07)} 0%, ${goldAlpha(0.03)} 100%)`,
              border: `1px solid ${goldAlpha(0.45)}`,
              boxShadow: `0 0 28px ${goldAlpha(0.1)}, inset 0 1px 0 ${goldAlpha(0.15)}`,
              transform: "scale(1.03)",
            }
          : {
              background: "rgba(255,255,255,0.025)",
              border: isCurrent
                ? `1px solid ${goldAlpha(0.3)}`
                : "1px solid rgba(255,255,255,0.07)",
            }
      }
    >
      {/* Current badge */}
      {isCurrent && (
        <div
          className="mb-3 inline-flex w-fit items-center gap-1 rounded-full px-3 py-0.5 text-[10px] font-medium"
          style={{ background: goldAlpha(0.12), color: gold }}
        >
          <Check size={9} /> 当前套餐
        </div>
      )}

      {/* Highlight label */}
      {plan.highlight && !isCurrent && (
        <div
          className="mb-3 inline-flex w-fit items-center gap-1 rounded-full px-3 py-0.5 text-[10px] font-medium"
          style={{ background: goldAlpha(0.15), color: gold }}
        >
          ✦ 最受缅怀者选择
        </div>
      )}

      {/* Name */}
      <h3 className="text-lg font-bold mb-0.5" style={{ color: plan.highlight ? gold : "var(--text-primary)" }}>
        {plan.name}
      </h3>
      <p className="text-[11px] tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
        {plan.nameSub}
      </p>

      {/* Price */}
      <div className="flex items-baseline gap-1 mb-3">
        <span
          className="text-3xl font-bold tabular-nums"
          style={{ color: plan.highlight ? gold : "var(--text-primary)" }}
        >
          {plan.price}
        </span>
        <span className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          {plan.period}
        </span>
      </div>

      {/* Echo pill */}
      <div
        className="mb-4 flex items-center gap-1.5 rounded-lg px-3 py-2"
        style={{
          background: goldAlpha(0.06),
          border: `1px solid ${goldAlpha(0.1)}`,
        }}
      >
        <Zap size={11} style={{ color: gold }} />
        <span className="text-xs font-medium" style={{ color: gold }}>
          {plan.echoes}
        </span>
      </div>

      {/* Features */}
      <ul className="mb-5 flex-1 space-y-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
            <Check
              size={11}
              className="mt-0.5 shrink-0"
              style={{ color: plan.highlight ? gold : "rgba(255,255,255,0.3)" }}
            />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={() => onPurchase(plan.id)}
        disabled={isCurrent || plan.id === "FREE"}
        className="w-full rounded-xl py-2.5 text-sm font-medium transition-all"
        style={
          isCurrent
            ? { background: goldAlpha(0.1), color: gold, cursor: "default" }
            : plan.id === "FREE"
            ? { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.25)", cursor: "default" }
            : plan.highlight
            ? {
                background: gold,
                color: "#0D0E12",
                boxShadow: `0 4px 16px ${goldAlpha(0.35)}`,
              }
            : {
                background: goldAlpha(0.1),
                border: `1px solid ${goldAlpha(0.3)}`,
                color: gold,
              }
        }
      >
        {isCurrent ? "当前套餐" : plan.id === "FREE" ? "基础免费" : "立即开通"}
      </button>
    </div>
  );
}
