import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getEventById } from "@/lib/events";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ success: false, error: "Unauthenticated." }, { status: 401 });
  }

  const { eventId } = await params;

  if (!eventId) {
    return Response.json({ success: false, error: "Event ID is required." }, { status: 400 });
  }

  try {
    const event = await getEventById(eventId);
    if (!event) {
      return Response.json(
        { success: false, error: "Event not found or no longer available." },
        { status: 404 }
      );
    }
    return Response.json({ success: true, data: event });
  } catch (err) {
    console.error("[api/events/[eventId]] Failed to fetch event:", err);
    return Response.json(
      { success: false, error: "Failed to load event." },
      { status: 500 }
    );
  }
}
