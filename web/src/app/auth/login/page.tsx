"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/onboarding";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "邮箱或密码错误"
          : error.message
      );
      setLoading(false);
      return;
    }

    window.location.href = redirect;
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold" style={{ color: "var(--accent-gold)" }}>
          CyberImmo
        </h1>
        <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
          登录以继续
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            邮箱
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:ring-1"
            style={{
              backgroundColor: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            密码
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 6 位"
            className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:ring-1"
            style={{
              backgroundColor: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg py-3 text-sm font-medium transition-opacity disabled:opacity-50"
          style={{
            backgroundColor: "var(--accent-gold)",
            color: "#181A1F",
          }}
        >
          {loading ? "登录中..." : "登录"}
        </button>
      </form>

      <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        还没有账号？{" "}
        <Link
          href={`/auth/register?redirect=${encodeURIComponent(redirect)}`}
          style={{ color: "var(--accent-gold)" }}
        >
          立即注册
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
