import {
  parseFbPublicLoadData,
  questionsFromLoadData,
  type ParsedFormQuestion,
} from "../shared/form-data";
import { extractFormId } from "../shared/mapping";
import {
  CUSTOM_LABEL,
  CUSTOM_SOURCE,
  DATA_SOURCES,
  UNMAPPED_LABEL,
  inferSourceFromTitle,
  isMappingSource,
} from "../shared/sources";
import {
  loadMappingsForForm,
  saveFormUrl,
  saveMappingOverride,
} from "../shared/storage";
import type { DataSource, FieldMapping } from "../shared/types";

const PANEL_ID = "cakyu-helper-mapper";
const HIGHLIGHT = "cakyu-helper-q";

function css(): string {
  return `
  :host { all: initial; }
  * { box-sizing: border-box; font-family: Geist, ui-sans-serif, system-ui, sans-serif; }
  .fab {
    position: fixed; right: 16px; bottom: 16px; z-index: 2147483646;
    background: #149FC4; color: #fff; border: 0; border-radius: 999px;
    padding: 10px 14px; font-weight: 650; cursor: pointer;
    box-shadow: 0 8px 24px rgba(15,23,42,.25);
  }
  .panel {
    position: fixed; right: 16px; bottom: 64px; z-index: 2147483646;
    width: min(380px, calc(100vw - 24px)); max-height: min(70vh, 560px);
    overflow: auto; background: #fff; color: #1a202c;
    border-radius: 16px; padding: 14px;
    box-shadow: 0 16px 40px rgba(15,23,42,.3);
  }
  h1 { font-size: 15px; margin: 0 0 8px; }
  p { font-size: 12px; color: #4a5568; margin: 0 0 10px; }
  h2 { font-size: 12px; margin: 10px 0 6px; color: #718096; text-transform: uppercase; letter-spacing: .04em; }
  .row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
  button, select {
    border-radius: 8px; border: 1px solid #cbd5e0; background: #fff;
    padding: 8px 10px; font-size: 13px; cursor: pointer;
  }
  .primary { background: #149FC4; color: #fff; border-color: #149FC4; }
  .item { border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px; margin-bottom: 6px; font-size: 12px; }
  .item.unmapped { border-style: dashed; }
  .item strong { display: block; margin-bottom: 4px; overflow-wrap: anywhere; }
  .item select { width: 100%; margin-top: 4px; }
  .status { font-size: 12px; color: #0f766e; min-height: 16px; }
  .pop {
    position: fixed; z-index: 2147483647; background: #fff; color: #1a202c;
    border-radius: 12px; padding: 10px; min-width: 240px;
    box-shadow: 0 12px 32px rgba(15,23,42,.28);
  }
  `;
}

function questionNodes(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('div[role="listitem"]')];
}

