/**
 * Transforms raw Prisma match data into the format expected by the frontend.
 *
 * Backend fields → Frontend fields:
 *  - scheduledDate → date (ISO string)
 *  - scheduledTime → startTime (HH:MM)
 *  - (calculated)  → endTime (HH:MM)
 *  - confirmedCount → currentPlayers
 *  - notes → description
 */
export function formatMatch(match: Record<string, unknown>): Record<string, unknown> {
  const {
    scheduledDate,
    scheduledTime,
    durationMinutes,
    confirmedCount,
    notes,
    ...rest
  } = match;

  // Calculate endTime from startTime + durationMinutes
  const startTime = scheduledTime as string;
  let endTime = startTime;
  if (startTime && durationMinutes) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (durationMinutes as number);
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMins = totalMinutes % 60;
    endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
  }

  return {
    ...rest,
    date: scheduledDate instanceof Date ? scheduledDate.toISOString() : scheduledDate,
    startTime,
    endTime,
    currentPlayers: confirmedCount,
    description: notes ?? null,
    pricePerPlayer: null, // Not in schema yet, but frontend expects it
  };
}

export function formatMatches(matches: Record<string, unknown>[]): Record<string, unknown>[] {
  return matches.map(formatMatch);
}
