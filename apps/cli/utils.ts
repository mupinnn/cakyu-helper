import { type SchedulePart } from "@cakyu-helper/shared/types";

export function formatDateToYYYYMMDD(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCurrentWeekDates() {
  const dates = [];
  const today = new Date();
  const currentDayOfWeek = today.getDay();
  const currentDayOfMonth = today.getDate();
  const firstDay = new Date(today);

  firstDay.setDate(currentDayOfMonth - currentDayOfWeek);
  firstDay.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() + i);
    dates.push(formatDateToYYYYMMDD(date));
  }

  return dates;
}

export function subjectParser(nodes: Element[]) {
  const weeklySchedules = Array.from(nodes, (node) => {
    const columns = node.querySelectorAll("td");
    return Array.from(columns, (col) => col.innerText);
  });

  const subjects = weeklySchedules
    .filter(
      (schedule) =>
        schedule.length > 0 && !schedule[0]?.includes("Tidak ada jadwal"),
    )
    .map(([startHour, endHour, type, subject, material, room, lecturer]) => {
      const matches = subject?.match(/^(.+?)\s-\s(.+?)\s\((.+?)\)$/);
      const [, subjectCode, subjectName] = matches ?? [];

      return {
        subjectName,
        subjectCode,
      };
    });

  return subjects;
}

export function scheduleParser(
  nodes: Element[],
  subjects: { subjectName?: string; subjectCode?: string }[],
) {
  const result = [];
  let current: SchedulePart | null = null;

  for (const node of nodes) {
    if (node.classList.contains("title-hari")) {
      const title = node.querySelector("p")?.textContent.trim() ?? "";
      current = { title, items: [] };
      result.push(current);
      continue;
    }

    if (node.classList.contains("item-jadwal")) {
      if (!current) {
        current = { title: null, items: [] };
        result.push(current);
      }

      const subject =
        node.querySelector(".item-title")?.textContent.trim() ?? "";
      const splittedSubject = subject.split(/\(([^()]+)\)/);
      const cleanSubject = (splittedSubject[0] ?? "").trim();
      const subjectClassCode = (splittedSubject[1] ?? "").trim();
      const subjectCode =
        subjects.find((s) => s.subjectName === cleanSubject)?.subjectCode ?? "";
      const hour = node.querySelector(".jam")?.textContent.trim() ?? "";
      const lecturer = node.querySelector(".dosen")?.textContent.trim() ?? "";
      const room = node.querySelector(".ruang")?.textContent.trim() ?? "";
      const session =
        node.querySelector(".pertemuan")?.textContent.trim() ?? "";
      const sessionNo = Number(session.replace(/[^0-9]/g, ""));
      const type = node.querySelector(".jenis")?.textContent.trim() ?? "Kuliah";

      current.items.push({
        subject: cleanSubject,
        subjectClassCode,
        subjectCode,
        hour,
        lecturer,
        room,
        session,
        sessionNo,
        type,
      });
    }
  }

  return result;
}
