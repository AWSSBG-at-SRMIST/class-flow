import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 min-h-svh text-center">
      <div className="text-[#FF9900] font-mono font-bold text-6xl mb-4">404</div>
      <h1 className="text-[#f0f0f0] font-bold text-xl mb-2">Page Not Found</h1>
      <p className="text-[#555] text-sm font-mono mb-8">
        The event you&apos;re looking for doesn&apos;t exist or is no longer available.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 bg-[#FF9900] text-[#050505] font-bold font-mono px-5 py-2.5 text-sm hover:bg-[#e68900] transition-colors"
      >
        ← Back to Dashboard
      </Link>
    </main>
  );
}
