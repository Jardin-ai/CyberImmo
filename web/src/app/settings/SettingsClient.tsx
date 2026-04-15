"use client";

import { useForm } from "react-hook-form";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile, deleteAccount } from "./actions";
import { Camera, AlertTriangle, Lock, Zap, LogOut } from "lucide-react";
import Link from "next/link";
import { getPath } from "@/lib/public-base-path";
import { useRouter } from "next/navigation";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { User as DbUser } from "@/lib/types";

interface FormData {
  displayName: string;
  avatarUrl: string;
}

const RECHARGE_OPTIONS = [
  {
    id: "standard",
    label: "标准充值",
    rate: "1 元 = 100 回声",
    rateNum: 100,
    memberOnly: false,
    description: "所有用户均可使用",
  },
  {
    id: "member",
    label: "会员专享",
    rate: "1 元 = 200 回声",
    rateNum: 200,
    memberOnly: true,
    description: "订阅会员后解锁翻倍汇率",
  },
];

export default function SettingsClient({
  user,
  profile,
}: {
  user: SupabaseUser;
  profile: DbUser;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedRecharge, setSelectedRecharge] = useState<string | null>(null);
  const [rechargeToast, setRechargeToast] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: {
      displayName: profile?.display_name || "",
      avatarUrl: profile?.avatar_url || "",
    },
  });

  const avatarUrl = watch("avatarUrl");
  const supabase = createClient();
  const isFreeTier = !profile?.subscription_tier || profile.subscription_tier === "FREE";
  const echoBalance = profile?.echo_balance ?? 0;

  /* ── avatar upload ── */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("图片大小不能超过 2MB"); return; }

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
    if (error) { alert("上传头像失败: " + error.message); setUploading(false); return; }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(data.path);
    setValue("avatarUrl", publicUrlData.publicUrl);
    setUploading(false);
  };

  /* ── save profile ── */
  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const result = await updateProfile(data);
    setSaving(false);
    if (result.error) { alert(result.error); } else { alert("资料已保存"); router.refresh(); }
  };

  /* ── recharge ── */
  const handleRechargeClick = (optionId: string, memberOnly: boolean) => {
    if (memberOnly && isFreeTier) {
      setRechargeToast("此充值方式仅限会员使用，请先开通套餐");
      setTimeout(() => setRechargeToast(null), 3500);
      return;
    }
    setSelectedRecharge(optionId === selectedRecharge ? null : optionId);
    setRechargeToast("支付功能开发中，敬请期待 ✧");
    setTimeout(() => setRechargeToast(null), 3000);
  };

  /* ── sign out ── */
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(getPath("/auth/login"));
    router.refresh();
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteAccount();
    if (result.error) { alert(result.error); setDeleting(false); } else { router.push(getPath("/auth/login")); }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {rechargeToast && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 rounded-full px-6 py-3 text-sm"
          style={{
            background: "rgba(212,160,23,0.12)",
            border: "1px solid rgba(212,160,23,0.35)",
            color: "var(--accent-gold)",
            backdropFilter: "blur(14px)",
          }}
        >
          {rechargeToast}
        </div>
      )}

      {/* 个人资料 */}
      <section
        className="rounded-2xl p-6"
        style={{ border: "1px solid rgba(212,160,23,0.15)", background: "rgba(255,255,255,0.02)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>
            个人资料
          </h2>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs transition-colors hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
          >
            <LogOut size={14} />
            退出登录
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Avatar — top */}
          <div className="flex items-center gap-5">
            <div
              className="group relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full transition-all"
              style={{ border: "1px solid rgba(212,160,23,0.25)", background: "rgba(212,160,23,0.06)" }}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              {avatarUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </>
              ) : (
                <Camera className="h-5 w-5" style={{ color: "rgba(255,255,255,0.3)" }} />
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              )}
            </div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>点击上传头像</p>
              <p className="text-xs opacity-60">JPG / PNG，最大 2 MB</p>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          {/* Account — read-only plain text */}
          <div className="space-y-1">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>账号</p>
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
              {user.email || user.phone || "未知"}
            </p>
          </div>

          {/* Display name */}
          <div className="space-y-1">
            <label className="block text-sm" style={{ color: "var(--text-secondary)" }}>用户名</label>
            <input
              type="text"
              {...register("displayName")}
              placeholder="请输入您的称呼"
              className="max-w-md w-full rounded-lg px-4 py-2 text-sm outline-none transition-colors"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(212,160,23,0.4)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
          </div>

          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded-full px-6 py-2 text-sm font-medium transition-all disabled:opacity-50"
            style={{
              border: "1px solid rgba(212,160,23,0.4)",
              color: "var(--accent-gold)",
              background: "rgba(212,160,23,0.06)",
            }}
          >
            {saving ? "保存中…" : "保存更改"}
          </button>
        </form>
      </section>

      {/* 回声余额 & 充值 */}
      <section
        className="rounded-2xl p-6"
        style={{ border: "1px solid rgba(212,160,23,0.15)", background: "rgba(255,255,255,0.02)" }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
          <div>
            <h2 className="text-lg font-medium mb-1" style={{ color: "var(--text-primary)" }}>
              回声余额
            </h2>
            <div className="flex items-baseline gap-2">
              <Zap size={14} style={{ color: "var(--accent-gold)" }} className="mb-0.5" />
              <span className="text-3xl font-bold tabular-nums" style={{ color: "var(--accent-gold)" }}>
                {echoBalance.toLocaleString()}
              </span>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>回声</span>
            </div>
          </div>
          <Link href={getPath("/billing?tab=history")}>
            <span
              className="text-sm transition-opacity hover:opacity-70"
              style={{ color: "var(--text-secondary)" }}
            >
              查看消费记录 →
            </span>
          </Link>
        </div>

        {/* Recharge options */}
        <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
          选择充值方式
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RECHARGE_OPTIONS.map((opt) => {
            const locked = opt.memberOnly && isFreeTier;
            return (
              <button
                key={opt.id}
                onClick={() => handleRechargeClick(opt.id, opt.memberOnly)}
                className="relative flex items-start gap-3 rounded-xl p-4 text-left transition-all"
                style={
                  locked
                    ? {
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        cursor: "pointer",
                        opacity: 0.6,
                      }
                    : {
                        background: "rgba(212,160,23,0.06)",
                        border: "1px solid rgba(212,160,23,0.2)",
                        cursor: "pointer",
                      }
                }
              >
                {locked && (
                  <Lock size={12} className="absolute top-3 right-3" style={{ color: "rgba(255,255,255,0.3)" }} />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium mb-0.5" style={{ color: locked ? "rgba(255,255,255,0.4)" : "var(--text-primary)" }}>
                    {opt.label}
                  </p>
                  <p className="text-base font-bold" style={{ color: locked ? "rgba(255,255,255,0.3)" : "var(--accent-gold)" }}>
                    {opt.rate}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {locked ? (
                      <Link href={getPath("/billing?tab=recharge")} className="underline underline-offset-2 hover:opacity-70" style={{ color: "var(--accent-gold)" }}>
                        升级会员解锁 →
                      </Link>
                    ) : (
                      opt.description
                    )}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 危险区 */}
      <section
        className="rounded-2xl p-6"
        style={{ border: "1px solid rgba(127,29,29,0.3)", background: "rgba(127,29,29,0.05)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-medium mb-1 flex items-center gap-2" style={{ color: "#F87171" }}>
              <AlertTriangle className="h-4 w-4" />
              危险区
            </h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              注销账号将永久删除所有数据，包括记忆档案和对话记录，此操作不可逆。
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-all hover:bg-red-900/50"
            style={{ background: "rgba(127,29,29,0.3)", color: "#F87171" }}
          >
            注销账号
          </button>
        </div>
      </section>

      {/* Confirm delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm px-4">
          <div
            className="max-w-md w-full rounded-2xl p-6 shadow-2xl"
            style={{ background: "var(--surface)", border: "1px solid rgba(127,29,29,0.3)" }}
          >
            <h3 className="text-lg font-medium mb-4" style={{ color: "#F87171" }}>最终确认</h3>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.65)" }}>
              您确定要注销此账号吗？所有个人信息、充值余额、记忆档案及对话记录将被{" "}
              <strong style={{ color: "#F87171" }}>永久物理删除</strong>，且无法恢复。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="rounded-full px-4 py-2 text-sm transition-colors disabled:opacity-50"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full px-5 py-2 text-sm font-medium transition-all disabled:opacity-50 hover:bg-red-800"
                style={{ background: "rgba(153,27,27,0.8)", color: "#FCA5A5" }}
              >
                {deleting ? "删除中…" : "确认注销"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
