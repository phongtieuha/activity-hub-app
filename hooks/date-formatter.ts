import { DateTime } from "luxon";

/**
 * Groups activities by all the single dates between startDate and endDate (inclusive),
 * then orders the groups by date key ascending.
 */
export function groupActivitiesByDateRangeOrdered<
  T extends { startDate?: string; endDate?: string }
>(scheduledActivities: T[]): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  scheduledActivities.forEach((activity) => {
    const startDate = activity.startDate!.split("T")[0];
    const endDate = activity.endDate!.split("T")[0];

    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      const dateKey = currentDate.toISOString().split("T")[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(activity);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });
  const ordered = Object.entries(grouped)
    .sort(
      ([dateA], [dateB]) =>
        new Date(dateA).getTime() - new Date(dateB).getTime()
    )
    .reduce((acc, [date, activities]) => {
      acc[date] = activities;
      return acc;
    }, {} as Record<string, T[]>);
  return ordered;
}

export const DATE_FORMAT = "dd LLL yyyy";
export const DATE_TIME_FORMAT = "dd LLL yyyy hh':'mm a";
export const DATE_FULL_FORMAT = "dd LLLL yyyy";
export const DATEPICKER_FORMAT = "yyyy-LL-dd";

export function formatDate(date: string) {
  return DateTime.fromISO(date).setZone("Asia/Singapore").toFormat(DATE_FORMAT);
}

export function formatShortDate(date: string) {
  return DateTime.fromISO(date).setZone("Asia/Singapore").toFormat("dd LLL");
}

export function formatDateTime(date: string) {
  return DateTime.fromISO(date)
    .setZone("Asia/Singapore")
    .toFormat(DATE_TIME_FORMAT);
}

export function toLuxon(date: string) {
  return DateTime.fromISO(date);
}

export function formatFullDate(date: string): string {
  return DateTime.fromISO(date).toFormat(DATE_FULL_FORMAT);
}

export function formatDatePicker(date: Date): string {
  return DateTime.fromJSDate(date)
    .setZone("Asia/Singapore")
    .toFormat(DATEPICKER_FORMAT);
}

export function getSGTDate(value: string): DateTime {
  return DateTime.fromISO(value, { zone: "Asia/Singapore" });
}

export function getCurrentSGTDate(): DateTime {
  return DateTime.now().setZone("Asia/Singapore");
}

export function formatDay(date: string): string {
  return DateTime.fromISO(date)
    .setZone("Asia/Singapore")
    .toFormat("dd")
    .toUpperCase();
}

export function formatDayInWord(date: string): string {
  return DateTime.fromISO(date)
    .setZone("Asia/Singapore")
    .toFormat("ccc")
    .toUpperCase();
}

export function formatDayInFullWord(date: string): string {
  return DateTime.fromISO(date)
    .setZone("Asia/Singapore")
    .toFormat("cccc")
    .toUpperCase();
}

export function formatMonth(date: string): string {
  return DateTime.fromISO(date)
    .setZone("Asia/Singapore")
    .toFormat("MMM")
    .toUpperCase();
}

export function formatTime(date: string): string {
  return DateTime.fromISO(date).setZone("Asia/Singapore").toFormat("hh:mm a");
}

export function formatSlotTime(date: string): string {
  return DateTime.fromISO(date).setZone("Asia/Singapore").toFormat("hh:mm a");
}

export function differenceInHours(d1: DateTime, d2: DateTime): string {
  console.log(
    d1.setZone("Asia/Singapore").toFormat(DATE_TIME_FORMAT),
    d2.setZone("Asia/Singapore").toFormat(DATE_TIME_FORMAT)
  );

  const diff = d2.diff(d1, ["hours", "minutes", "seconds"]).toObject();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const intMinutes = diff.minutes !== undefined ? Math.floor(diff.minutes) : 0;
  const intSeconds = diff.seconds !== undefined ? Math.floor(diff.seconds) : 0;
  const diffStr = `${pad(diff.hours ?? 0)}:${pad(intMinutes)}:${pad(
    intSeconds
  )}`;

  return diffStr;
}

/**
 * Compares two dates and returns appropriate time display:
 * - If event has passed (any date): returns "NOW"
 * - If on the same date and time hasn't passed: returns "XH" (hours remaining)
 * - If not on the same date and in future: returns "XD" (days remaining)
 */
export function getTimeUntilEvent(
  eventDate: DateTime,
  currentDate: DateTime
): string {
  // Ensure both dates are in Singapore timezone
  const eventSGT = eventDate.setZone("Asia/Singapore");
  const currentSGT = currentDate.setZone("Asia/Singapore");

  // Check if event has passed (regardless of date)
  if (eventSGT <= currentSGT) {
    return "NOW";
  }

  // Check if they're on the same date
  const sameDate = eventSGT.hasSame(currentSGT, "day");

  if (sameDate) {
    // Event is later today - return hours
    const hoursDiff = Math.ceil(eventSGT.diff(currentSGT, "hours").hours);
    return `IN ${hoursDiff}H`;
  } else {
    // Different dates - return days
    const daysDiff = Math.ceil(eventSGT.diff(currentSGT, "days").days);
    return `IN ${daysDiff}D`;
  }
}
