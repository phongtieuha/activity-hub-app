import { DateTime } from "luxon";

export const DATE_FORMAT = "dd LLL yyyy";
export const DATE_TIME_FORMAT = "dd LLL yyyy hh':'mm a";
export const DATE_FULL_FORMAT = "dd LLLL yyyy";
export const DATEPICKER_FORMAT = "yyyy-LL-dd";

export function formatDate(date: string) {
  return DateTime.fromISO(date).setZone("Asia/Singapore").toFormat(DATE_FORMAT);
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

export function formatMonth(date: string): string {
  return DateTime.fromISO(date)
    .setZone("Asia/Singapore")
    .toFormat("MMM")
    .toUpperCase();
}

export function formatTime(date: string): string {
  return DateTime.fromISO(date).setZone("Asia/Singapore").toFormat("hh:mm a");
}

export function differenceInHours(d1: DateTime, d2: DateTime): string {
  const diff = d2.diff(d1, ["hours", "minutes", "seconds"]).toObject();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const intMinutes = diff.minutes !== undefined ? Math.floor(diff.minutes) : 0;
  const intSeconds = diff.seconds !== undefined ? Math.floor(diff.seconds) : 0;
  const diffStr = `${pad(diff.hours ?? 0)}:${pad(intMinutes)}:${pad(
    intSeconds
  )}`;

  return diffStr;
}
