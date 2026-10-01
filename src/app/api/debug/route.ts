// ─────────────────────────────────────────────────────────────────────────────
// DEBUG ONLY — Remove before production deployment
// GET /api/debug?email=as0024@srmist.edu.in
// Checks exactly what getOTPRecord returns for a given email.
// ─────────────────────────────────────────────────────────────────────────────
import type { NextRequest } from "next/server";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { db, TABLE } from "@/lib/dynamodb";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not available in production." }, { status: 403 });
  }

  const email = request.nextUrl.searchParams.get("email") ?? "";
  const normalizedEmail = email.trim().toLowerCase();

  const diagnostics: Record<string, unknown> = {
    inputEmail:      email,
    normalizedEmail: normalizedEmail,
    tableName:       TABLE.OTPS,
    region:          process.env.AWS_REGION ?? "ap-south-1",
    hasCredentials:  !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
  };

  // Attempt the exact same GetItem the auth library does
  try {
    const result = await db.send(
      new GetCommand({
        TableName: TABLE.OTPS,
        Key: { email: normalizedEmail },
      })
    );
    diagnostics.getItemResult   = result.Item ?? null;
    diagnostics.itemFound       = result.Item !== undefined;
    diagnostics.consumedCapacity = result.ConsumedCapacity ?? null;
  } catch (err) {
    diagnostics.getItemError = String(err);
    diagnostics.getItemErrorType = err instanceof Error ? err.constructor.name : typeof err;
  }

  return Response.json(diagnostics);
}
