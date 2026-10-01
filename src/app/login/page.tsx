import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Login — C2C Tracker",
};

export default function LoginPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 min-h-svh">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[rgba(255,153,0,0.04)] rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <LoginForm />
      </div>
    </main>
  );
}
