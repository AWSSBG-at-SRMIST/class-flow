// ─────────────────────────────────────────────────────────────────────────────
// Auth Library – mirrors Internal Dashboard authentication exactly.
// Uses sbg-otps, sbg-members, sbg-sessions, sbg_session cookie.
// ─────────────────────────────────────────────────────────────────────────────
import crypto from "crypto";
import { cookies } from "next/headers";
import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import nodemailer from "nodemailer";
import { db, TABLE, INDEX } from "./dynamodb";
import type { Member, SessionUser, SessionRecord, OTPRecord } from "@/types";

// ── Constants ────────────────────────────────────────────────────────────────
const COOKIE_NAME        = "sbg_session";
const SESSION_TTL_HOURS  = 24 * 7; // 7 days
const OTP_TTL_MINUTES    = 10;
const MAX_OTP_ATTEMPTS   = 5;
const LOCKOUT_MINUTES    = 15;

// ── Helpers ──────────────────────────────────────────────────────────────────
function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function generateOTP(): string {
  return String(crypto.randomInt(100000, 999999));
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function nowISO(): string {
  return new Date().toISOString();
}

function expiresISO(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

/** Unix epoch seconds — required for DynamoDB TTL attribute (must be a Number, not a string). */
function epochSeconds(minutes: number): number {
  return Math.floor(Date.now() / 1000) + minutes * 60;
}

// ── Email transport (Nodemailer) ──────────────────────────────────────────────
function getTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ── Member lookup ─────────────────────────────────────────────────────────────
/**
 * Look up a member by officialEmail.
 * Requires a GSI named OfficialEmailIndex (or DYNAMODB_MEMBERS_EMAIL_INDEX)
 * with officialEmail as the HASH key.
 */
export async function getMemberByEmail(
  email: string
): Promise<Member | null> {
  try {
    const result = await db.send(
      new QueryCommand({
        TableName:                 TABLE.MEMBERS,
        IndexName:                 INDEX.MEMBER_EMAIL,
        KeyConditionExpression:    "officialEmail = :email",
        ExpressionAttributeValues: { ":email": email },
        Limit:                     1,
      })
    );
    if (!result.Items || result.Items.length === 0) return null;
    return result.Items[0] as Member;
  } catch {
    // Fallback: try GetItem if officialEmail happens to be the PK
    // (remove this branch if your table has a confirmed GSI)
    return null;
  }
}

// ── OTP: send ─────────────────────────────────────────────────────────────────
export async function sendOTP(email: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[auth:sendOTP] Attempting for email=${email}`);

  // 1. Validate that the member exists and is active
  const member = await getMemberByEmail(email);
  if (!member) {
    console.warn(`[auth:sendOTP] No member found for email=${email}`);
    return { success: false, error: "No SBG member found with this email address." };
  }
  if (!member.isActive) {
    console.warn(`[auth:sendOTP] Member inactive: memberId=${member.memberId}`);
    return { success: false, error: "Your SBG membership is inactive. Contact Presidium." };
  }
  console.log(`[auth:sendOTP] Member found: memberId=${member.memberId}`);

  // 2. Check if currently locked out
  const existing = await getOTPRecord(email);
  if (existing?.lockedUntil && new Date(existing.lockedUntil) > new Date()) {
    const remaining = Math.ceil(
      (new Date(existing.lockedUntil).getTime() - Date.now()) / 60000
    );
    return {
      success: false,
      error:   `Too many attempts. Please wait ${remaining} minute(s) before requesting a new OTP.`,
    };
  }

  // 3. Generate & hash OTP
  const otp    = generateOTP();
  const hashed = hashOTP(otp);

  // 4. Store in sbg-otps (overwrite any existing record for this email)
  //    ttl field uses Unix epoch seconds — required for DynamoDB TTL feature.
  try {
    await db.send(
      new PutCommand({
        TableName: TABLE.OTPS,
        Item: {
          email,
          hashedOtp:  hashed,
          expiresAt:  expiresISO(OTP_TTL_MINUTES),   // human-readable (for display)
          ttl:        epochSeconds(OTP_TTL_MINUTES),  // numeric epoch for DynamoDB TTL
          attempts:   0,
          createdAt:  nowISO(),
        } satisfies OTPRecord,
      })
    );
    console.log(`[auth:sendOTP] OTP stored in ${TABLE.OTPS} for email=${email}`);
  } catch (err) {
    console.error(
      `[auth:sendOTP] FAILED to write OTP to DynamoDB table "${TABLE.OTPS}":`,
      err
    );
    return {
      success: false,
      error:
        "Could not save OTP. Check that the \"" +
        TABLE.OTPS +
        "\" DynamoDB table exists and your AWS credentials are correct.",
    };
  }

  // 5. Send email
  try {
    const transport = getTransport();
    await transport.sendMail({
      from:    `"AWS SBG Class Flow" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
      to:      email,
      subject: "Your AWS SBG C2C Tracker OTP",
      html: `
        <div style="font-family:monospace;background:#050505;color:#f0f0f0;padding:32px;border-radius:4px;max-width:480px;margin:0 auto;border:1px solid #1a1a1a;">
          <div style="color:#FF9900;font-size:20px;font-weight:700;margin-bottom:16px;">▸ AWS SBG — C2C Tracker</div>
          <p style="margin:0 0 24px;color:#888;">Your one-time password for C2C Tracker login:</p>
          <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#FF9900;background:#0d0d0d;padding:20px;text-align:center;border:1px solid #2d2d2d;">${otp}</div>
          <p style="margin:20px 0 0;color:#555;font-size:12px;">This OTP expires in ${OTP_TTL_MINUTES} minutes. Do not share it with anyone.</p>
        </div>
      `,
    });
    console.log(`[auth:sendOTP] Email sent to ${email}`);
  } catch (err) {
    console.error("[auth:sendOTP] Failed to send OTP email:", err);
    return { success: false, error: "Failed to send OTP email. Please try again." };
  }

  return { success: true };
}

