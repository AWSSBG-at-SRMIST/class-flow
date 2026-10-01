"use client";

import React from "react";

type Variant = "primary" | "ghost" | "danger" | "outline";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?:    Size;
  loading?: boolean;
  icon?:    React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[#FF9900] text-[#050505] font-bold hover:bg-[#e68900] active:bg-[#cc7a00] " +
    "disabled:bg-[#2d2d2d] disabled:text-[#555] disabled:cursor-not-allowed " +
    "border border-transparent hover:shadow-[0_0_0_3px_rgba(255,153,0,0.2)]",
  ghost:
    "bg-transparent text-[#f0f0f0] hover:bg-[#1a1a1a] border border-transparent " +
    "hover:border-[#2d2d2d]",
  danger:
    "bg-[#ff4444] text-white font-bold hover:bg-[#cc3333] border border-transparent",
  outline:
    "bg-transparent text-[#FF9900] border border-[#FF9900] hover:bg-[rgba(255,153,0,0.08)] " +
    "hover:shadow-[0_0_0_3px_rgba(255,153,0,0.1)]",
};

const sizeStyles: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5 h-8",
  md: "text-sm px-4 py-2 h-10",
  lg: "text-sm px-6 py-3 h-12",
};

export function Button({
  variant = "primary",
  size    = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center gap-2 font-mono transition-all duration-150",
        "cursor-pointer select-none",
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(" ")}
      {...props}
    >
      {loading ? (
        <span
          aria-label="Loading"
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
        />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}
