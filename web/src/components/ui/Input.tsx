"use client";

import { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, id, className = "", ...props }: InputProps) {
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
      <input
        id={id}
        className={`w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:ring-1 ${className}`}
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
