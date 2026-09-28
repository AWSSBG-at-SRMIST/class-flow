import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUpcomingEvents, formatEventDate } from "@/lib/events";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import type { Event } from "@/types";

export const metadata: Metadata = { title: "Dashboard — C2C Tracker" };

function EventCard({ event }: { event: Event }) {
  const mode = event.mode ?? "TBD";
  const modeStyle =
    mode === "ONLINE"  ? "bg-[rgba(0,200,81,0.08)] text-[#00c851]" :
    mode === "OFFLINE" ? "bg-[rgba(255,153,0,0.08)] text-[#FF9900]" :
                         "bg-[rgba(136,136,136,0.08)] text-[#888]";

  return (
    <Link
      href={`/events/${event.eventId}`}
      className="group block bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[#FF9900] hover:shadow-[0_0_0_1px_rgba(255,153,0,0.1)] transition-all duration-200"
      aria-label={`View ${event.name}`}
    >
      {/* Orange top accent */}
      <div className="h-0.5 bg-[#FF9900] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-[#f0f0f0] font-bold text-base leading-tight group-hover:text-[#FF9900] transition-colors duration-150">
            {event.name}
          </h2>
          {event.status === "LIVE" ? (
            <Badge variant="live">LIVE</Badge>
          ) : (
            <Badge variant="primary">PUBLISHED</Badge>
          )}
        </div>

        {/* Meta */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono mb-4">
          <div>
            <dt className="text-[#555] uppercase tracking-wider text-[10px]">Date</dt>
            <dd className="text-[#888] mt-0.5">{formatEventDate(event.date)}</dd>
          </div>
          <div>
            <dt className="text-[#555] uppercase tracking-wider text-[10px]">Mode</dt>
            <dd className={`mt-0.5 font-bold text-xs px-1.5 py-0.5 inline-block ${modeStyle}`}>
              {mode}
            </dd>
          </div>
          {event.venue && (
            <div className="col-span-2">
              <dt className="text-[#555] uppercase tracking-wider text-[10px]">Venue</dt>
              <dd className="text-[#888] mt-0.5 truncate">{event.venue}</dd>
            </div>
          )}
        </dl>

        {/* CTA */}
        <div className="flex items-center justify-between border-t border-[#1a1a1a] pt-3">
          <span className="text-[#555] text-xs">Promote to your class</span>
          <span className="text-[#FF9900] text-xs font-bold group-hover:translate-x-1 transition-transform duration-150">
            Promote →
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl mb-4" aria-hidden>📭</div>
      <p className="text-[#555] font-mono text-sm">No upcoming events at this time.</p>
      <p className="text-[#333] font-mono text-xs mt-2">
        Check back later or contact Presidium.
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const events = await getUpcomingEvents();

  return (
    <div className="flex-1 flex flex-col min-h-svh">
      <PageHeader userName={user.name} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8 animate-fade-in">
          <p className="text-[#555] text-xs font-mono uppercase tracking-widest mb-1">
            Welcome back
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f0f0f0]">
            {user.name}
          </h1>
          <p className="text-[#555] text-sm font-mono mt-1">
            {user.domain}
            {user.subdomain ? ` — ${user.subdomain}` : ""}
          </p>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[#f0f0f0] font-bold text-lg">Upcoming Events</h2>
            <p className="text-[#555] text-xs font-mono mt-0.5">
              {events.length === 0
                ? "No events found"
                : `${events.length} event${events.length !== 1 ? "s" : ""} available to promote`}
            </p>
          </div>
          <span className="text-[#333] text-xs font-mono hidden sm:inline">
            {new Date().toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
          </span>
        </div>

        {/* Event grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
          {events.length === 0 ? <EmptyState /> : events.map((event) => (
            <EventCard key={event.eventId} event={event} />
          ))}
        </div>
      </main>
    </div>
  );
}
