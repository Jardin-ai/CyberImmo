"use client";

import { INITIAL_QUESTIONNAIRE, type QuestionnaireData } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getPath } from "@/lib/public-base-path";
import { useCallback, useEffect, useState } from "react";
import { submitOnboarding } from "./actions";
import Step0Consent from "./steps/Step0Consent";
import Step1Basic from "./steps/Step1Basic";
import Step2Personality from "./steps/Step2Personality";
import Step3Memories from "./steps/Step3Memories";
import Step4Boundaries from "./steps/Step4Boundaries";
import Step5Opening from "./steps/Step5Opening";
import { createClient } from "@/lib/supabase/client";

const LOCAL_STORAGE_KEY = "cyberimmo_persona_draft";

export default function OnboardingClient({
  initialStep = 0,
  initialData = INITIAL_QUESTIONNAIRE,
  personaId = null,
}: {
  initialStep?: number;
  initialData?: QuestionnaireData;
  personaId?: string | null;
}) {
  const [step, setStep] = useState(initialStep);
  const [data, setData] = useState<QuestionnaireData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  // Load from localStorage on mount if guest
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsGuest(true);
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setData((prev) => ({ ...prev, ...parsed }));
          } catch (e) {
            console.error("Failed to parse saved draft", e);
          }
        }
      }
    };
    checkUser();
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (isGuest) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isGuest]);

  const handleChange = useCallback((patch: Partial<QuestionnaireData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const prev = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);
  const next = useCallback(() => setStep((s) => Math.min(5, s + 1)), []);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      if (personaId) {
        // Edit mode (always logged in)
        const result = await (
          await import("./actions")
        ).updateOnboarding(personaId, data);
        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }
        window.location.href = "/dashboard";
      } else if (isGuest) {
        // Guest mode
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        // Redirect to guest chat
        window.location.href = "/chat/guest";
      } else {
        // Create mode (logged in)
        const result = await submitOnboarding(data);
        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }
        // Success: clear local draft
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        window.location.href = `/chat/${result.personaId}`;
      }
    } catch {
      setError("提交失败，请稍后重试");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh relative">
      {/* Back button */}
      <Link
        href={!isGuest || personaId ? getPath("/dashboard") : getPath("/")}
        className="absolute left-6 top-8 z-30 flex items-center gap-2 text-sm text-foreground/40 transition-colors hover:text-accent select-none"
      >
        <ArrowLeft size={16} />
        <span>返回{!isGuest || personaId ? "控制台" : "首页"}</span>
      </Link>

      {error && (
        <div className="fixed top-4 left-4 right-4 z-50 rounded-lg bg-red-900/80 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {step === 0 && <Step0Consent onNext={next} isGuest={isGuest} />}
      {step === 1 && (
        <Step1Basic data={data} onChange={handleChange} onNext={next} />
      )}
      {step === 2 && (
        <Step2Personality
          data={data}
          onChange={handleChange}
          onPrev={prev}
          onNext={next}
          onFastTrack={handleSubmit}
          loading={loading}
        />
      )}
      {step === 3 && (
        <Step3Memories
          data={data}
          onChange={handleChange}
          onPrev={prev}
          onNext={next}
        />
      )}
      {step === 4 && (
        <Step4Boundaries
          data={data}
          onChange={handleChange}
          onPrev={prev}
          onNext={next}
        />
      )}
      {step === 5 && (
        <Step5Opening
          data={data}
          onChange={handleChange}
          onPrev={prev}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}
    </main>
  );
}
