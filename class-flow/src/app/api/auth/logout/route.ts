import { deleteSession } from "@/lib/auth";

export async function POST() {
  try {
    await deleteSession();
    return Response.json({ success: true, message: "Logged out successfully." });
  } catch (err) {
    console.error("[api/auth/logout] Unexpected error:", err);
    return Response.json(
      { success: false, error: "Logout failed." },
      { status: 500 }
    );
  }
}
