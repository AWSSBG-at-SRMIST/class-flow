"use client";

import React, { useState } from "react";
import { Input }   from "@/components/ui/input";
import { Select }  from "@/components/ui/select";
import { Button }  from "@/components/ui/button";
import { YEAR_OPTIONS } from "@/types";
import type { Event, SessionUser, Year, C2CFormData } from "@/types";
import { formatEventDate } from "@/lib/events";

const YEAR_SELECT_OPTIONS = YEAR_OPTIONS.map((y) => ({ value: y, label: y }));

interface C2CFormProps {
  event: Event;
  user:  SessionUser;
}

interface FormErrors extends Partial<Record<keyof C2CFormData, string>> {}

interface SuccessState {
  submissionId: string;
  whatsappUrl:  string;
  message:      string;
}

export function C2CForm({ event, user }: C2CFormProps) {
  const [form, setForm] = useState<C2CFormData>({
    roomNumber: "",
    year:       "" as Year,
    section:    "",
    crName:     "",
    crPhone:    "",
  });

  const [errors,    setErrors]    = useState<FormErrors>({});
  const [apiError,  setApiError]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState<SuccessState | null>(null);
  const [waCopied,  setWaCopied]  = useState(false);

  // ── Field helpers ──────────────────────────────────────────────────────────
  function update<K extends keyof C2CFormData>(key: K, value: C2CFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setApiError("");
  }

  // ── Client-side validation (mirrors server) ────────────────────────────────
  function validate(): FormErrors {
    const errs: FormErrors = {};
    const room    = form.roomNumber.trim().toUpperCase();
    const section = form.section.trim().toUpperCase();
    const phone   = form.crPhone.trim().replace(/\s+/g, "");
    const crName  = form.crName.trim();

    if (!room) {
      errs.roomNumber = "Room number is required.";
    } else if (!/^[A-Z]{1,3}[0-9]{1,4}$/.test(room)) {
      errs.roomNumber = "Must be 1–3 letters followed by 1–4 digits (e.g. LH613).";
    }

    if (!form.year) {
      errs.year = "Please select your year.";
    }

    if (!section) {
      errs.section = "Section is required.";
    } else if (!/^[A-Z]{1,2}[012]$/.test(section)) {
      errs.section = "Must be 1–2 letters followed by 0, 1, or 2 (e.g. A0, CS2).";
    }

    if (!crName) {
      errs.crName = "CR name is required.";
    } else if (crName.length < 2) {
      errs.crName = "At least 2 characters.";
    }

    if (!phone) {
      errs.crPhone = "CR phone number is required.";
    } else if (!/^(\+91|91)?[6-9][0-9]{9}$/.test(phone)) {
      errs.crPhone = "Enter a valid 10-digit Indian mobile number.";
    }

    return errs;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Focus first error field
      const first = Object.keys(errs)[0] as keyof C2CFormData;
      document.getElementById(`c2c-${first}`)?.focus();
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch("/api/c2c", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ eventId: event.eventId, ...form }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 422 && data.errors) {
          setErrors(data.errors);
        } else {
          setApiError(data.error ?? "Submission failed. Please try again.");
        }
        return;
      }

      setSuccess(data.data as SuccessState);
    } catch {
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Copy fallback message ─────────────────────────────────────────────────
  async function copyMessage() {
    if (!success) return;
    try {
      await navigator.clipboard.writeText(success.message);
      setWaCopied(true);
      setTimeout(() => setWaCopied(false), 2000);
    } catch {
      setWaCopied(false);
    }
  }

  // ── Success view ───────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="animate-fade-in flex flex-col gap-5">
        {/* Success banner */}
        <div className="bg-[rgba(0,200,81,0.08)] border border-[rgba(0,200,81,0.25)] p-5">
          <div className="text-[#00c851] text-lg font-bold mb-1">✓ Submission Recorded</div>
          <p className="text-[#555] text-sm font-mono">
            Your C2C submission for <span className="text-[#888]">{event.name}</span> has been saved.
          </p>
          <p className="text-[#333] text-xs font-mono mt-1">
            ID: <span className="text-[#555]">{success.submissionId}</span>
          </p>
        </div>

        {/* WhatsApp CTA */}
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-5">
          <h2 className="text-[#f0f0f0] font-bold mb-1">Next Step: Message your CR</h2>
          <p className="text-[#555] text-sm font-mono mb-4">
            Open WhatsApp with the pre-filled message. You must press{" "}
            <span className="text-[#888]">Send</span> yourself.
          </p>

          <a
            href={success.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-bold font-mono px-6 py-3 text-sm transition-all duration-150 hover:bg-[#1da851] hover:shadow-[0_0_0_3px_rgba(37,211,102,0.2)] mb-3"
            aria-label="Open WhatsApp to message CR"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Open WhatsApp →
          </a>

          {/* Message preview + copy */}
          <div className="border border-[#1a1a1a] bg-[#080808]">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a1a1a]">
              <span className="text-[#555] text-xs font-mono uppercase tracking-wider">
                Pre-filled Message
              </span>
              <button
                onClick={copyMessage}
                className="text-xs text-[#555] hover:text-[#FF9900] transition-colors font-mono"
                aria-label="Copy message text"
              >
                {waCopied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <pre className="text-[#666] text-xs p-3 whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-64">
              {success.message}
            </pre>
          </div>

          <p className="text-[#333] text-xs font-mono mt-3 text-center">
            ⚠ The app cannot confirm that the message was sent — you must press Send in WhatsApp.
          </p>
        </div>
      </div>
    );
  }

  // ── Form view ──────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 animate-fade-in">

      {/* API-level error */}
      {apiError && (
        <div
          role="alert"
          className="p-3 bg-[rgba(255,68,68,0.08)] border border-[rgba(255,68,68,0.25)] text-[#ff4444] text-xs font-mono"
        >
          ⚠ {apiError}
        </div>
      )}

      {/* ── Section: Identity ── */}
      <fieldset className="bg-[#0d0d0d] border border-[#1a1a1a] p-5">
        <legend className="text-[#555] text-xs uppercase tracking-widest font-mono px-1 mb-4">
          Your Identity
        </legend>

        <div className="relative">
          <Input
            id="c2c-inchargeName"
            label="C2C Incharge Name (Auto-filled)"
            value={user.name}
            readOnly
            hint="This field is automatically filled with your logged-in name."
            icon={<span aria-hidden>🔒</span>}
          />
        </div>
      </fieldset>

      {/* ── Section: Classroom ── */}
      <fieldset className="bg-[#0d0d0d] border border-[#1a1a1a] p-5">
        <legend className="text-[#555] text-xs uppercase tracking-widest font-mono px-1 mb-4">
          Your Classroom
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="c2c-roomNumber"
            label="Room Number"
            placeholder="e.g. LH613, TP103, CLS604"
            value={form.roomNumber}
            onChange={(e) => update("roomNumber", e.target.value.toUpperCase())}
            error={errors.roomNumber}
            hint="Start with letters (e.g. LH613)"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />

          <Select
            id="c2c-year"
            label="Year"
            placeholder="Select year"
            options={YEAR_SELECT_OPTIONS}
            value={form.year}
            onChange={(e) => update("year", e.target.value as Year)}
            error={errors.year}
          />

          <Input
            id="c2c-section"
            label="Section"
            placeholder="e.g. A0, B1, CS2"
            value={form.section}
            onChange={(e) => update("section", e.target.value.toUpperCase())}
            error={errors.section}
            hint="1–2 letters + batch number (0, 1, or 2)"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </fieldset>

      {/* ── Section: CR Details ── */}
      <fieldset className="bg-[#0d0d0d] border border-[#1a1a1a] p-5">
        <legend className="text-[#555] text-xs uppercase tracking-widest font-mono px-1 mb-4">
          Class Representative
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="c2c-crName"
            label="CR Name"
            placeholder="Enter CR name"
            value={form.crName}
            onChange={(e) => update("crName", e.target.value)}
            error={errors.crName}
            autoComplete="off"
          />

          <Input
            id="c2c-crPhone"
            label="CR Phone Number"
            type="tel"
            placeholder="+91 XXXXX XXXXX"
            value={form.crPhone}
            onChange={(e) => update("crPhone", e.target.value)}
            error={errors.crPhone}
            hint="Indian mobile number — this will be the WhatsApp recipient."
            autoComplete="tel"
          />
        </div>
      </fieldset>

      {/* ── Event summary ── */}
      <div className="bg-[rgba(255,153,0,0.04)] border border-[rgba(255,153,0,0.1)] px-4 py-3">
        <p className="text-[#555] text-xs font-mono">
          Promoting:{" "}
          <span className="text-[#FF9900] font-bold">{event.name}</span>
          {" · "}{formatEventDate(event.date)}
        </p>
      </div>

      {/* ── Submit ── */}
      <Button
        type="submit"
        size="lg"
        loading={loading}
        className="w-full"
        aria-label="Submit C2C form and generate WhatsApp message"
      >
        {loading ? "Submitting…" : "Submit & Generate WhatsApp Message →"}
      </Button>

      <p className="text-[#333] text-xs font-mono text-center">
        By submitting, you confirm that the details above are correct.
      </p>
    </form>
  );
}
