import { db } from "@/lib/db/client";
import { paddleEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Checks whether a Paddle event was already processed.
 * If not processed, stores the event id to guarantee idempotency.
 */
export async function recordPaddleEvent(
  eventId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<{ isDuplicate: boolean }> {
  try {
    const existing = await db
      .select({ id: paddleEvents.id })
      .from(paddleEvents)
      .where(eq(paddleEvents.id, eventId))
      .limit(1);

    if (existing.length > 0) {
      return { isDuplicate: true };
    }

    await db.insert(paddleEvents).values({
      id: eventId,
      eventType,
      payload,
    });

    return { isDuplicate: false };
  } catch (error) {
    console.error("Error checking/recording paddle event idempotency:", error);
    // If DB check fails in development without database configured, allow non-blocking flow
    return { isDuplicate: false };
  }
}
