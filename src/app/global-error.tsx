"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-svh flex flex-col items-center justify-center bg-[#050505] text-[#f0f0f0] font-mono p-8 text-center">
        <div className="text-[#ff4444] font-bold text-5xl mb-4">⚠</div>
        <h1 className="font-bold text-xl mb-2">Something went wrong</h1>
        <p className="text-[#555] text-sm mb-6 max-w-sm">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="bg-[#FF9900] text-[#050505] font-bold px-5 py-2.5 text-sm hover:bg-[#e68900] transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="border border-[#2d2d2d] text-[#888] px-5 py-2.5 text-sm hover:border-[#FF9900] hover:text-[#FF9900] transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </body>
    </html>
  );
}
