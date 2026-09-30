import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getEventById } from "@/lib/events";
import { validateC2CForm, createC2CSubmission } from "@/lib/c2c";
import { getWhatsAppMessage, generateWhatsAppURL } from "@/lib/whatsapp";
import type { C2CFormData } from "@/types";

export async function POST(request: NextRequest) {
  // 1. Authenticate — memberId, name always from session
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ success: false, error: "Unauthenticated." }, { status: 401 });
  }

  // 2. Parse body
  let body: { eventId?: string } & Partial<C2CFormData>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const { eventId, roomNumber, year, section, crName, crPhone } = body;

  if (!eventId) {
    return Response.json({ success: false, error: "eventId is required." }, { status: 400 });
  }

  // 3. Validate form data (server-side — never trust client)
  const formData: C2CFormData = {
    roomNumber: roomNumber ?? "",
    year:       year       as C2CFormData["year"] ?? "" as unknown as C2CFormData["year"],
    section:    section    ?? "",
    crName:     crName     ?? "",
    crPhone:    crPhone    ?? "",
  };

  const { valid, errors } = validateC2CForm(formData);
  if (!valid) {
    return Response.json({ success: false, error: "Validation failed.", errors }, { status: 422 });
  }

  // 4. Verify event exists and is visible
  const event = await getEventById(eventId);
  if (!event) {
    return Response.json(
      { success: false, error: "Event not found or no longer available." },
      { status: 404 }
    );
  }

  // 5. Create submission in sbg-c2c-submissions
  //    Each call generates a fresh UUID — unlimited submissions per user are allowed.
  const submission = await createC2CSubmission(user, eventId, formData);

  // 6. Read event-specific WhatsApp message — must come from event.messageToCR
  const message = getWhatsAppMessage(event);
  if (!message) {
    return Response.json(
      {
        success: false,
        error:
          `This event does not have a CR message configured (messageToCR is missing on event "${event.name}"). ` +
          "Please contact the event organiser to add it before promoting.",
      },
      { status: 422 }
    );
  }

  // 7. Build WhatsApp URL — message is event.messageToCR, URL-encoded by generateWhatsAppURL
  const whatsappUrl = generateWhatsAppURL(submission.crPhone, message);

  return Response.json({
    success: true,
    data: {
      submissionId: submission.submissionId,
      whatsappUrl,
      message,
    },
  });
}
