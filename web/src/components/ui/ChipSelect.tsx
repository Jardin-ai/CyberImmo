"use client";

interface ChipSelectProps {
  label?: string;
  options: readonly string[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
}

export default function ChipSelect({
  label,
  options,
  value,
  onChange,
  multiple = false,
}: ChipSelectProps) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  function handleClick(option: string) {
    if (multiple) {
      const arr = selected.includes(option)
        ? selected.filter((v) => v !== option)
        : [...selected, option];
      onChange(arr);
    } else {
      onChange(option === value ? "" : option);
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {label}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleClick(option)}
              className="rounded-full px-4 py-2 text-sm transition-all"
              style={{
                backgroundColor: isSelected ? "var(--accent-gold)" : "var(--surface)",
                color: isSelected ? "#181A1F" : "var(--text-primary)",
                border: isSelected
                  ? "1px solid var(--accent-gold)"
                  : "1px solid var(--surface-border)",
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
