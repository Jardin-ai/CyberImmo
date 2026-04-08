"use client";

import { useState, useCallback } from "react";
import { INITIAL_QUESTIONNAIRE, type QuestionnaireData } from "@/lib/types";
import Step0Consent from "./steps/Step0Consent";
import Step1Basic from "./steps/Step1Basic";
import Step2Personality from "./steps/Step2Personality";
import Step3Memories from "./steps/Step3Memories";
import Step4Boundaries from "./steps/Step4Boundaries";
import Step5Opening from "./steps/Step5Opening";
import { submitOnboarding } from "./actions";

export default function OnboardingClient({ initialStep = 0 }: { initialStep?: number }) {
  const [step, setStep] = useState(initialStep);
  const [data, setData] = useState<QuestionnaireData>(INITIAL_QUESTIONNAIRE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback((patch: Partial<QuestionnaireData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const prev = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);
  const next = useCallback(() => setStep((s) => Math.min(5, s + 1)), []);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const result = await submitOnboarding(data);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      // Redirect to chat page
      window.location.href = `/chat/${result.personaId}`;
    } catch {
      setError("提交失败，请稍后重试");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh">
      {error && (
        <div className="fixed top-4 left-4 right-4 z-50 rounded-lg bg-red-900/80 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {step === 0 && (
        <Step0Consent onNext={next} />
      )}
      {step === 1 && (
        <Step1Basic data={data} onChange={handleChange} onNext={next} />
      )}
      {step === 2 && (
        <Step2Personality
          data={data}
          onChange={handleChange}
          onPrev={prev}
          onNext={next}
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
