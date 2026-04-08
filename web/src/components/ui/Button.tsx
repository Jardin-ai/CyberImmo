"use client";

import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export default function Button({
  variant = "primary",
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const base = "rounded-lg px-6 py-3 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<string, string> = {
    primary: "",
    secondary: "",
    ghost: "",
  };

  const styles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: "var(--accent-gold)",
      color: "#181A1F",
    },
    secondary: {
      backgroundColor: "var(--surface)",
      color: "var(--text-primary)",
      border: "1px solid var(--surface-border)",
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--text-secondary)",
    },
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      style={styles[variant]}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
