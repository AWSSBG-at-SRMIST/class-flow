// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp URL Generator
// Uses wa.me deep link (Option A) — user presses Send themselves.
// The app does NOT send messages automatically.
// ─────────────────────────────────────────────────────────────────────────────
import type { Event, C2CSubmission } from "@/types";
import { formatEventDate } from "./events";

/**
 * Build the pre-filled WhatsApp message.
 * Uses event details + C2C submission data.
 */
export function buildWhatsAppMessage(
  event: Event,
  submission: C2CSubmission
): string {
  const date  = formatEventDate(event.date);
  const venue = event.venue ?? "TBD";
  const mode  = event.mode  ?? "TBD";

  return (
    `Hi! 👋\n\n` +
    `I'm *${submission.inchargeName}*, the C2C Incharge for our class.\n\n` +
    `I'd like to promote this upcoming *AWS SBG* event to our classmates:\n\n` +
    `📌 *Event:* ${event.name}\n` +
    `📅 *Date:* ${date}\n` +
    `📍 *Venue:* ${venue}\n` +
    `🖥️ *Mode:* ${mode}\n\n` +
    `*Our Class Details:*\n` +
    `🏫 *Room:* ${submission.roomNumber}\n` +
    `📚 *Year:* ${submission.year}\n` +
    `📝 *Section:* ${submission.section}\n\n` +
    `Could you please share this with our classmates? 🙏\n\n` +
    `— *AWS Student Builder Group, SRM IST*`
  );
}

/**
 * Generates a wa.me deep link URL with the pre-filled message.
 * phone should already be in E.164 format (91XXXXXXXXXX — without leading +).
 */
export function generateWhatsAppURL(phone: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}
