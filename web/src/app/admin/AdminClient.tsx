"use client";

import { useState, useTransition } from "react";
import { verifyAdminSecret, lookupUser, adjustBalance } from "./actions";

interface UserData {
  id: string;
  email: string;
  display_name: string | null;
  echo_balance: number;
  subscription_tier: string;
}

export default function AdminClient({ initiallyAuthed }: { initiallyAuthed: boolean }) {
  const [authed, setAuthed] = useState(initiallyAuthed);
  const [secretInput, setSecretInput] = useState("");
  const [authError, setAuthError] = useState("");

  const [emailInput, setEmailInput] = useState("");
  const [foundUser, setFoundUser] = useState<UserData | null>(null);
  const [lookupError, setLookupError] = useState("");

  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [adjustResult, setAdjustResult] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleAuth = () => {
    startTransition(async () => {
      const { ok } = await verifyAdminSecret(secretInput);
      if (ok) {
        setAuthed(true);
        setAuthError("");
      } else {
        setAuthError("密钥错误");
      }
    });
  };

  const handleLookup = () => {
    setFoundUser(null);
    setLookupError("");
    setAdjustResult(null);
    startTransition(async () => {
      const result = await lookupUser(emailInput);
      if ("error" in result) {
        setLookupError(result.error ?? "未知错误");
      } else if (result.user) {
        setFoundUser(result.user as UserData);
      }
    });
  };

  const handleAdjust = () => {
    if (!foundUser) return;
    const deltaNum = parseInt(delta);
    if (isNaN(deltaNum) || deltaNum === 0) {
      setAdjustResult("请输入有效的数字（正数充值，负数扣减）");
      return;
    }
    startTransition(async () => {
      const result = await adjustBalance(foundUser.id, deltaNum, reason);
      if (result.ok) {
        setAdjustResult(`操作成功。新余额：${result.newBalance} 回声`);
        setFoundUser((u) => u ? { ...u, echo_balance: result.newBalance ?? u.echo_balance } : u);
        setDelta("");
        setReason("");
      } else {
        setAdjustResult(`操作失败：${result.error}`);
      }
    });
  };

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black p-8">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-center text-sm font-medium tracking-[0.3em] text-white/40 uppercase">
            Admin Access
          </h1>
          <input
            type="password"
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            placeholder="管理员密钥"
            className="w-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
          />
          {authError && <p className="text-xs text-red-400">{authError}</p>}
          <button
            onClick={handleAuth}
            disabled={isPending}
            className="w-full border border-white/20 py-3 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            {isPending ? "验证中…" : "进入"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <h1 className="mb-8 text-sm font-medium tracking-[0.3em] text-white/40 uppercase">
        CyberImmo Admin
      </h1>

      {/* User Lookup */}
      <section className="mb-8 max-w-lg space-y-4">
        <h2 className="text-xs tracking-widest text-white/30 uppercase">查找用户</h2>
        <div className="flex gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            placeholder="用户邮箱"
            className="flex-1 border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
          />
          <button
            onClick={handleLookup}
            disabled={isPending || !emailInput.trim()}
            className="border border-white/20 px-5 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            查找
          </button>
        </div>
        {lookupError && <p className="text-xs text-red-400">{lookupError}</p>}
      </section>

      {/* User Card + Adjust */}
      {foundUser && (
        <section className="max-w-lg space-y-6">
          <div className="border border-white/10 p-4 space-y-1.5 text-sm">
            <p><span className="text-white/30">显示名：</span>{foundUser.display_name ?? "—"}</p>
            <p><span className="text-white/30">邮箱：</span>{foundUser.email}</p>
            <p><span className="text-white/30">套餐：</span>{foundUser.subscription_tier}</p>
            <p>
              <span className="text-white/30">回声余额：</span>
              <span className="font-mono text-amber-400">{foundUser.echo_balance.toLocaleString()}</span>
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xs tracking-widest text-white/30 uppercase">调整余额</h2>
            <input
              type="number"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="变动量（正数充值，负数扣减）"
              className="w-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
            />
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="操作原因（必填）"
              className="w-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
            />
            <button
              onClick={handleAdjust}
              disabled={isPending || !delta || !reason.trim()}
              className="w-full border border-white/20 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
            >
              {isPending ? "处理中…" : "确认操作"}
            </button>
            {adjustResult && (
              <p className={`text-xs ${adjustResult.startsWith("操作成功") ? "text-green-400" : "text-red-400"}`}>
                {adjustResult}
              </p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
