import { dialogStyles } from "./dialog-styles";
import {
  buildPrefillUrl,
  choicesFor,
  customKeyOf,
  customMappings,
  emptyRatings,
  resolveMappings,
} from "../shared/mapping";
import {
  canonicalizeMajor,
  enrollmentYearFromNim,
  inferSchoolFromMajor,
  inferSemester,
} from "../shared/sources";
import {
  loadDialogDefaults,
  loadFormConfig,
  loadProfile,
  saveDialogDefaults,
  saveFormUrl,
  saveProfile,
} from "../shared/storage";
import type {
  DialogDefaults,
  FormConfig,
  RatingPayload,
  SessionContext,
  StudentProfile,
} from "../shared/types";

const HOST_ID = "cakyu-helper-dialog";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    node.append(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

function unmatchedHint(value: string, options: string[]): string | undefined {
  if (!value || !options.length) return undefined;
  if (options.some((option) => option.toLowerCase() === value.toLowerCase())) {
    return undefined;
  }
  return `Tidak ada opsi persis "${value}". Pilih yang paling dekat.`;
}

function field(
  labelText: string,
  control: HTMLElement,
  hint?: string,
): HTMLDivElement {
  const node = el("div", { class: "field" }, [el("span", {}, [labelText]), control]);
  if (hint) node.append(el("span", { class: "miss" }, [hint]));
  return node;
}

function input(
  name: string,
  value: string,
  type = "text",
): HTMLInputElement {
  return el("input", { name, type, value });
}

function select(name: string, value: string, options: string[]): HTMLSelectElement {
  const node = el("select", { name });
  const values = options.includes(value) || !value ? options : [value, ...options];
  if (!value) {
    node.append(el("option", { value: "" }, ["— pilih —"]));
  }
  for (const option of values) {
    const item = el("option", { value: option }, [option]);
    if (option === value) item.selected = true;
    node.append(item);
  }
  return node;
}

function ratingRow(name: string, value: number): HTMLDivElement {
  const row = el("div", { class: "ratings" });
  for (const score of [1, 2, 3, 4, 5]) {
    const id = `${name}-${score}`;
    const radio = el("input", {
      type: "radio",
      name,
      value: String(score),
      id,
    }) as HTMLInputElement;
    if (score === value) radio.checked = true;
    row.append(
      el("label", {}, [radio, document.createTextNode(String(score))]),
    );
  }
  return row;
}

function seedProfile(
  stored: StudentProfile,
  session: SessionContext,
  config: FormConfig,
): StudentProfile {
  const nim = stored.nim || session.studentNim;
  const major = canonicalizeMajor(stored.major || session.studentMajor);
  const school =
    stored.school ||
    inferSchoolFromMajor(major) ||
    choicesFor(config.mappings, "student.school", "")[0] ||
    "";
  const enrollmentYear =
    stored.enrollmentYear || enrollmentYearFromNim(nim);
  const semester =
    stored.semester || inferSemester(enrollmentYear, session.period);
  return { nim, major, school, enrollmentYear, semester, extras: stored.extras ?? {} };
}

function sessionChoiceValue(
  sessionChoices: string[],
  sessionNo: number,
  last?: string,
): string {
  if (last && (!sessionChoices.length || sessionChoices.includes(last))) {
    return last;
  }
  return (
    sessionChoices.find((choice) => choice.startsWith(String(sessionNo))) ??
    String(sessionNo)
  );
}

function deliveryValue(
  sessionDelivery: SessionContext["delivery"],
  deliveryChoices: string[],
  last?: SessionContext["delivery"],
): string {
  if (last && (!deliveryChoices.length || deliveryChoices.includes(last))) {
    return last;
  }
  return sessionDelivery;
}

function readForm(root: ShadowRoot): {
  formUrl: string;
  profile: StudentProfile;
  sessionPatch: Pick<
    SessionContext,
    "subject" | "classCode" | "lecturer" | "delivery"
  > & { sessionChoice: string };
  ratings: RatingPayload;
  customizeLecturer: boolean;
} {
  const value = (name: string) =>
    (root.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)
      ?.value ?? "";
  const number = (name: string) => {
    const checked = root.querySelector(
      `input[name="${name}"]:checked`,
    ) as HTMLInputElement | null;
    return Number(checked?.value ?? 5);
  };
  const customizeLecturer = Boolean(
    (root.querySelector('[name="customizeLecturer"]') as HTMLInputElement | null)
      ?.checked,
  );

  const extras: Record<string, string> = {};
  for (const node of root.querySelectorAll("[data-extra-key]")) {
    const key = node.getAttribute("data-extra-key");
    if (!key) continue;
    extras[key] =
      (node as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
  }

  return {
    formUrl: value("formUrl").trim(),
    profile: {
      nim: value("nim"),
      enrollmentYear: value("enrollmentYear"),
      semester: value("semester"),
      school: value("school"),
      major: value("major"),
      extras,
    },
    sessionPatch: {
      subject: value("subject"),
      classCode: value("classCode"),
      lecturer: value("lecturer"),
      delivery: value("delivery") === "On-site/Offline"
        ? "On-site/Offline"
        : "Online",
      sessionChoice: value("session"),
    },
    ratings: {
      overall: number("overall"),
      understanding: number("understanding"),
      interactivity: number("interactivity"),
      lecturerPerformance: number("lecturerPerformance"),
      feedbackUnderstanding: value("feedbackUnderstanding") || "-",
      feedbackLecturer: customizeLecturer ? value("feedbackLecturer") : "-",
    },
    customizeLecturer,
  };
}

function closeDialog(): void {
  document.getElementById(HOST_ID)?.remove();
}

export async function openFeedbackDialog(session: SessionContext): Promise<void> {
  closeDialog();

  const config = await loadFormConfig();
  const profile = seedProfile(await loadProfile(), session, config);
  const defaults = await loadDialogDefaults();
  const ratings = defaults.ratings ?? emptyRatings();
  const customizeLecturer = Boolean(defaults.customizeLecturer);

  const host = el("div", { id: HOST_ID });
  const shadow = host.attachShadow({ mode: "open" });
  shadow.append(el("style", {}, [dialogStyles]));

  const overlay = el("div", { class: "overlay" });
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeDialog();
  });

  const panel = el("div", { class: "panel" });
  panel.addEventListener("click", (event) => event.stopPropagation());

  const exam = session.isUts ? " · UTS" : session.isUas ? " · UAS" : "";
  panel.append(
    el("h1", {}, [`Isi Feedback — ${session.subject}`]),
    el("div", { class: "sub" }, [
      `${session.sessionLabel}${exam} · ${session.date || "tanggal belum diisi"} · ${session.classCode}`,
    ]),
    el("div", { class: "note" }, [
      "Data mahasiswa disimpan di browser ini. Pastikan Google account-mu sudah benar sebelum form terbuka.",
    ]),
  );

  const form = el("form");
  const schoolChoices = choicesFor(config.mappings, "student.school", "");
  const yearChoices = choicesFor(config.mappings, "student.enrollmentYear", "");
  const semesterChoices = choicesFor(config.mappings, "student.semester", "");

  const formUrlInput = input("formUrl", config.formUrl, "url");
  formUrlInput.setAttribute(
    "placeholder",
    "https://docs.google.com/forms/d/e/...",
  );
  const urlSet = el("fieldset", {}, [
    el("legend", {}, ["Google Form"]),
    field("URL form", formUrlInput),
  ]);

  const studentSet = el("fieldset", {}, [
    el("legend", {}, ["Data mahasiswa"]),
    el("div", { class: "grid" }, [
      field("NIM", input("nim", profile.nim)),
      field(
        "Major / Prodi",
        select(
          "major",
          profile.major,
          choicesFor(config.mappings, "student.major", profile.school),
        ),
      ),
      field("School", select("school", profile.school, schoolChoices)),
      field(
        "Tahun angkatan",
        select("enrollmentYear", profile.enrollmentYear, yearChoices),
      ),
      field("Semester", select("semester", profile.semester, semesterChoices)),
    ]),
  ]);

  const sessionChoices = choicesFor(config.mappings, "schedule.session", profile.school);
  const deliveryChoices = choicesFor(config.mappings, "schedule.delivery", profile.school);
  const subjectChoices = choicesFor(config.mappings, "schedule.subject", profile.school);
  const classChoices = choicesFor(config.mappings, "schedule.classCode", profile.school);
  const lecturerChoices = choicesFor(config.mappings, "schedule.lecturer", profile.school);

  const chosenSession = sessionChoiceValue(
    sessionChoices,
    session.sessionNo,
    defaults.sessionChoice,
  );
  const chosenDelivery = deliveryValue(
    session.delivery,
    deliveryChoices,
    defaults.delivery,
  );

  const sessionSet = el("fieldset", {}, [
    el("legend", {}, ["Sesi kelas"]),
    el("div", { class: "grid" }, [
      field(
        "Mata kuliah",
        select("subject", session.subject, subjectChoices),
        unmatchedHint(session.subject, subjectChoices),
      ),
      field(
        "Kode kelas",
        select("classCode", session.classCode, classChoices),
        unmatchedHint(session.classCode, classChoices),
      ),
      field(
        "Dosen",
        select("lecturer", session.lecturer, lecturerChoices),
        unmatchedHint(session.lecturer, lecturerChoices),
      ),
      field(
        "Pertemuan",
        select("session", chosenSession, sessionChoices),
      ),
      field(
        "Online / Offline",
        select(
          "delivery",
          chosenDelivery,
          deliveryChoices.length ? deliveryChoices : [chosenDelivery],
        ),
      ),
    ]),
  ]);

  const customize = el("input", {
    type: "checkbox",
    name: "customizeLecturer",
  }) as HTMLInputElement;
  customize.checked = customizeLecturer;
  const lecturerFeedback = el("textarea", {
    name: "feedbackLecturer",
  }, [ratings.feedbackLecturer]) as HTMLTextAreaElement;
  lecturerFeedback.disabled = !customize.checked;

  customize.addEventListener("change", () => {
    lecturerFeedback.disabled = !customize.checked;
    if (!customize.checked) lecturerFeedback.value = "-";
    else if (lecturerFeedback.value === "-") lecturerFeedback.value = "";
  });

  const ratingSet = el("fieldset", {}, [
    el("legend", {}, ["Penilaian kelas"]),
    field("Rating keseluruhan", ratingRow("overall", ratings.overall)),
    field("Pemahaman", ratingRow("understanding", ratings.understanding)),
    field(
      "Yang belum dipahami (wajib jika pemahaman ≤ 4)",
      el("textarea", { name: "feedbackUnderstanding" }, [
        ratings.feedbackUnderstanding,
      ]),
    ),
    field("Interaktivitas", ratingRow("interactivity", ratings.interactivity)),
    field("Performa dosen", ratingRow("lecturerPerformance", ratings.lecturerPerformance)),
    el("label", { class: "check" }, [
      customize,
      "Kustomisasi feedback dosen",
    ]),
    field("Feedback dosen", lecturerFeedback),
  ]);

  const extras = customMappings(config.mappings, profile.school);
  const extraSet = el("fieldset", { class: "priority" }, [
    el("legend", {}, ["Custom mapping"]),
    el("p", { class: "priority-hint" }, [
      "Diprioritaskan — diisi di RISE, dipakai saat Google Form terbuka.",
    ]),
  ]);
  for (const mapping of extras) {
    const key = customKeyOf(mapping);
    const current = profile.extras[key] ?? "";
    const name = `extra:${key}`;
    let control: HTMLElement;
    if (mapping.choices?.length) {
      control = select(name, current, mapping.choices);
    } else if (mapping.type === "paragraph") {
      control = el("textarea", { name }, [current]);
    } else {
      control = input(name, current);
    }
    control.setAttribute("data-extra-key", key);
    extraSet.append(
      field(mapping.title, control, unmatchedHint(current, mapping.choices ?? [])),
    );
  }

  const warning = el("div", { class: "warn", hidden: "" });

  const actions = el("div", { class: "actions" }, [
    el("button", { type: "button", class: "ghost" }, ["Batal"]),
    el("button", { type: "submit", class: "primary" }, ["Buka Google Form"]),
  ]);
  actions.firstElementChild?.addEventListener("click", () => closeDialog());

  form.append(urlSet);
  if (extras.length) form.append(extraSet);
  form.append(studentSet, sessionSet, ratingSet, warning, actions);
  panel.append(form);
  overlay.append(panel);
  shadow.append(overlay);
  document.documentElement.append(host);

  const schoolSelect = form.querySelector('[name="school"]') as HTMLSelectElement;
  const majorSelect = form.querySelector('[name="major"]') as HTMLSelectElement;
  schoolSelect.addEventListener("change", () => {
    const nextSchool = schoolSelect.value;
    const nextMajors = choicesFor(config.mappings, "student.major", nextSchool);
    const current = majorSelect.value;
    majorSelect.replaceChildren();
    for (const option of nextMajors) {
      majorSelect.append(el("option", { value: option }, [option]));
    }
    if (nextMajors.includes(current)) majorSelect.value = current;
  });

  const syncRatings = (value: number) => {
    for (const name of ["understanding", "interactivity", "lecturerPerformance"]) {
      const radio = form.querySelector(
        `input[name="${name}"][value="${value}"]`,
      ) as HTMLInputElement | null;
      if (radio) radio.checked = true;
    }
  };
  form.querySelectorAll('input[name="overall"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const value = Number((radio as HTMLInputElement).value);
      syncRatings(value);
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const parsed = readForm(shadow);
    if (!parsed.profile.nim) {
      warning.hidden = false;
      warning.textContent = "NIM wajib diisi.";
      return;
    }
    if (
      parsed.ratings.understanding <= 4 &&
      (!parsed.ratings.feedbackUnderstanding.trim() ||
        parsed.ratings.feedbackUnderstanding.trim() === "-")
    ) {
      warning.hidden = false;
      warning.textContent =
        "Isi topik yang belum dipahami jika rating pemahaman 4 atau kurang.";
      return;
    }

    if (parsed.formUrl) await saveFormUrl(parsed.formUrl);

    const nextDefaults: DialogDefaults = {
      sessionChoice: parsed.sessionPatch.sessionChoice,
      delivery: parsed.sessionPatch.delivery,
      ratings: parsed.ratings,
      customizeLecturer: parsed.customizeLecturer,
    };
    await saveDialogDefaults(nextDefaults);

    await saveProfile({
      ...parsed.profile,
      extras: { ...profile.extras, ...parsed.profile.extras },
    });

    const liveConfig = await loadFormConfig();

    const patchedSession: SessionContext = {
      ...session,
      subject: parsed.sessionPatch.subject,
      classCode: parsed.sessionPatch.classCode,
      lecturer: parsed.sessionPatch.lecturer,
      delivery: parsed.sessionPatch.delivery,
    };

    const resolved = resolveMappings(
      liveConfig,
      parsed.profile,
      patchedSession,
      parsed.ratings,
    ).map((fieldValue) => {
      if (fieldValue.mapping.source === "schedule.session") {
        return {
          ...fieldValue,
          value: parsed.sessionPatch.sessionChoice || fieldValue.value,
          confidence: "exact" as const,
        };
      }
      if (fieldValue.mapping.source === "schedule.subject") {
        return { ...fieldValue, value: parsed.sessionPatch.subject, confidence: "exact" as const };
      }
      if (fieldValue.mapping.source === "schedule.classCode") {
        return { ...fieldValue, value: parsed.sessionPatch.classCode, confidence: "exact" as const };
      }
      if (fieldValue.mapping.source === "schedule.lecturer") {
        return { ...fieldValue, value: parsed.sessionPatch.lecturer, confidence: "exact" as const };
      }
      if (fieldValue.mapping.source === "schedule.delivery") {
        return { ...fieldValue, value: parsed.sessionPatch.delivery, confidence: "exact" as const };
      }
      return fieldValue;
    });

    const missing = resolved.filter(
      (item) =>
        item.mapping.choices?.length &&
        !item.value &&
        item.mapping.type !== "text" &&
        item.mapping.type !== "paragraph",
    );
    if (missing.length) {
      warning.hidden = false;
      warning.textContent = `Tidak ketemu opsi form untuk: ${missing
        .map((item) => item.mapping.title)
        .join(", ")}. Pilih dari dropdown di atas, atau lanjutkan dan isi manual di Google Form.`;
    }

    const url = buildPrefillUrl(liveConfig.formUrl, resolved);
    window.open(url, "_blank", "noopener");
    closeDialog();
  });
}
