"use client";

import { type TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export default function TextArea({
  label,
  hint,
  id,
  className = "",
  ...props
}: TextAreaProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </label>
      )}
      {hint && (
        <p className="text-xs" style={{ color: "var(--disabled-icon)" }}>
          {hint}
        </p>
      )}
      <textarea
        id={id}
        rows={4}
        className={`w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors resize-none focus:ring-1 ${className}`}
        style={{
          backgroundColor: "var(--input-bg)",
          border: "1px solid var(--input-border)",
          color: "var(--text-primary)",
        }}
        {...props}
      />
    </div>
  );
}
