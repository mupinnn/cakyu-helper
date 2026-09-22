import bundledDefault from "./default-mapping.json";
import {
  DEFAULT_MAPPING_HOST_PERMISSION,
  DEFAULT_MAPPING_URL,
} from "./sources";
import { emptyProfile, extractFormId } from "./mapping";
import type {
  DialogDefaults,
  ExtensionStorage,
  FieldMapping,
  FormConfig,
  StudentProfile,
} from "./types";

const bundled = bundledDefault as FormConfig;

function isFormConfig(value: unknown): value is FormConfig {
  if (!value || typeof value !== "object") return false;
  const candidate = value as FormConfig;
  return (
    typeof candidate.formId === "string" &&
    typeof candidate.formUrl === "string" &&
    Array.isArray(candidate.mappings)
  );
}

export async function readStorage(): Promise<ExtensionStorage> {
  return chrome.storage.local.get([
    "formUrl",
    "profile",
    "mappingOverrides",
    "publishedDefault",
    "dialogDefaults",
  ]) as Promise<ExtensionStorage>;
}

export async function writeStorage(
  patch: Partial<ExtensionStorage>,
): Promise<void> {
  await chrome.storage.local.set(patch);
}

export async function loadProfile(): Promise<StudentProfile> {
  const stored = await readStorage();
  const base = emptyProfile();
  return {
    ...base,
    ...stored.profile,
    extras: { ...base.extras, ...stored.profile?.extras },
  };
}

export async function saveProfile(profile: StudentProfile): Promise<void> {
  await writeStorage({ profile });
}

export async function loadFormConfig(): Promise<FormConfig> {
  const stored = await readStorage();
  const url =
    typeof stored.formUrl === "string" && stored.formUrl.length > 0
      ? stored.formUrl
      : bundled.formUrl;
  const formId = extractFormId(url) ?? bundled.formId;
  const override = stored.mappingOverrides?.[formId];

  if (Array.isArray(override)) {
    return {
      formId,
      formUrl: url,
      title: stored.publishedDefault?.title ?? bundled.title,
      mappings: override,
    };
  }

  const published =
    stored.publishedDefault && stored.publishedDefault.formId === formId
      ? stored.publishedDefault
      : null;

  if (published) {
    return { ...published, formUrl: url };
  }

  if (formId === bundled.formId) {
    return { ...bundled, formUrl: url };
  }

  return { formId, formUrl: url, mappings: [] };
}

async function ensureMappingHostPermission(): Promise<boolean> {
  const origins = [DEFAULT_MAPPING_HOST_PERMISSION];
  try {
    if (chrome.permissions?.contains) {
      const granted = await chrome.permissions.contains({ origins });
      if (granted) return true;
    }
    if (chrome.permissions?.request) {
      return await chrome.permissions.request({ origins });
    }
    return true;
  } catch {
    return false;
  }
}

export async function refreshPublishedDefault(): Promise<FormConfig | null> {
  try {
    const allowed = await ensureMappingHostPermission();
    if (!allowed) return null;

    const response = await chrome.runtime.sendMessage({
      type: "fetchDefaultMapping",
    });
    if (!isFormConfig(response)) return null;
    await writeStorage({ publishedDefault: response });
    return response;
  } catch {
    return null;
  }
}

export async function saveMappingOverride(
  formId: string,
  mappings: FieldMapping[],
): Promise<void> {
  const stored = await readStorage();
  await writeStorage({
    mappingOverrides: {
      ...stored.mappingOverrides,
      [formId]: mappings,
    },
  });
}

export async function resetMappingOverride(formId: string): Promise<void> {
  const stored = await readStorage();
  const next = { ...stored.mappingOverrides };
  delete next[formId];
  await writeStorage({ mappingOverrides: next });
}

export async function saveFormUrl(formUrl: string): Promise<void> {
  await writeStorage({ formUrl });
}

export async function loadMappingsForForm(
  formId: string,
): Promise<FieldMapping[]> {
  const stored = await readStorage();
  const override = stored.mappingOverrides?.[formId];
  if (Array.isArray(override)) return override;
  if (stored.publishedDefault?.formId === formId) {
    return stored.publishedDefault.mappings;
  }
  if (formId === bundled.formId) return bundled.mappings;
  return [];
}

export async function loadDialogDefaults(): Promise<DialogDefaults> {
  const stored = await readStorage();
  return stored.dialogDefaults ?? {};
}

export async function saveDialogDefaults(
  defaults: DialogDefaults,
): Promise<void> {
  await writeStorage({ dialogDefaults: defaults });
}

export { bundled as bundledDefault, DEFAULT_MAPPING_URL };
