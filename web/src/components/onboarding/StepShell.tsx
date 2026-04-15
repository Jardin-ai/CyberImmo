"use client";

import ProgressBar from "@/components/ui/ProgressBar";
import Button from "@/components/ui/Button";
import { ONBOARDING_STEPS } from "@/lib/constants";

interface StepShellProps {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  onFastTrack?: () => void;
  loading?: boolean;
}

export default function StepShell({
  step,
  title,
  subtitle,
  children,
  onPrev,
  onNext,
  nextLabel = "下一步",
  nextDisabled = false,
  onFastTrack,
  loading = false,
}: StepShellProps) {
  return (
    <div className="flex min-h-dvh flex-col px-4 py-8 max-w-lg mx-auto w-full">
      <ProgressBar current={step} total={ONBOARDING_STEPS} />

      <div className="mt-8 mb-6">
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex-1 space-y-6">{children}</div>

      <div className="mt-8 flex flex-col gap-3">
        <div className="flex gap-3">
          {onPrev && (
            <Button variant="secondary" onClick={onPrev} className="flex-1">
              上一步
            </Button>
          )}
          {onNext && (
            <Button
              variant="primary"
              onClick={onNext}
              disabled={nextDisabled || loading}
              className="flex-1"
            >
              {loading ? "提交中..." : nextLabel}
            </Button>
          )}
        </div>
        {onFastTrack && (
          <Button
            variant="ghost"
            onClick={onFastTrack}
            disabled={nextDisabled || loading}
            className="w-full text-accent hover:bg-accent/10 border border-accent/20"
          >
            {loading ? "提交中..." : "跳过后续，立即开启连接"}
          </Button>
        )}
      </div>
    </div>
  );
}
