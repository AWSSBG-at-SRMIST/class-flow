// ─────────────────────────────────────────────────────────────────────────────
// Events Library – READ ONLY access to sbg-events
// ─────────────────────────────────────────────────────────────────────────────
import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { db, TABLE, INDEX } from "./dynamodb";
import type { Event } from "@/types";

/** Statuses that should be visible in the C2C dashboard. */
const VISIBLE_STATUSES: Event["status"][] = ["PUBLISHED", "LIVE"];

/**
 * Returns upcoming events (date >= today) with a visible status,
 * ordered ascending by date (nearest first).
 */
export async function getUpcomingEvents(): Promise<Event[]> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const events: Event[] = [];

  // Query StatusDateIndex for each visible status
  await Promise.all(
    VISIBLE_STATUSES.map(async (status) => {
      try {
        const result = await db.send(
          new QueryCommand({
            TableName:                 TABLE.EVENTS,
            IndexName:                 INDEX.STATUS_DATE,
            KeyConditionExpression:    "#s = :status AND #d >= :today",
            ExpressionAttributeNames:  { "#s": "status", "#d": "date" },
            ExpressionAttributeValues: {
              ":status": status,
              ":today":  today,
            },
            ScanIndexForward: true, // ascending date
          })
        );
        if (result.Items) {
          events.push(...(result.Items as Event[]));
        }
      } catch (err) {
        console.error(`[events] Failed to query status=${status}:`, err);
      }
    })
  );

  // Sort all results by date ascending (merge of multiple queries)
  events.sort((a, b) => a.date.localeCompare(b.date));

  return events;
}

/**
 * Returns a single event by eventId, or null if not found.
 * Only returns the event if its status is visible to C2C users.
 */
export async function getEventById(eventId: string): Promise<Event | null> {
  try {
    const result = await db.send(
      new GetCommand({ TableName: TABLE.EVENTS, Key: { eventId } })
    );
    if (!result.Item) return null;

    const event = result.Item as Event;

    // Only surface events with a visible status
    if (!VISIBLE_STATUSES.includes(event.status)) return null;

    return event;
  } catch (err) {
    console.error("[events] Failed to get event:", err);
    return null;
  }
}

/** Format a date string for display. */
export function formatEventDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      year:    "numeric",
      month:   "long",
      day:     "numeric",
    });
  } catch {
    return dateStr;
  }
}
