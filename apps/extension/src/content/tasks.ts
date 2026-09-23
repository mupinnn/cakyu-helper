import {
  UNFINISHED_TASKS_MESSAGE,
  UNFINISHED_TASKS_STASH_ID,
  calendarTemplateUrl,
  deadlineTitle,
  isUnfinishedTask,
  type UnfinishedTask,
} from "../shared/deadline.ts";

const BUTTON_ATTR = "data-cakyu-deadline";

const BUTTON_STYLE = [
  "display:inline-flex",
  "height:24px",
  "margin-top:4px",
  "padding:2px 8px",
  "align-items:center",
  "justify-content:center",
  "align-self:flex-start",
  "border-radius:6px",
  "border:1px solid #0f766e",
  "background:#fff",
  "color:#0f766e",
  "font-size:12px",
  "font-weight:600",
  "line-height:1",
  "font-family:inherit",
].join(";");

const tasksById = new Map<string, UnfinishedTask>();

const TASK_HREF = /\/assignments\/([0-9a-f-]{36})(?:[/?#]|$)/i;

function taskIdFromHref(href: string): string | null {
  return TASK_HREF.exec(href)?.[1] ?? null;
}

function deadlineRow(anchor: HTMLElement): HTMLElement | null {
  for (const span of anchor.querySelectorAll("span")) {
    const label = (span.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!label.startsWith("Deadline:")) continue;
    const row = span.parentElement?.parentElement;
    if (row instanceof HTMLElement) return row;
  }
  return null;
}

function unfinishedTasksCard(): HTMLElement | null {
  for (const node of document.querySelectorAll("[data-slot='card-title']")) {
    const label = (node.textContent ?? "").replace(/\s+/g, " ").trim();
    if (label !== "Tugas Belum Dikumpulkan") continue;
    const card = node.closest("[data-slot='card']");
    if (card instanceof HTMLElement) return card;
  }
  return null;
}

function syncFromStash(): void {
  const stash = document.getElementById(UNFINISHED_TASKS_STASH_ID);
  if (!stash?.textContent) return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(stash.textContent);
  } catch {
    return;
  }
  if (!Array.isArray(parsed)) return;
  for (const item of parsed) {
    if (!isUnfinishedTask(item)) continue;
    tasksById.set(item.id, item);
  }
}

function onDeadlineClick(event: Event): void {
  event.preventDefault();
  event.stopPropagation();
  const button = event.currentTarget;
  if (!(button instanceof HTMLButtonElement)) return;
  if (button.getAttribute("aria-disabled") === "true") return;

  const anchor = button.closest("a");
  if (!(anchor instanceof HTMLAnchorElement)) return;
  const taskId = button.getAttribute(BUTTON_ATTR);
  const href = anchor.getAttribute("href");
  if (!taskId || !href) return;
  const task = tasksById.get(taskId);
  if (!task) return;
  const url = calendarTemplateUrl(task, href);
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function injectDeadlineButtons(): void {
  syncFromStash();
  const card = unfinishedTasksCard();
  if (!card) return;

  for (const anchor of card.querySelectorAll<HTMLAnchorElement>(
    "a[href*='/assignments/']",
  )) {
    const href = anchor.getAttribute("href") ?? "";
    const taskId = taskIdFromHref(href);
    if (!taskId) continue;

    let button = anchor.querySelector<HTMLButtonElement>(`[${BUTTON_ATTR}]`);
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.setAttribute(BUTTON_ATTR, taskId);
      button.addEventListener("click", onDeadlineClick);
    }
    button.textContent = "+ Kalender";
    button.setAttribute("style", BUTTON_STYLE);

    const row = deadlineRow(anchor);
    if (row) {
      if (button.previousElementSibling !== row) {
        row.insertAdjacentElement("afterend", button);
      }
      const icon = row.querySelector("svg");
      const iconWidth = icon?.getBoundingClientRect().width ?? 0;
      button.style.marginLeft = iconWidth > 0 ? `${Math.round(iconWidth + 4)}px` : "0";
    } else if (button.parentElement !== anchor) {
      anchor.append(button);
    }

    const task = tasksById.get(taskId);
    const ready = Boolean(task && calendarTemplateUrl(task, href));
    button.setAttribute("aria-disabled", ready ? "false" : "true");
    button.style.opacity = ready ? "1" : "0.45";
    button.style.cursor = ready ? "pointer" : "not-allowed";
    button.title = task ? deadlineTitle(task) : "Menunggu data deadline";
  }
}

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.origin !== window.location.origin) return;
  const data = event.data as { source?: unknown; type?: unknown } | null;
  if (!data || data.source !== "cakyu-helper") return;
  if (data.type !== UNFINISHED_TASKS_MESSAGE) return;
  injectDeadlineButtons();
});
