import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseTimeRange(rangeStr: string) {
  // Matches: "18:15 - 20:00 WIB" (allows different dash chars/spaces)
  const re =
    /^\s*(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})\s*([A-Za-z/_+-]+)?\s*$/;
  const m = rangeStr.match(re);
  if (!m) return null;

  const [, start, end, tz] = m;
  const [startHour, startMinute] = start.split(":");
  const [endHour, endMinute] = end.split(":");

  return {
    start: { hour: startHour, minute: startMinute },
    end: { hour: endHour, minute: endMinute },
    timezone: tz ?? null,
  };
}
