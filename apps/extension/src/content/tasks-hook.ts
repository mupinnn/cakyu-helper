import {
  UNFINISHED_TASKS_MESSAGE,
  UNFINISHED_TASKS_STASH_ID,
  isUnfinishedTask,
  parseUnfinishedTasks,
  type UnfinishedTask,
} from "../shared/deadline.ts";

const xhrUrls = new WeakMap<XMLHttpRequest, string>();

function install(): void {
  const marker = window as Window & { __cakyuTasksHook?: boolean };
  if (marker.__cakyuTasksHook) return;
  marker.__cakyuTasksHook = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init);
    const url = requestUrl(input);
    if (url.includes("unfinished-task")) {
      void response
        .clone()
        .json()
        .then((payload) => {
          const tasks = parseUnfinishedTasks(payload);
          if (tasks) publish(tasks);
        })
        .catch(() => undefined);
    }
    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open as (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null,
  ) => void;
  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null,
  ): void {
    xhrUrls.set(this, String(url));
    if (async === undefined) {
      originalOpen.call(this, method, url);
      return;
    }
    originalOpen.call(this, method, url, async, username, password);
  };

  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (
    this: XMLHttpRequest,
    ...args: Parameters<XMLHttpRequest["send"]>
  ) {
    this.addEventListener("load", () => {
      const url = xhrUrls.get(this) ?? "";
      if (!url.includes("unfinished-task")) return;
      try {
        const tasks = parseUnfinishedTasks(readXhrBody(this));
        if (tasks) publish(tasks);
      } catch {
        return;
      }
    });
    return originalSend.apply(this, args);
  };
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function readXhrBody(xhr: XMLHttpRequest): unknown {
  if (xhr.responseType === "json") return xhr.response;
  if (xhr.responseType === "" || xhr.responseType === "text") {
    return JSON.parse(xhr.responseText);
  }
  return null;
}

function publish(tasks: UnfinishedTask[]): void {
  const parent = document.documentElement ?? document.head;
  if (!parent) return;

  let stash = document.getElementById(UNFINISHED_TASKS_STASH_ID);
  if (!stash) {
    const script = document.createElement("script");
    script.id = UNFINISHED_TASKS_STASH_ID;
    script.type = "application/json";
    parent.append(script);
    stash = script;
  }

  const merged = new Map<string, UnfinishedTask>();
  try {
    const current: unknown = JSON.parse(stash.textContent || "[]");
    if (Array.isArray(current)) {
      for (const item of current) {
        if (!isUnfinishedTask(item)) continue;
        merged.set(item.id, item);
      }
    }
  } catch {
    merged.clear();
  }
  for (const task of tasks) merged.set(task.id, task);
  stash.textContent = JSON.stringify([...merged.values()]);

  window.postMessage(
    { source: "cakyu-helper", type: UNFINISHED_TASKS_MESSAGE },
    "*",
  );
}

install();
