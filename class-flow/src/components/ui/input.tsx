"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:    string;
  error?:    string;
  hint?:     string;
  icon?:     React.ReactNode;
  readOnly?: boolean;
}

export function Input({
  label,
  error,
  hint,
  icon,
  id,
  readOnly,
  className = "",
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-bold uppercase tracking-widest text-[#888]"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          readOnly={readOnly}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={[
            "w-full bg-[#111] text-[#f0f0f0] font-mono text-sm",
            "border transition-all duration-150 outline-none",
            "placeholder:text-[#555]",
            icon ? "pl-10 pr-3 py-2.5" : "px-3 py-2.5",
            readOnly
              ? "border-[#1a1a1a] cursor-default text-[#888] bg-[#0a0a0a]"
              : error
              ? "border-[#ff4444] focus:border-[#ff4444] focus:shadow-[0_0_0_3px_rgba(255,68,68,0.12)]"
              : "border-[#2d2d2d] focus:border-[#FF9900] focus:shadow-[0_0_0_3px_rgba(255,153,0,0.15)]",
            className,
          ].join(" ")}
          {...props}
        />
      </div>

      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-xs text-[#ff4444] flex items-center gap-1"
        >
          <span aria-hidden>⚠</span> {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-[#555]">
          {hint}
        </p>
      )}
    </div>
  );
}
