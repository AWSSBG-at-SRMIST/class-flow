"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  userName?: string;
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
}

export function PageHeader({
  userName,
  showBack,
  backHref,
  backLabel = "Back",
}: PageHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-[#1a1a1a] bg-[#050505]/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-4">
          {showBack && (
            <button
              onClick={() => backHref ? router.push(backHref) : router.back()}
              className="text-[#888] hover:text-[#FF9900] transition-colors duration-150 flex items-center gap-1 text-sm"
              aria-label="Go back"
            >
              ← {backLabel}
            </button>
          )}
          <span className="font-mono text-sm font-bold text-[#FF9900] tracking-wider">
            ▸ AWS SBG
          </span>
          <span className="text-[#2d2d2d] hidden sm:inline">|</span>
          <span className="text-[#555] text-xs hidden sm:inline tracking-wider">
            C2C TRACKER
          </span>
        </div>

        {/* Right */}
        {userName && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#555] hidden sm:inline truncate max-w-[160px]">
              {userName}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