// ── OTP: get record ───────────────────────────────────────────────────────────
async function getOTPRecord(email: string): Promise<OTPRecord | null> {
  try {
    const result = await db.send(
      new GetCommand({ TableName: TABLE.OTPS, Key: { email } })
    );
    const record = (result.Item as OTPRecord) ?? null;
    console.log(
      `[auth:getOTPRecord] email=${email} found=${record !== null}`
    );
    return record;
  } catch (err) {
    console.error(
      `[auth:getOTPRecord] DynamoDB error for table="${TABLE.OTPS}" email=${email}:`,
      err
    );
    // Re-throw so callers (sendOTP, verifyOTP) can handle it explicitly.
    throw err;
  }
}

// ── OTP: verify ───────────────────────────────────────────────────────────────
export async function verifyOTP(
  email: string,
  otp: string
): Promise<{ success: boolean; member?: Member; error?: string }> {
  console.log(`[auth:verifyOTP] Attempting for email=${email}`);

  let record: OTPRecord | null;
  try {
    record = await getOTPRecord(email);
  } catch (err) {
    console.error(`[auth:verifyOTP] Failed to read OTP from DynamoDB:`, err);
    return {
      success: false,
      error:
        `Could not read OTP records. Ensure the "${TABLE.OTPS}" table exists ` +
        `and AWS credentials are correctly configured.`,
    };
  }

  if (!record) {
    console.warn(`[auth:verifyOTP] No OTP record found for email=${email}`);
    return { success: false, error: "No OTP found for this email. Please request a new one." };
  }

  // Lockout check
  if (record.lockedUntil && new Date(record.lockedUntil) > new Date()) {
    const remaining = Math.ceil(
      (new Date(record.lockedUntil).getTime() - Date.now()) / 60000
    );
    return {
      success: false,
      error:   `Too many failed attempts. Account locked for ${remaining} more minute(s).`,
    };
  }

  // Expiry check
  if (new Date(record.expiresAt) < new Date()) {
    await db.send(new DeleteCommand({ TableName: TABLE.OTPS, Key: { email } }));
    return { success: false, error: "OTP has expired. Please request a new one." };
  }

  // Hash comparison
  const inputHash = hashOTP(otp.trim());
  if (inputHash !== record.hashedOtp) {
    const newAttempts = (record.attempts ?? 0) + 1;
    const shouldLock  = newAttempts >= MAX_OTP_ATTEMPTS;

    await db.send(
      new PutCommand({
        TableName: TABLE.OTPS,
        Item: {
          ...record,
          attempts:    newAttempts,
          ...(shouldLock
            ? { lockedUntil: expiresISO(LOCKOUT_MINUTES) }
            : {}),
        },
      })
    );

    if (shouldLock) {
      return {
        success: false,
        error:   `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`,
      };
    }

    const remaining = MAX_OTP_ATTEMPTS - newAttempts;
    return {
      success: false,
      error:   `Invalid OTP. ${remaining} attempt(s) remaining.`,
    };
  }

  // ✅ OTP correct — clean up
  await db.send(new DeleteCommand({ TableName: TABLE.OTPS, Key: { email } }));

  const member = await getMemberByEmail(email);
  if (!member || !member.isActive) {
    return { success: false, error: "Member account is inactive." };
  }

  return { success: true, member };
}

