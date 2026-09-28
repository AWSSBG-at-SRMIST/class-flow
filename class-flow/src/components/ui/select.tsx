"use client";

import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:   string;
  error?:   string;
  hint?:    string;
  options:  { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  hint,
  options,
  placeholder = "Select an option",
  id,
  className = "",
  ...props
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-bold uppercase tracking-widest text-[#888]"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : undefined}
          className={[
            "w-full appearance-none bg-[#111] text-[#f0f0f0] font-mono text-sm",
            "border px-3 py-2.5 pr-9 transition-all duration-150 outline-none cursor-pointer",
            error
              ? "border-[#ff4444] focus:border-[#ff4444] focus:shadow-[0_0_0_3px_rgba(255,68,68,0.12)]"
              : "border-[#2d2d2d] focus:border-[#FF9900] focus:shadow-[0_0_0_3px_rgba(255,153,0,0.15)]",
            className,
          ].join(" ")}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Custom chevron */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#555]">
          ▾
        </span>
      </div>

      {error && (
        <p
          id={`${selectId}-error`}
          role="alert"
          className="text-xs text-[#ff4444] flex items-center gap-1"
        >
          <span aria-hidden>⚠</span> {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-[#555]">{hint}</p>
      )}
    </div>
  );
}
