// ─────────────────────────────────────────────────────────────────────────────
// DynamoDB Client – Server-side ONLY
// Never import this in client components or expose to the browser.
// ─────────────────────────────────────────────────────────────────────────────
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "ap-south-1",
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          ...(process.env.AWS_SESSION_TOKEN
            ? { sessionToken: process.env.AWS_SESSION_TOKEN }
            : {}),
        }
      : undefined, // falls back to IAM role / instance profile in production
});

export const db = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

/** Shared DynamoDB table names — match Internal Dashboard production tables. */
export const TABLE = {
  EVENTS:          process.env.DYNAMODB_EVENTS_TABLE          ?? "sbg-events",
  MEMBERS:         process.env.DYNAMODB_MEMBERS_TABLE         ?? "sbg-members",
  SESSIONS:        process.env.DYNAMODB_SESSIONS_TABLE        ?? "sbg-sessions",
  OTPS:            process.env.DYNAMODB_OTPS_TABLE            ?? "sbg-otps",
  C2C_SUBMISSIONS: process.env.DYNAMODB_C2C_SUBMISSIONS_TABLE ?? "sbg-c2c-submissions",
} as const;

/** GSI names — adjust if Internal Dashboard uses different names. */
export const INDEX = {
  /** sbg-events: status(HASH) + date(RANGE) */
  STATUS_DATE:    "StatusDateIndex",
  /** sbg-members: officialEmail lookup */
  MEMBER_EMAIL:   process.env.DYNAMODB_MEMBERS_EMAIL_INDEX ?? "OfficialEmailIndex",
  /** sbg-c2c-submissions: duplicate check per user per event */
  EVENT_MEMBER:   "EventMemberIndex",
  /** sbg-c2c-submissions: all submissions for an event */
  EVENT_SUBMITTED:"EventIndex",
  /** sbg-c2c-submissions: all submissions by a member */
  MEMBER_INDEX:   "MemberIndex",
} as const;