// ── Session: create ───────────────────────────────────────────────────────────
export async function createSession(member: Member): Promise<string> {
  const token     = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  const sessionRecord: SessionRecord = {
    sessionToken:  token,
    memberId:      member.memberId,
    name:          member.name,
    role:          member.role,
    domain:        member.domain,
    subdomain:     member.subdomain,
    officialEmail: member.officialEmail,
    isActive:      member.isActive,
    createdAt:     nowISO(),
    expiresAt:     expiresAt.toISOString(),
  };

  await db.send(new PutCommand({ TableName: TABLE.SESSIONS, Item: sessionRecord }));

  // Set the HttpOnly cookie
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly:  true,
    secure:    process.env.NODE_ENV === "production",
    sameSite:  "lax",
    path:      "/",
    expires:   expiresAt,
    // In production, scope to root domain for cross-subdomain SSO:
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
  });

  return token;
}

// ── Session: get current user ─────────────────────────────────────────────────
/**
 * Reads sbg_session cookie, validates against sbg-sessions, returns SessionUser.
 * Returns null if unauthenticated or session is expired.
 * Call this in every Route Handler and Server Component that needs auth.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token       = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  return getSessionByToken(token);
}

export async function getSessionByToken(token: string): Promise<SessionUser | null> {
  try {
    const result = await db.send(
      new GetCommand({ TableName: TABLE.SESSIONS, Key: { sessionToken: token } })
    );
    if (!result.Item) return null;

    const session = result.Item as SessionRecord;

    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
      // Optionally delete expired session (fire-and-forget)
      db.send(
        new DeleteCommand({ TableName: TABLE.SESSIONS, Key: { sessionToken: token } })
      ).catch(() => {});
      return null;
    }

    if (!session.isActive) return null;

    return {
      memberId:      session.memberId,
      name:          session.name,
      role:          session.role,
      domain:        session.domain,
      subdomain:     session.subdomain,
      officialEmail: session.officialEmail,
      isActive:      session.isActive,
    };
  } catch {
    return null;
  }
}

// ── Session: delete (logout) ──────────────────────────────────────────────────
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token       = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    await db.send(
      new DeleteCommand({ TableName: TABLE.SESSIONS, Key: { sessionToken: token } })
    ).catch(() => {});
  }

  cookieStore.delete(COOKIE_NAME);
}
