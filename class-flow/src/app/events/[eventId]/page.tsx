import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEventById, formatEventDate } from "@/lib/events";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";

type Props = { params: Promise<{ eventId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getEventById(eventId);
  return {
    title: event ? `${event.name} — C2C Tracker` : "Event — C2C Tracker",
  };
}

export default async function EventDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { eventId } = await params;
  const event = await getEventById(eventId);
  if (!event) notFound();

  const mode = event.mode ?? "TBD";
  const modeColor =
    mode === "ONLINE"  ? "text-[#00c851]" :
    mode === "OFFLINE" ? "text-[#FF9900]" :
                         "text-[#888]";

  return (
    <div className="flex-1 flex flex-col min-h-svh">
      <PageHeader
        userName={user.name}
        showBack
        backHref="/dashboard"
        backLabel="All Events"
      />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="animate-fade-in">
          {/* Status + name */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              {event.status === "LIVE" ? (
                <Badge variant="live">Live Now</Badge>
              ) : (
                <Badge variant="primary">Upcoming</Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#f0f0f0] leading-tight">
              {event.name}
            </h1>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-[#1a1a1a] border border-[#1a1a1a] mb-6">
            {[
              { label: "Date",  value: formatEventDate(event.date) },
              { label: "Mode",  value: mode, extra: modeColor },
              { label: "Venue", value: event.venue ?? "TBD" },
            ].map(({ label, value, extra }) => (
              <div key={label} className="bg-[#0d0d0d] px-4 py-4">
                <dt className="text-[#555] text-[10px] uppercase tracking-widest font-mono mb-1">
                  {label}
                </dt>
                <dd className={`text-sm font-mono font-bold ${extra ?? "text-[#f0f0f0]"}`}>
                  {value}
                </dd>
              </div>
            ))}
          </div>

          {/* Description */}
          {event.description && (
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-5 mb-6">
              <h2 className="text-[#555] text-xs uppercase tracking-widest font-mono mb-3">
                About This Event
              </h2>
              <p className="text-[#888] text-sm leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-[#1a1a1a] my-6" />

          {/* CTA section */}
          <div className="bg-[rgba(255,153,0,0.04)] border border-[rgba(255,153,0,0.15)] p-6">
            <h2 className="text-[#f0f0f0] font-bold text-lg mb-1">
              Promote to your class
            </h2>
            <p className="text-[#555] text-sm font-mono mb-4">
              Fill in the C2C form to generate a WhatsApp message for your Class Representative.
            </p>
            <Link
              href={`/events/${event.eventId}/c2c`}
              className="inline-flex items-center gap-2 bg-[#FF9900] text-[#050505] font-bold font-mono px-6 py-3 text-sm transition-all duration-150 hover:bg-[#e68900] hover:shadow-[0_0_0_3px_rgba(255,153,0,0.2)]"
              aria-label={`Promote ${event.name} to your class`}
            >
              Promote This Event →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