function normalize(value: string): string {
  return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function nodeForQuestion(title: string): HTMLElement | null {
  const needle = normalize(title);
  if (!needle) return null;
  for (const node of questionNodes()) {
    const text = normalize(node.innerText ?? "");
    if (text.includes(needle.slice(0, Math.min(40, needle.length)))) {
      return node;
    }
  }
  return null;
}

function selectedSourceValue(mapping?: FieldMapping): string {
  if (!mapping) return "";
  return mapping.source;
}

function sourceSelect(current?: string): HTMLSelectElement {
  const select = document.createElement("select");
  const unmapped = document.createElement("option");
  unmapped.value = "";
  unmapped.textContent = UNMAPPED_LABEL;
  select.append(unmapped);

  const custom = document.createElement("option");
  custom.value = CUSTOM_SOURCE;
  custom.textContent = CUSTOM_LABEL;
  if (current === CUSTOM_SOURCE) custom.selected = true;
  select.append(custom);

  let groupName = "";
  let group: HTMLOptGroupElement | null = null;
  for (const source of DATA_SOURCES) {
    if (source.group !== groupName) {
      groupName = source.group;
      group = document.createElement("optgroup");
      group.label = source.group;
      select.append(group);
    }
    const option = document.createElement("option");
    option.value = source.id;
    option.textContent = source.label;
    if (source.id === current) option.selected = true;
    group?.append(option);
  }
  return select;
}

function setHighlight(on: boolean): void {
  for (const node of questionNodes()) {
    if (on) {
      node.style.outline = "2px solid #149FC4";
      node.style.cursor = "crosshair";
      node.dataset[HIGHLIGHT] = "1";
    } else {
      node.style.outline = "";
      node.style.cursor = "";
      delete node.dataset[HIGHLIGHT];
    }
  }
}

function toMapping(
  question: ParsedFormQuestion,
  source: DataSource,
  previous?: FieldMapping,
): FieldMapping {
  return {
    entryId: question.entryId,
    title: question.title,
    type: question.type,
    source,
    customKey: source === CUSTOM_SOURCE ? question.entryId : undefined,
    choices: question.choices ?? previous?.choices,
    when:
      source === "student.school"
        ? undefined
        : (previous?.when ?? question.when),
  };
}

function liveFormUrl(): string {
  return location.href.split("?")[0] ?? location.href;
}

async function boot(): Promise<void> {
  if (document.getElementById(PANEL_ID)) return;

  const host = document.createElement("div");
  host.id = PANEL_ID;
  const shadow = host.attachShadow({ mode: "open" });
  shadow.append(Object.assign(document.createElement("style"), { textContent: css() }));

  const fab = document.createElement("button");
  fab.className = "fab";
  fab.textContent = "Map form";
  shadow.append(fab);

  const panel = document.createElement("div");
  panel.className = "panel";
  panel.hidden = true;
  panel.innerHTML = `
    <h1>Cakyu Helper — Map form</h1>
    <p>Hubungkan pertanyaan form ini ke field di dialog Isi Feedback, atau Custom mapping.</p>
    <div class="row">
      <button type="button" data-act="auto">Auto-map</button>
      <button type="button" data-act="pick">Mode klik</button>
      <button type="button" class="primary" data-act="save">Simpan</button>
    </div>
    <div class="status" data-status></div>
    <div data-list></div>
  `;
  shadow.append(panel);
  document.documentElement.append(host);

  let mappingMode = false;
  let mappings: FieldMapping[] = [];
  const status = panel.querySelector("[data-status]") as HTMLElement;
  const list = panel.querySelector("[data-list]") as HTMLElement;
  let popover: HTMLElement | null = null;

  const parsedQuestions = () => {
    const data = parseFbPublicLoadData(document);
    return data ? questionsFromLoadData(data) : [];
  };

  function liveFormId(): string | null {
    return extractFormId(location.href);
  }

  function keepLive(next: FieldMapping[]): FieldMapping[] {
    const known = new Set(parsedQuestions().map((question) => question.entryId));
    return next.filter((mapping) => known.has(mapping.entryId));
  }

  async function reloadLiveMappings(): Promise<void> {
    const formId = liveFormId();
    mappings = keepLive(formId ? await loadMappingsForForm(formId) : []);
  }

  function applySource(question: ParsedFormQuestion, source: string): void {
    const existing = mappings.find((mapping) => mapping.entryId === question.entryId);
    if (!source) {
      mappings = mappings.filter((mapping) => mapping.entryId !== question.entryId);
      renderList();
      return;
    }
    if (isMappingSource(source)) {
      upsert(toMapping(question, source, existing));
    }
  }

  function renderQuestionRow(question: ParsedFormQuestion, mapped?: FieldMapping): HTMLElement {
    const item = document.createElement("div");
    item.className = mapped ? "item" : "item unmapped";
    const title = document.createElement("strong");
    const section = question.when?.school ?? question.section;
    title.textContent = section
      ? `${question.title} · ${section}`
      : question.title;
    const select = sourceSelect(selectedSourceValue(mapped));
    select.addEventListener("change", () => {
      applySource(question, select.value);
    });
    item.append(title, select);
    return item;
  }

  function renderList(): void {
    list.replaceChildren();
    const questions = parsedQuestions();
    if (!questions.length) {
      const empty = document.createElement("div");
      empty.className = "item";
      empty.textContent = "Tidak ketemu pertanyaan di halaman ini.";
      list.append(empty);
      return;
    }

    const byEntry = new Map(mappings.map((item) => [item.entryId, item]));
    const unmapped = questions.filter((question) => !byEntry.has(question.entryId));
    const mapped = questions.filter((question) => byEntry.has(question.entryId));

    if (unmapped.length) {
      const header = document.createElement("h2");
      header.textContent = "Unmapped";
      list.append(header);
      for (const question of unmapped) {
        list.append(renderQuestionRow(question));
      }
    }

    if (mapped.length) {
      const header = document.createElement("h2");
      header.textContent = "Mapped";
      list.append(header);
      for (const question of mapped) {
        list.append(renderQuestionRow(question, byEntry.get(question.entryId)));
      }
    }
  }

  function upsert(partial: FieldMapping, refresh = true): void {
    const index = mappings.findIndex((item) => item.entryId === partial.entryId);
    if (index >= 0) {
      mappings[index] = { ...mappings[index], ...partial };
    } else {
      mappings = [...mappings, partial];
    }
    if (refresh) renderList();
  }

  async function persist(): Promise<void> {
    const formId = liveFormId();
    if (!formId) {
      status.textContent = "URL form ini tidak dikenali.";
      return;
    }
    const live = keepLive(mappings);
    await saveMappingOverride(formId, live);
    await saveFormUrl(liveFormUrl());
    mappings = live;
    status.textContent = "Mapping disimpan. Form ini dipakai di dialog Isi Feedback.";
    renderList();
  }

  fab.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    if (panel.hidden) {
      mappingMode = false;
      setHighlight(false);
      popover?.remove();
      return;
    }
    void reloadLiveMappings().then(renderList);
  });

  panel.querySelector('[data-act="auto"]')?.addEventListener("click", () => {
    const questions = parsedQuestions();
    if (!questions.length) {
      status.textContent = "Tidak ketemu data pertanyaan di halaman ini.";
      return;
    }
    mappings = keepLive(mappings);
    const byEntry = new Map(mappings.map((item) => [item.entryId, item]));
    for (const question of questions) {
      const previous = byEntry.get(question.entryId);
      const inferred = inferSourceFromTitle(question.title);
      if (inferred) {
        upsert(toMapping(question, inferred, previous), false);
      } else if (previous) {
        upsert(
          {
            ...previous,
            title: question.title,
            type: question.type,
            choices: question.choices ?? previous.choices,
            when: previous.when ?? question.when,
          },
          false,
        );
      }
    }
    renderList();
    status.textContent =
      "Auto-map selesai. Field yang belum kenal tetap Unmapped — pilih Custom mapping jika perlu, lalu Simpan.";
  });

  panel.querySelector('[data-act="pick"]')?.addEventListener("click", () => {
    mappingMode = !mappingMode;
    setHighlight(mappingMode);
    status.textContent = mappingMode
      ? "Klik pertanyaan di form untuk menghubungkan."
      : "Mode klik mati.";
  });

  panel.querySelector('[data-act="save"]')?.addEventListener("click", () => {
    void persist();
  });

  document.addEventListener(
    "click",
    (event) => {
      if (!mappingMode) return;
      const path = event.composedPath();
      if (path.includes(host)) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const item = target.closest('div[role="listitem"]') as HTMLElement | null;
      if (!item) return;
      event.preventDefault();
      event.stopPropagation();

      const questions = parsedQuestions();
      const hit =
        questions.find((question) => item === nodeForQuestion(question.title)) ??
        questions.find((question) =>
          normalize(item.innerText).includes(normalize(question.title).slice(0, 40)),
        );
      if (!hit) {
        status.textContent = "Pertanyaan ini tidak ketemu di data form.";
        return;
      }

      popover?.remove();
      popover = document.createElement("div");
      popover.className = "pop";
      const heading = document.createElement("strong");
      heading.textContent = hit.title.slice(0, 80);
      const existing = mappings.find((mapping) => mapping.entryId === hit.entryId);
      const select = sourceSelect(selectedSourceValue(existing));
      const save = document.createElement("button");
      save.className = "primary";
      save.textContent = "Simpan";
      save.style.marginTop = "8px";
      save.addEventListener("click", () => {
        applySource(hit, select.value);
        popover?.remove();
        popover = null;
      });
      popover.append(heading, select, save);
      const rect = item.getBoundingClientRect();
      popover.style.left = `${Math.min(rect.left, window.innerWidth - 280)}px`;
      popover.style.top = `${Math.min(rect.bottom + 8, window.innerHeight - 160)}px`;
      shadow.append(popover);
    },
    true,
  );
}

void boot();
