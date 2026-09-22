import type { DataSource } from "./types";

export const DEFAULT_MAPPING_URL =
  "https://cakyu-helper.13121957.xyz/mappings/default.json";

export const DEFAULT_MAPPING_HOST_PERMISSION = `${new URL(DEFAULT_MAPPING_URL).origin}/*`;

export const DATA_SOURCES: {
  id: DataSource;
  label: string;
  group: string;
}[] = [
  { id: "student.nim", label: "NIM", group: "Mahasiswa" },
  {
    id: "student.enrollmentYear",
    label: "Tahun angkatan",
    group: "Mahasiswa",
  },
  { id: "student.semester", label: "Semester", group: "Mahasiswa" },
  { id: "student.school", label: "School / Fakultas", group: "Mahasiswa" },
  { id: "student.major", label: "Major / Prodi", group: "Mahasiswa" },
  { id: "schedule.subject", label: "Mata kuliah", group: "Sesi" },
  { id: "schedule.classCode", label: "Kode kelas", group: "Sesi" },
  { id: "schedule.lecturer", label: "Dosen", group: "Sesi" },
  { id: "schedule.session", label: "Nomor pertemuan", group: "Sesi" },
  {
    id: "schedule.delivery",
    label: "Online / Offline",
    group: "Sesi",
  },
  {
    id: "rating.understanding",
    label: "Rating pemahaman",
    group: "Penilaian",
  },
  {
    id: "rating.interactivity",
    label: "Rating interaktivitas",
    group: "Penilaian",
  },
  {
    id: "rating.lecturerPerformance",
    label: "Rating dosen",
    group: "Penilaian",
  },
  {
    id: "feedback.understanding",
    label: "Feedback pemahaman",
    group: "Penilaian",
  },
  {
    id: "feedback.lecturer",
    label: "Feedback dosen",
    group: "Penilaian",
  },
];

const MAJOR_ALIASES: Record<string, string> = {
  "sains data": "Science Data",
  "data science": "Science Data",
  "ilmu komputer": "Computer Science",
  "sistem informasi": "Information System",
  "kecerdasan buatan": "Artificial Intelligence",
};

const SCHOOL_BY_MAJOR: Record<string, string> = {
  "Science Data": "School of AI & Computer Science",
  "Computer Science": "School of AI & Computer Science",
  "Information System": "School of AI & Computer Science",
  "Artificial Intelligence": "School of AI & Computer Science",
  "Digital Business": "School of Business Economics",
  "Finance & Investment": "School of Business Economics",
  Accounting: "School of Business Economics",
  "Business Management": "School of Business Economics",
  Psychology: "School of Psychology & Education",
  "Visual Communication Design": "School of Communication & Design",
  "Communication Science": "School of Communication & Design",
  "Electrical Engineering": "School of Engineering",
  "Environmental Engineering": "School of Engineering",
  "Industrial Engineering": "School of Engineering",
  "Business Law": "School of Law",
};

export const CUSTOM_SOURCE = "custom" as const;
export const CUSTOM_LABEL = "Custom mapping";
export const UNMAPPED_LABEL = "Unmapped";

export function sourceLabel(id: DataSource): string {
  if (id === CUSTOM_SOURCE) return CUSTOM_LABEL;
  return DATA_SOURCES.find((item) => item.id === id)?.label ?? id;
}

export function mappingSourceLabel(source: DataSource): string {
  return sourceLabel(source);
}

export function inferSourceFromTitle(title: string): DataSource | null {
  const t = title.replace(/<[^>]+>/g, "").trim().toLowerCase();
  if (t === "nim") return "student.nim";
  if (t.includes("lectures program")) return "schedule.delivery";
  if (t.includes("year of enrollment") || t.includes("angkatan")) {
    return "student.enrollmentYear";
  }
  if (t === "semester") return "student.semester";
  if (t === "school" || t.includes("fakultas")) return "student.school";
  if (t === "major" || t.includes("program studi") || t.includes("prodi")) {
    return "student.major";
  }
  if (t === "subject" || t.includes("mata kuliah")) return "schedule.subject";
  if (t.includes("class code") || t.includes("kode kelas")) {
    return "schedule.classCode";
  }
  if (t.includes("nama dosen") || t === "dosen") return "schedule.lecturer";
  if (t.includes("number of meetings") || t.includes("pertemuan")) {
    return "schedule.session";
  }
  if (t.includes("tingkat pemahaman")) return "rating.understanding";
  if (t.includes("belum kamu pahami")) return "feedback.understanding";
  if (t.includes("interaktif")) return "rating.interactivity";
  if (t.includes("performa mengajar") || t.includes("performa dosen")) {
    return "rating.lecturerPerformance";
  }
  if (t.includes("feedback untuk dosen")) return "feedback.lecturer";
  return null;
}

export function canonicalizeMajor(value: string): string {
  const trimmed = value.trim();
  return MAJOR_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

export function inferSchoolFromMajor(major: string): string | null {
  const canonical = canonicalizeMajor(major);
  return SCHOOL_BY_MAJOR[canonical] ?? null;
}

export function enrollmentYearFromNim(nim: string): string {
  const digits = nim.trim();
  if (digits.length >= 2 && /^\d{2}/.test(digits)) {
    return `20${digits.slice(0, 2)}`;
  }
  return "";
}

export function inferSemester(
  enrollmentYear: string,
  period: string,
): string {
  const year = Number(enrollmentYear);
  const match = period.match(/(\d{4})\s*\/\s*(\d{4})/);
  const academicStart = match ? Number(match[1]) : Number.NaN;
  if (!Number.isFinite(year) || !Number.isFinite(academicStart)) return "";

  const isOdd = /ganjil|odd/i.test(period);
  const yearsIn = academicStart - year + 1;
  if (yearsIn < 1) return "";
  const number = yearsIn * 2 - (isOdd ? 1 : 0);
  const labels: Record<number, string> = {
    1: "I (Odd)",
    2: "II (Even)",
    3: "III (Odd)",
    4: "IV (Even)",
    5: "V (Odd)",
  };
  return labels[number] ?? "";
}

export function isBuiltinSource(value: string): value is Exclude<DataSource, "custom"> {
  return DATA_SOURCES.some((item) => item.id === value);
}

export function isMappingSource(value: string): value is DataSource {
  return value === CUSTOM_SOURCE || isBuiltinSource(value);
}
