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

async function render(): Promise<void> {
  const profile = await loadProfile();
  const config = await loadFormConfig();

  ($("formUrl") as HTMLInputElement).value = config.formUrl;
  ($("nim") as HTMLInputElement).value = profile.nim;
  ($("major") as HTMLInputElement).value = profile.major;
  ($("school") as HTMLInputElement).value = profile.school;
  ($("enrollmentYear") as HTMLInputElement).value = profile.enrollmentYear;
  ($("semester") as HTMLInputElement).value = profile.semester;
  $("mappingPreview").textContent = JSON.stringify(
    {
      formId: config.formId,
      count: config.mappings.length,
      mappings: config.mappings.map((mapping) => ({
        title: mapping.title,
        entryId: mapping.entryId,
        source: mapping.source,
        when: mapping.when,
      })),
    },
    null,
    2,
  );
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
  await saveProfile({
    nim: ($("nim") as HTMLInputElement).value.trim(),
    major: ($("major") as HTMLInputElement).value.trim(),
    school: ($("school") as HTMLInputElement).value.trim(),
    enrollmentYear: ($("enrollmentYear") as HTMLInputElement).value.trim(),
    semester: ($("semester") as HTMLInputElement).value.trim(),
  });
  $("profileStatus").textContent = "Profil disimpan.";
});

void render();
