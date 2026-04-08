"use client";

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
        <span>步骤 {current}/{total}</span>
        <span>{percentage}%</span>
      </div>
      <div
        className="h-1 w-full rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: "var(--accent-gold)",
          }}
        />
      </div>
    </div>
  );
}
