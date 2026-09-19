const TYPE_MAP: Record<number, "text" | "paragraph" | "radio" | "dropdown"> = {
  0: "text",
  1: "paragraph",
  2: "radio",
  3: "dropdown",
};

export type ParsedFormQuestion = {
  entryId: string;
  title: string;
  type: "text" | "paragraph" | "radio" | "dropdown";
  choices?: string[];
  section?: string;
  when?: { school: string };
};

function inferSchoolFromSection(title: string): string | null {
  if (/Class Feedback/i.test(title)) return null;
  if (/Business Economics/i.test(title)) {
    return "School of Business Economics";
  }
  if (/AI|Computer Science/i.test(title)) {
    return "School of AI & Computer Science";
  }
  if (/Psychology/i.test(title)) return "School of Psychology & Education";
  if (/Communication/i.test(title)) {
    return "School of Communication & Design";
  }
  if (/Engineering/i.test(title)) return "School of Engineering";
  if (/Law/i.test(title)) return "School of Law";
  return null;
}

export function extractJsonArray(source: string, marker: string): unknown | null {
  const index = source.indexOf(marker);
  if (index === -1) return null;
  const equals = source.indexOf("=", index);
  const start = source.indexOf("[", equals);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(source.slice(start, i + 1)) as unknown;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export function parseFbPublicLoadData(doc: Document): unknown | null {
  for (const script of doc.querySelectorAll("script")) {
    const text = script.textContent ?? "";
    if (!text.includes("FB_PUBLIC_LOAD_DATA_")) continue;
    const parsed = extractJsonArray(text, "FB_PUBLIC_LOAD_DATA_");
    if (parsed) return parsed;
  }
  return null;
}

export function questionsFromLoadData(data: unknown): ParsedFormQuestion[] {
  if (!Array.isArray(data)) return [];
  const payload = data[1];
  if (!Array.isArray(payload)) return [];
  const questions = payload[1];
  if (!Array.isArray(questions)) return [];

  const result: ParsedFormQuestion[] = [];
  let currentSection: string | undefined;
  let currentSchool: string | null = null;
  for (const question of questions) {
    if (!Array.isArray(question)) continue;
    const type = Number(question[3]);
    const title = String(question[1] ?? "").replace(/<[^>]+>/g, "").trim();
    if (type === 8) {
      currentSchool = inferSchoolFromSection(title);
      currentSection =
        currentSchool ??
        (/Class Feedback/i.test(title) ? undefined : title || undefined);
      continue;
    }
    const entryBlock = question[4];
    if (!Array.isArray(entryBlock) || !Array.isArray(entryBlock[0])) continue;
    const entryId = entryBlock[0][0];
    if (typeof entryId !== "number") continue;
    const optionsRaw = entryBlock[0][1];
    const choices = Array.isArray(optionsRaw)
      ? optionsRaw.map((option) =>
          Array.isArray(option) ? String(option[0]) : String(option),
        )
      : undefined;
    result.push({
      entryId: `entry.${entryId}`,
      title,
      type: TYPE_MAP[type] ?? "text",
      choices,
      section: currentSchool ?? currentSection,
      when: currentSchool ? { school: currentSchool } : undefined,
    });
  }
  return result;
}
