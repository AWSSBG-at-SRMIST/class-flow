// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp URL Generator
// Uses wa.me deep link (Option A) — user presses Send themselves.
// The app does NOT send messages automatically.
// ─────────────────────────────────────────────────────────────────────────────
import type { Event } from "@/types";

/**
 * Returns the event-specific WhatsApp message from event.messageToCR.
 * Source of truth: the selected event record in sbg-events.
 *
 * Returns null if the event does not have a messageToCR value —
 * callers must handle this and MUST NOT substitute a fallback message.
 */
export function getWhatsAppMessage(event: Event): string | null {
  const msg = event.messageToCR;
  if (typeof msg !== "string" || (msg as string).trim() === "") return null;
  return msg as string;
}

/**
 * Generates a wa.me deep link URL with the pre-filled message.
 * phone should already be in E.164 format (91XXXXXXXXXX — without leading +).
 */
export function generateWhatsAppURL(phone: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}
