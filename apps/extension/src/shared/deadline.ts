export const UNFINISHED_TASKS_STASH_ID = "cakyu-unfinished-tasks";

export const UNFINISHED_TASKS_MESSAGE = "cakyu-helper:unfinished-tasks";

export const DEADLINE_TIME_ZONE = "Asia/Jakarta";

const RISE_ORIGIN = "https://rise.cakrawala.ac.id";

const EVENT_LENGTH_MS = 30 * 60 * 1000;

export type UnfinishedTask = {
  id: string;
  className: string;
  title: string;
  description: string;
  endDate: string;
};

export function isUnfinishedTask(value: unknown): value is UnfinishedTask {
  if (!value || typeof value !== "object") return false;
  const task = value as Record<string, unknown>;
  return (
    typeof task.id === "string" &&
    typeof task.className === "string" &&
    typeof task.title === "string" &&
    typeof task.description === "string" &&
    typeof task.endDate === "string"
  );
}

export function parseUnfinishedTasks(payload: unknown): UnfinishedTask[] | null {
  if (!payload || typeof payload !== "object") return null;
  const envelope = payload as { data?: unknown };
  if (!envelope.data || typeof envelope.data !== "object") return null;
  const page = envelope.data as { data?: unknown };
  if (!Array.isArray(page.data)) return null;

  const tasks: UnfinishedTask[] = [];
  for (const row of page.data) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    if (
      typeof item.id !== "string" ||
      typeof item.class_name !== "string" ||
      typeof item.title !== "string" ||
      typeof item.end_date !== "string"
    ) {
      continue;
    }
    tasks.push({
      id: item.id,
      className: item.class_name,
      title: item.title,
      description: typeof item.description === "string" ? item.description : "",
      endDate: item.end_date,
    });
  }
  return tasks;
}

export function deadlineTitle(task: UnfinishedTask): string {
  return `[DL] ${task.className} — ${task.title}`;
}

export function calendarTemplateUrl(
  task: UnfinishedTask,
  href: string,
): string | null {
  const start = new Date(task.endDate);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + EVENT_LENGTH_MS);
  const startStamp = formatCalendarStamp(start);
  const endStamp = formatCalendarStamp(end);
  if (!startStamp || !endStamp) return null;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: deadlineTitle(task),
    dates: `${startStamp}/${endStamp}`,
    ctz: DEADLINE_TIME_ZONE,
    details: calendarDetails(task, href),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function calendarDetails(task: UnfinishedTask, href: string): string {
  const link = new URL(href, RISE_ORIGIN).href;
  const description = task.description.trim();
  return description ? `${description}\n\n${link}` : link;
}

function formatCalendarStamp(date: Date): string | null {
  const parts = zonedParts(date, DEADLINE_TIME_ZONE);
  if (!parts) return null;
  return `${parts.year}${parts.month}${parts.day}T${parts.hour}${parts.minute}${parts.second}`;
}

function zonedParts(
  date: Date,
  timeZone: string,
): {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
} | null {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const picked: Record<string, string> = {};
  for (const part of formatted) {
    if (part.type === "literal") continue;
    picked[part.type] = part.value;
  }

  const year = picked.year;
  const month = picked.month;
  const day = picked.day;
  let hour = picked.hour;
  const minute = picked.minute;
  const second = picked.second;
  if (!year || !month || !day || !hour || !minute || !second) return null;

  if (hour === "24") {
    hour = "00";
    const next = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + 1));
    return {
      year: String(next.getUTCFullYear()),
      month: String(next.getUTCMonth() + 1).padStart(2, "0"),
      day: String(next.getUTCDate()).padStart(2, "0"),
      hour,
      minute,
      second,
    };
  }

  return { year, month, day, hour, minute, second };
}
