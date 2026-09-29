// ─────────────────────────────────────────────────────────────────────────────
// SBG C2C Tracker – Type Definitions
// Compatible with Internal Dashboard (console repo) interfaces.
// ─────────────────────────────────────────────────────────────────────────────

// ── Member (sbg-members) ─────────────────────────────────────────────────────
export interface Member {
  memberId: string;
  name: string;
  role: string;
  domain: string;
  subdomain: string;
  officialEmail: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ── Session (sbg-sessions) ────────────────────────────────────────────────────
export interface SessionRecord {
  sessionToken: string; // PK
  memberId: string;
  name: string;
  role: string;
  domain: string;
  subdomain: string;
  officialEmail: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
}

// The shape returned from getCurrentUser() for use throughout the app
export interface SessionUser {
  memberId: string;
  name: string;
  role: string;
  domain: string;
  subdomain: string;
  officialEmail: string;
  isActive: boolean;
}

// ── OTP (sbg-otps) ────────────────────────────────────────────────────────────
export interface OTPRecord {
  email: string;       // PK
  hashedOtp: string;
  expiresAt: string;   // ISO 8601 (human-readable)
  ttl?: number;        // Unix epoch seconds — for DynamoDB TTL feature
  attempts: number;
  createdAt: string;
  lockedUntil?: string; // ISO 8601 – set on too many failed attempts
}

// ── Event (sbg-events) – READ ONLY from C2C ──────────────────────────────────
export type EventStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "LIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";

export type EventMode = "ONLINE" | "OFFLINE" | "HYBRID";

export interface Event {
  eventId: string;        // PK
  name: string;
  description?: string;
  date: string;           // ISO date string (YYYY-MM-DD or ISO 8601)
  venue?: string;
  mode?: EventMode;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  // Additional fields may exist in sbg-events; we surface only what C2C needs.
  [key: string]: unknown;
}

// ── C2C Form & Submission ─────────────────────────────────────────────────────
export const YEAR_OPTIONS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
] as const;

export type Year = (typeof YEAR_OPTIONS)[number];

export interface C2CFormData {
  roomNumber: string;
  year: Year;
  section: string;
  crName: string;
  crPhone: string;
}

export interface C2CSubmission {
  submissionId: string;   // PK (UUID)
  eventId: string;        // GSI: EventMemberIndex HASH
  memberId: string;       // GSI: EventMemberIndex RANGE | MemberIndex HASH
  inchargeName: string;   // from session – never from client
  roomNumber: string;
  year: Year;
  section: string;
  crName: string;
  crPhone: string;        // E.164 normalized (91XXXXXXXXXX)
  submittedAt: string;    // ISO 8601 UTC
  status: "SUBMITTED";
}

// ── API response shapes ───────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface C2CSubmitResponse {
  submissionId: string;
  whatsappUrl: string;
  message: string;  // the pre-filled WhatsApp message text (for fallback display)
}
