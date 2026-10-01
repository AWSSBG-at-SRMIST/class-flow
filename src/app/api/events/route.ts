import { getCurrentUser } from "@/lib/auth";
import { getUpcomingEvents } from "@/lib/events";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ success: false, error: "Unauthenticated." }, { status: 401 });
  }

  try {
    const events = await getUpcomingEvents();
    return Response.json({ success: true, data: events });
  } catch (err) {
    console.error("[api/events] Failed to fetch events:", err);
    return Response.json(
      { success: false, error: "Failed to load events." },
      { status: 500 }
    );
  }
}
