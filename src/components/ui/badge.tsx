import React from "react";

type Variant = "default" | "primary" | "success" | "warning" | "error" | "live";

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

const styles: Record<Variant, string> = {
  default:  "bg-[#1a1a1a] text-[#888] border border-[#2d2d2d]",
  primary:  "bg-[rgba(255,153,0,0.12)] text-[#FF9900] border border-[rgba(255,153,0,0.3)]",
  success:  "bg-[rgba(0,200,81,0.12)] text-[#00c851] border border-[rgba(0,200,81,0.3)]",
  warning:  "bg-[rgba(255,200,0,0.12)] text-[#ffc800] border border-[rgba(255,200,0,0.3)]",
  error:    "bg-[rgba(255,68,68,0.12)] text-[#ff4444] border border-[rgba(255,68,68,0.3)]",
  live:     "bg-[rgba(0,200,81,0.08)] text-[#00c851] border border-[rgba(0,200,81,0.25)] " +
            "before:content-['●'] before:text-[#00c851] before:text-[8px] before:mr-1 before:animate-pulse",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 uppercase tracking-wider",
        styles[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
