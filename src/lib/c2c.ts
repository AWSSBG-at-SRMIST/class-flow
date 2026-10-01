// ─────────────────────────────────────────────────────────────────────────────
// C2C Submissions Library – writes to sbg-c2c-submissions (new table)
// ─────────────────────────────────────────────────────────────────────────────
import { v4 as uuidv4 } from "uuid";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { db, TABLE } from "./dynamodb";
import type { C2CSubmission, C2CFormData, SessionUser, Year } from "@/types";

// ── Validation ────────────────────────────────────────────────────────────────

/** ^[A-Z]{1,3}[0-9]{1,4}$ — starts with 1-3 letters, ends with 1-4 digits */
const ROOM_REGEX = /^[A-Z]{1,3}[0-9]{1,4}$/;

/** ^[A-Z]{1,2}[012]$ — 1-2 uppercase letters followed by 0, 1, or 2 */
const SECTION_REGEX = /^[A-Z]{1,2}[012]$/;

/** 10-digit Indian mobile starting with 6-9, optionally prefixed +91/91 */
const PHONE_REGEX = /^(\+91|91)?[6-9][0-9]{9}$/;

const VALID_YEARS: Year[] = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof C2CFormData, string>>;
}

export function validateC2CForm(data: C2CFormData): ValidationResult {
  const errors: Partial<Record<keyof C2CFormData, string>> = {};

  // Room number
  const room = data.roomNumber.trim().toUpperCase();
  if (!room) {
    errors.roomNumber = "Room number is required.";
  } else if (!ROOM_REGEX.test(room)) {
    errors.roomNumber =
      "Room number must start with 1–3 letters followed by 1–4 digits (e.g. LH613, TP103).";
  }

  // Year
  if (!VALID_YEARS.includes(data.year as Year)) {
    errors.year = "Please select a valid year.";
  }

  // Section
  const section = data.section.trim().toUpperCase();
  if (!section) {
    errors.section = "Section is required.";
  } else if (!SECTION_REGEX.test(section)) {
    errors.section =
      "Section must be 1–2 letters followed by 0, 1, or 2 (e.g. A0, CS2).";
  }

  // CR Name
  const crName = data.crName.trim();
  if (!crName) {
    errors.crName = "CR name is required.";
  } else if (crName.length < 2) {
    errors.crName = "CR name must be at least 2 characters.";
  } else if (crName.length > 100) {
    errors.crName = "CR name must be 100 characters or fewer.";
  }

  // CR Phone
  const phone = data.crPhone.trim().replace(/\s+/g, "");
  if (!phone) {
    errors.crPhone = "CR phone number is required.";
  } else if (!PHONE_REGEX.test(phone)) {
    errors.crPhone =
      "Enter a valid Indian mobile number (10 digits starting with 6–9).";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** Normalize phone to 91XXXXXXXXXX (no leading +) for wa.me */
export function normalizePhone(phone: string): string {
  const cleaned = phone.trim().replace(/\s+/g, "").replace(/^\+/, "");
  if (cleaned.startsWith("91") && cleaned.length === 12) return cleaned;
  if (cleaned.length === 10) return `91${cleaned}`;
  return cleaned;
}

// ── Create submission ─────────────────────────────────────────────────────────
export async function createC2CSubmission(
  user: SessionUser,
  eventId: string,
  formData: C2CFormData
): Promise<C2CSubmission> {
  const submissionId = uuidv4();
  const now          = new Date().toISOString();

  const submission: C2CSubmission = {
    submissionId,
    eventId,
    memberId:     user.memberId,
    inchargeName: user.name,              // always from session
    roomNumber:   formData.roomNumber.trim().toUpperCase(),
    year:         formData.year,
    section:      formData.section.trim().toUpperCase(),
    crName:       formData.crName.trim(),
    crPhone:      normalizePhone(formData.crPhone),
    submittedAt:  now,
    status:       "SUBMITTED",
  };

  await db.send(new PutCommand({ TableName: TABLE.C2C_SUBMISSIONS, Item: submission }));

  return submission;
}

/** Get a single submission by ID (for confirmation page). */
export async function getSubmissionById(
  submissionId: string
): Promise<C2CSubmission | null> {
  try {
    const result = await db.send(
      new GetCommand({ TableName: TABLE.C2C_SUBMISSIONS, Key: { submissionId } })
    );
    return (result.Item as C2CSubmission) ?? null;
  } catch {
    return null;
  }
}
