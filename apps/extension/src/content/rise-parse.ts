import { normalizeLecturer } from "../shared/match";
import type { SessionContext } from "../shared/types";

function text(node: Element | null | undefined): string {
  return (node?.textContent ?? "").replace(/\s+/g, " ").trim();
}

function labeledValue(root: ParentNode, label: string): string {
  const candidates = root.querySelectorAll("h6, span");
  for (const node of candidates) {
    if (text(node) !== label) continue;
    const sibling = node.nextElementSibling;
    if (sibling) return text(sibling);
    const parentText = text(node.parentElement).replace(label, "").trim();
    if (parentText) return parentText;
  }
  return "";
}

function firstMatching(
  root: ParentNode,
  selector: string,
  predicate: (el: Element) => boolean,
): Element | null {
  for (const node of root.querySelectorAll(selector)) {
    if (predicate(node)) return node;
  }
  return null;
}

export function parseStudentChrome(root: ParentNode = document): {
  name: string;
  nim: string;
  major: string;
} {
  const name = text(
    firstMatching(root, "p", (el) =>
      el.className.includes("font-semibold"),
    ),
  );
  const meta = text(
    firstMatching(root, "p", (el) => /-\s+/.test(text(el)) && /\d{8,}/.test(text(el))),
  );
  const [nim, ...rest] = meta.split(" - ");
  return {
    name,
    nim: nim?.trim() ?? "",
    major: rest.join(" - ").trim(),
  };
}

export function parseCourseHeader(root: ParentNode = document): {
  subject: string;
  classCode: string;
  classCodeFull: string;
  lecturer: string;
  period: string;
} {
  const subject = text(root.querySelector("h4.text-white, h4.font-bold"));
  const kelas = text(
    firstMatching(root, "span", (el) => text(el).startsWith("Kelas:")),
  );
  const classCode = kelas.replace(/^Kelas:\s*/i, "").trim();
  const classCodeFull = labeledValue(root, "Kode Kelas");
  return {
    subject,
    classCode:
      classCode || classCodeFull.split("/").filter(Boolean).at(-1) || "",
    classCodeFull,
    lecturer: normalizeLecturer(labeledValue(root, "Dosen Pengajar")),
    period: labeledValue(root, "Periode Akademik"),
  };
}

export function parseSessionCard(
  card: HTMLElement,
  header = parseCourseHeader(),
  student = parseStudentChrome(),
): SessionContext | null {
  const idMatch = card.id.match(/^session-(\d+)$/);
  const sessionNo = idMatch ? Number(idMatch[1]) : Number.NaN;
  if (!Number.isFinite(sessionNo)) return null;

  const body = text(card);
  const isUts = /\bUts\b/i.test(body);
  const isUas = /\bUas\b/i.test(body);
  const hasZoom = [...card.querySelectorAll("button")].some((button) =>
    text(button).includes("Link Zoom"),
  );
  const room = labeledValue(card, "Ruang");
  const lecturer =
    normalizeLecturer(labeledValue(card, "Dosen Pengajar")) || header.lecturer;

  return {
    subject: header.subject,
    classCode: header.classCode,
    classCodeFull: header.classCodeFull,
    lecturer,
    period: header.period,
    sessionNo,
    sessionLabel: `Sesi ${sessionNo}`,
    isUts,
    isUas,
    date: labeledValue(card, "Tanggal"),
    time: labeledValue(card, "Waktu"),
    room,
    hasZoom,
    delivery: !room && hasZoom ? "Online" : "On-site/Offline",
    studentName: student.name,
    studentNim: student.nim,
    studentMajor: student.major,
  };
}

export function findPresensiRow(card: HTMLElement): HTMLElement | null {
  const button = [...card.querySelectorAll("button")].find((node) =>
    text(node).includes("Isi Presensi"),
  );
  return (button?.parentElement as HTMLElement | null) ?? null;
}

export function sessionCards(root: ParentNode = document): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>("div[id^='session-']")];
}
