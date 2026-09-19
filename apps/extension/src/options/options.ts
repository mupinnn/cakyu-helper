import { customKeyOf, customMappings } from "../shared/mapping";
import { mappingSourceLabel } from "../shared/sources";
import {
  loadFormConfig,
  loadProfile,
  refreshPublishedDefault,
  resetMappingOverride,
  saveFormUrl,
  saveProfile,
} from "../shared/storage";

const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;

function extraInputId(key: string): string {
  return `extra-${key.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

async function render(): Promise<void> {
  const profile = await loadProfile();
  const config = await loadFormConfig();

  ($("formUrl") as HTMLInputElement).value = config.formUrl;
  ($("nim") as HTMLInputElement).value = profile.nim;
  ($("major") as HTMLInputElement).value = profile.major;
  ($("school") as HTMLInputElement).value = profile.school;
  ($("enrollmentYear") as HTMLInputElement).value = profile.enrollmentYear;
  ($("semester") as HTMLInputElement).value = profile.semester;

  const extrasWrap = $("extras");
  extrasWrap.replaceChildren();
  const extras = customMappings(config.mappings, profile.school);
  $("customSection").hidden = extras.length === 0;
  for (const mapping of extras) {
    const key = customKeyOf(mapping);
    const label = document.createElement("label");
    label.textContent = mapping.title;
    const input = document.createElement("input");
    input.id = extraInputId(key);
    input.dataset.extraKey = key;
    input.value = profile.extras[key] ?? "";
    label.append(input);
    extrasWrap.append(label);
  }

  const preview = $("mappingPreview");
  preview.replaceChildren();
  if (!config.mappings.length) {
    preview.textContent = "Belum ada mapping. Buka Google Form lalu Auto-map.";
    return;
  }
  const list = document.createElement("ul");
  list.className = "mapping-list";
  for (const mapping of config.mappings) {
    const item = document.createElement("li");
    item.textContent = `${mapping.title} → ${mappingSourceLabel(mapping.source)}`;
    list.append(item);
  }
  preview.append(list);
}

$("saveForm").addEventListener("click", async () => {
  const url = ($("formUrl") as HTMLInputElement).value.trim();
  await saveFormUrl(url);
  $("formStatus").textContent = "URL form disimpan.";
  await render();
});

$("refreshDefault").addEventListener("click", async () => {
  const result = await refreshPublishedDefault();
  $("formStatus").textContent = result
    ? `Default terbaru: ${result.mappings.length} field.`
    : "Gagal mengambil default (pakai mapping bundled).";
  await render();
});

$("resetOverride").addEventListener("click", async () => {
  const config = await loadFormConfig();
  await resetMappingOverride(config.formId);
  $("formStatus").textContent = "Override dihapus. Default dipakai lagi.";
  await render();
});

$("saveProfile").addEventListener("click", async () => {
  const current = await loadProfile();
  const extras = { ...current.extras };
  for (const node of document.querySelectorAll<HTMLInputElement>("[data-extra-key]")) {
    const key = node.dataset.extraKey;
    if (key) extras[key] = node.value.trim();
  }
  await saveProfile({
    nim: ($("nim") as HTMLInputElement).value.trim(),
    major: ($("major") as HTMLInputElement).value.trim(),
    school: ($("school") as HTMLInputElement).value.trim(),
    enrollmentYear: ($("enrollmentYear") as HTMLInputElement).value.trim(),
    semester: ($("semester") as HTMLInputElement).value.trim(),
    extras,
  });
  $("profileStatus").textContent = "Profil disimpan.";
});

void render();
