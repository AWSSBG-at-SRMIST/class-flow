import { verifyOTP, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body  = await request.json();
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    const otp   = (body?.otp   ?? "").toString().trim();

    if (!email || !otp) {
      return Response.json(
        { success: false, error: "Email and OTP are required." },
        { status: 400 }
      );
    }

    const result = await verifyOTP(email, otp);

    if (!result.success || !result.member) {
      return Response.json({ success: false, error: result.error }, { status: 401 });
    }

    // Create session and set sbg_session cookie
    await createSession(result.member);

    return Response.json({
      success: true,
      message: "Login successful.",
      user: {
        name:          result.member.name,
        role:          result.member.role,
        officialEmail: result.member.officialEmail,
      },
    });
  } catch (err) {
    console.error("[api/auth/verify-otp] Unexpected error:", err);
    return Response.json(
      { success: false, error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
