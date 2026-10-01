import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEventById, formatEventDate } from "@/lib/events";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { C2CForm } from "@/components/C2CForm";

type Props = { params: Promise<{ eventId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getEventById(eventId);
  return {
    title: event ? `Promote: ${event.name} — C2C Tracker` : "C2C Form — C2C Tracker",
  };
}

export default async function C2CFormPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { eventId } = await params;
  const event = await getEventById(eventId);
  if (!event) notFound();

  return (
    <div className="flex-1 flex flex-col min-h-svh">
      <PageHeader
        userName={user.name}
        showBack
        backHref={`/events/${eventId}`}
        backLabel="Event Details"
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Page title */}
        <div className="mb-6 animate-fade-in">
          <p className="text-[#555] text-xs font-mono uppercase tracking-widest mb-1">
            C2C Submission
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-[#f0f0f0]">
            Promote Event
          </h1>
        </div>

        {/* Event summary card */}
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] border-l-2 border-l-[#FF9900] px-4 py-3 mb-6 animate-slide-in">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[#f0f0f0] font-bold text-sm">{event.name}</p>
              <p className="text-[#555] text-xs font-mono mt-0.5">
                {formatEventDate(event.date)}
                {event.venue ? ` · ${event.venue}` : ""}
              </p>
            </div>
            {event.status === "LIVE" ? (
              <Badge variant="live">Live</Badge>
            ) : (
              <Badge variant="primary">Upcoming</Badge>
            )}
          </div>
        </div>

        {/* The form (client component) */}
        <C2CForm event={event} user={user} />
      </main>
    </div>
  );
}
