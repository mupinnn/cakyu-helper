import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const dumpPath = resolve(root, "debug/google-form-dump.txt");
const dump = JSON.parse(await Bun.file(dumpPath).text()) as unknown[];

const questions = (dump[1] as unknown[])[1] as unknown[][];

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

function inferSource(title: string): string | null {
  const t = title.replace(/<[^>]+>/g, "").trim().toLowerCase();
  if (t === "nim") return "student.nim";
  if (t.includes("lectures program")) return "schedule.delivery";
  if (t.includes("year of enrollment")) return "student.enrollmentYear";
  if (t === "semester") return "student.semester";
  if (t === "school") return "student.school";
  if (t === "major") return "student.major";
  if (t === "subject") return "schedule.subject";
  if (t.includes("class code")) return "schedule.classCode";
  if (t.includes("nama dosen")) return "schedule.lecturer";
  if (t.includes("number of meetings")) return "schedule.session";
  if (t.includes("tingkat pemahaman")) return "rating.understanding";
  if (t.includes("belum kamu pahami")) return "feedback.understanding";
  if (t.includes("interaktif")) return "rating.interactivity";
  if (t.includes("performa mengajar")) return "rating.lecturerPerformance";
  if (t.includes("feedback untuk dosen")) return "feedback.lecturer";
  return null;
}

const TYPE_MAP: Record<number, string> = {
  0: "text",
  1: "paragraph",
  2: "radio",
  3: "dropdown",
};

const mappings: Array<Record<string, unknown>> = [];
let currentSchool: string | null = null;

for (const question of questions) {
  const title = String(question[1] ?? "");
  const type = Number(question[3]);

  if (type === 8) {
    currentSchool = inferSchoolFromSection(title);
    continue;
  }

  const entryBlock = question[4] as unknown[][] | null;
  if (!entryBlock?.[0]) continue;

  const entryId = entryBlock[0]?.[0];
  if (typeof entryId !== "number") continue;

  const optionsRaw = entryBlock[0]?.[1] as unknown[][] | null;
  const choices = Array.isArray(optionsRaw)
    ? optionsRaw.map((opt) => String(opt[0]))
    : undefined;

  const source = inferSource(title);
  if (!source) continue;

  const mapping: Record<string, unknown> = {
    entryId: `entry.${entryId}`,
    title: title.replace(/<[^>]+>/g, "").trim(),
    type: TYPE_MAP[type] ?? "text",
    source,
  };

  if (currentSchool && source !== "student.school") {
    mapping.when = { school: currentSchool };
  }
  if (choices?.length) mapping.choices = choices;

  mappings.push(mapping);
}

const formId = "1FAIpQLScyVsCSiybP2uck4zgtTCnoF1Swoe7APsl2SMnrAKUhHa0OtA";
const config = {
  formId,
  formUrl: `https://docs.google.com/forms/d/e/${formId}/viewform`,
  title: "Lectures Feedback Form",
  mappings,
};

const json = `${JSON.stringify(config, null, 2)}\n`;
const targets = [
  resolve(root, "apps/extension/src/shared/default-mapping.json"),
  resolve(root, "apps/web/public/mappings/default.json"),
];

for (const target of targets) {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, json);
  console.log(`wrote ${target} (${mappings.length} mappings)`);
}
