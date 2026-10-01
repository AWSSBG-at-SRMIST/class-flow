"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Step = "email" | "otp";

export function LoginForm() {
  const router = useRouter();

  const [step,    setStep]    = useState<Step>("email");
  const [email,   setEmail]   = useState("");
  const [otp,     setOtp]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res  = await fetch("/api/auth/send-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to send OTP. Please try again.");
        return;
      }

      setSuccess(`OTP sent to ${email}. Check your inbox.`);
      setStep("otp");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res  = await fetch("/api/auth/verify-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "Invalid OTP. Please try again.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Brand mark */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 text-[#FF9900] font-mono font-bold text-lg tracking-wider mb-3">
          <span className="text-2xl">▸</span>
          <span>AWS SBG</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#f0f0f0] tracking-tight">
          C2C TRACKER
        </h1>
        <p className="text-[#555] text-sm mt-2 font-mono">
          Class-to-Class Event Promotion
        </p>
      </div>

      {/* Card */}
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-6 sm:p-8">

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <span className={`text-xs font-mono font-bold px-2 py-0.5 ${
            step === "email"
              ? "text-[#FF9900] border border-[rgba(255,153,0,0.3)] bg-[rgba(255,153,0,0.08)]"
              : "text-[#555] border border-[#1a1a1a]"
          }`}>
            01 EMAIL
          </span>
          <span className="text-[#333] text-xs">──</span>
          <span className={`text-xs font-mono font-bold px-2 py-0.5 ${
            step === "otp"
              ? "text-[#FF9900] border border-[rgba(255,153,0,0.3)] bg-[rgba(255,153,0,0.08)]"
              : "text-[#333] border border-[#1a1a1a]"
          }`}>
            02 OTP
          </span>
        </div>

        {/* Success message */}
        {success && (
          <div className="mb-4 p-3 bg-[rgba(0,200,81,0.08)] border border-[rgba(0,200,81,0.25)] text-[#00c851] text-xs font-mono animate-fade-in">
            ✓ {success}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-[rgba(255,68,68,0.08)] border border-[rgba(255,68,68,0.25)] text-[#ff4444] text-xs font-mono animate-fade-in"
          >
            ⚠ {error}
          </div>
        )}

        {/* ── Email step ── */}
        {step === "email" && (
          <form onSubmit={handleSendOTP} noValidate className="flex flex-col gap-4">
            <Input
              id="login-email"
              label="Official SBG Email"
              type="email"
              placeholder="yourname@srmist.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
              hint="Use your official SBG email address"
            />
            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              {loading ? "Sending OTP…" : "Send OTP →"}
            </Button>
          </form>
        )}

        {/* ── OTP step ── */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} noValidate className="flex flex-col gap-4">
            <div className="text-xs text-[#555] font-mono mb-2">
              OTP sent to <span className="text-[#888]">{email}</span>
            </div>

            <Input
              id="login-otp"
              label="One-Time Password"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              autoFocus
              required
              hint={`Enter the 6-digit code sent to your email. Valid for 10 minutes.`}
              className="text-center text-xl tracking-[0.5em]"
            />

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full mt-2"
              disabled={otp.length !== 6}
            >
              {loading ? "Verifying…" : "Verify & Login →"}
            </Button>

            <button
              type="button"
              onClick={() => { setStep("email"); setOtp(""); setError(""); setSuccess(""); }}
              className="text-xs text-[#555] hover:text-[#888] transition-colors font-mono underline underline-offset-2 text-center"
            >
              ← Change email or resend OTP
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-xs text-[#333] mt-6 font-mono">
        AWS Student Builder Group — SRM IST
      </p>
    </div>
  );
}
