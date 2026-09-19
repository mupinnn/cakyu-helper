import type { MatchConfidence } from "./types";

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, (_, i) => {
    const row = Array.from({ length: cols }, (__, j) =>
      i === 0 ? j : j === 0 ? i : 0,
    );
    return row;
  });

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const row = matrix[i];
      const prev = matrix[i - 1];
      if (!row || !prev) continue;
      row[j] = Math.min(
        (prev[j] ?? 0) + 1,
        (row[j - 1] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost,
      );
    }
  }

  return matrix[a.length]?.[b.length] ?? Math.max(a.length, b.length);
}

export function matchChoice(
  value: string,
  choices: string[] | undefined,
): { match: string; confidence: MatchConfidence } {
  const trimmed = value.trim();
  if (!trimmed) return { match: "", confidence: "none" };
  if (!choices?.length) return { match: trimmed, confidence: "exact" };

  const exact = choices.find(
    (choice) => choice === trimmed || choice.toLowerCase() === trimmed.toLowerCase(),
  );
  if (exact) return { match: exact, confidence: "exact" };

  const included = choices.filter(
    (choice) =>
      choice.toLowerCase().includes(trimmed.toLowerCase()) ||
      trimmed.toLowerCase().includes(choice.toLowerCase()),
  );
  if (included.length === 1 && included[0]) {
    return { match: included[0], confidence: "fuzzy" };
  }

  const needle = normalize(trimmed);
  const normalizedHits = choices.filter(
    (choice) => normalize(choice) === needle,
  );
  if (normalizedHits.length === 1 && normalizedHits[0]) {
    return { match: normalizedHits[0], confidence: "fuzzy" };
  }

  const ranked = choices
    .map((choice) => ({
      choice,
      distance: levenshtein(needle, normalize(choice)),
    }))
    .sort((a, b) => a.distance - b.distance);

  const best = ranked[0];
  const second = ranked[1];
  const maxDistance = Math.max(1, Math.floor(needle.length / 3));
  if (
    best &&
    best.distance <= maxDistance &&
    (!second || best.distance < second.distance)
  ) {
    return { match: best.choice, confidence: "fuzzy" };
  }

  return { match: "", confidence: "none" };
}

export function sessionOption(
  sessionNo: number,
  isUts: boolean,
  isUas: boolean,
  choices: string[] | undefined,
): string {
  if (isUts || sessionNo === 8) {
    const midterm = choices?.find((choice) => /midterm|uts/i.test(choice));
    if (midterm) return midterm;
  }
  if (isUas || sessionNo === 16) {
    const finalExam = choices?.find((choice) => /final|uas/i.test(choice));
    if (finalExam) return finalExam;
  }
  const exact = choices?.find((choice) => choice === String(sessionNo));
  if (exact) return exact;
  return String(sessionNo);
}

export function normalizeLecturer(value: string): string {
  return value.replace(/^(?:-\s*)+/, "").trim();
}
