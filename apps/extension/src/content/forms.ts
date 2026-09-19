import {
  parseFbPublicLoadData,
  questionsFromLoadData,
} from "../shared/form-data";
import { extractFormId } from "../shared/mapping";
import { DATA_SOURCES, inferSourceFromTitle, isDataSource } from "../shared/sources";
import { loadFormConfig, saveMappingOverride } from "../shared/storage";
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
  .row { display: flex; gap: 6px; margin-bottom: 8px; }
  button, select {
    border-radius: 8px; border: 1px solid #cbd5e0; background: #fff;
    padding: 8px 10px; font-size: 13px; cursor: pointer;
  }
  .primary { background: #149FC4; color: #fff; border-color: #149FC4; }
  .item { border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px; margin-bottom: 6px; font-size: 12px; }
  .item strong { display: block; margin-bottom: 4px; }
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

function sourceSelect(current?: string): HTMLSelectElement {
  const select = document.createElement("select");
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "— tidak di-map —";
  select.append(empty);
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
    <h1>Cakyu Helper — Map fields</h1>
    <p>Klik pertanyaan di form, lalu pilih data source. Auto-map mengisi dari judul pertanyaan.</p>
    <div class="row">
      <button type="button" class="primary" data-act="auto">Auto-map</button>
      <button type="button" data-act="pick">Mode klik</button>
      <button type="button" data-act="save">Simpan</button>
    </div>
    <div class="status" data-status></div>
    <div data-list></div>
  `;
  shadow.append(panel);
  document.documentElement.append(host);

  let mappingMode = false;
  let mappings: FieldMapping[] = (await loadFormConfig()).mappings;
  const status = panel.querySelector("[data-status]") as HTMLElement;
  const list = panel.querySelector("[data-list]") as HTMLElement;
  let popover: HTMLElement | null = null;

  const parsedQuestions = () => {
    const data = parseFbPublicLoadData(document);
    return data ? questionsFromLoadData(data) : [];
  };

  function renderList(): void {
    list.replaceChildren();
    for (const mapping of mappings) {
      const item = document.createElement("div");
      item.className = "item";
      const title = document.createElement("strong");
      title.textContent = mapping.title;
      const meta = document.createElement("div");
      meta.textContent = `${mapping.entryId} → ${mapping.source}${
        mapping.when?.school ? ` (${mapping.when.school})` : ""
      }`;
      item.append(title, meta);
      list.append(item);
    }
    if (!mappings.length) {
      list.textContent = "Belum ada mapping. Jalankan Auto-map atau klik pertanyaan.";
    }
  }

  function upsert(partial: FieldMapping): void {
    const index = mappings.findIndex((item) => item.entryId === partial.entryId);
    if (index >= 0) {
      mappings[index] = { ...mappings[index], ...partial };
    } else {
      mappings = [...mappings, partial];
    }
    renderList();
  }

  async function persist(): Promise<void> {
    const config = await loadFormConfig();
    const formId =
      extractFormId(location.href) ??
      extractFormId(config.formUrl) ??
      config.formId;
    await saveMappingOverride(formId, mappings);
    status.textContent = "Mapping disimpan di browser ini.";
  }

  fab.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    if (panel.hidden) {
      mappingMode = false;
      setHighlight(false);
      popover?.remove();
    }
  });

  panel.querySelector('[data-act="auto"]')?.addEventListener("click", () => {
    const questions = parsedQuestions();
    if (!questions.length) {
      status.textContent = "Tidak ketemu FB_PUBLIC_LOAD_DATA_ di halaman ini.";
      return;
    }
    const byEntry = new Map(mappings.map((item) => [item.entryId, item]));
    for (const question of questions) {
      const source = inferSourceFromTitle(question.title);
      const previous = byEntry.get(question.entryId);
      if (!source && !previous) continue;
      upsert({
        entryId: question.entryId,
        title: question.title,
        type: question.type,
        source: (source ?? previous?.source) as DataSource,
        choices: question.choices ?? previous?.choices,
        when: previous?.when,
      });
    }
    status.textContent = `Auto-map ${questions.length} pertanyaan. Cek lalu Simpan.`;
  });

  panel.querySelector('[data-act="pick"]')?.addEventListener("click", () => {
    mappingMode = !mappingMode;
    setHighlight(mappingMode);
    status.textContent = mappingMode
      ? "Klik pertanyaan di form untuk bind."
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
      const select = sourceSelect(
        mappings.find((mapping) => mapping.entryId === hit.entryId)?.source,
      );
      const save = document.createElement("button");
      save.className = "primary";
      save.textContent = "Bind";
      save.style.marginTop = "8px";
      save.addEventListener("click", () => {
        const source = select.value;
        if (!source || !isDataSource(source)) {
          mappings = mappings.filter((mapping) => mapping.entryId !== hit.entryId);
          renderList();
        } else {
          upsert({
            entryId: hit.entryId,
            title: hit.title,
            type: hit.type,
            source: source as DataSource,
            choices: hit.choices,
            when: mappings.find((mapping) => mapping.entryId === hit.entryId)?.when,
          });
        }
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

  renderList();
}

void boot();
