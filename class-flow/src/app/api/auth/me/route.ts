import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ success: false, error: "Unauthenticated." }, { status: 401 });
  }
  return Response.json({ success: true, data: user });
}
