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

function isDegreeToken(token: string): boolean {
  const t = token.replace(/^[(-]+|[)-]+$/g, "");
  if (!t) return true;
  if (t.includes(".")) return true;
  return /^(mba|mm|st|se|sh|ak|phd|msc|mcs|mt|mti|psi|kom|s|m)$/i.test(t);
}

/** Personal name without titles/degrees: "Faridho, S.Kom, M.Kom" / "Faridho M.sc" → "faridho". */
export function nameStem(value: string): string {
  let s = value.toLowerCase().trim();
  s = s.replace(/^(?:dr\.?\s*(?:\(c\))?\s*|prof\.?\s*|ir\.?\s*)+/i, "");
  const comma = s.indexOf(",");
  if (comma !== -1) s = s.slice(0, comma);
  const tokens = s.split(/\s+/).filter(Boolean);
  while (tokens.length > 1 && isDegreeToken(tokens[tokens.length - 1] ?? "")) {
    tokens.pop();
  }
  return tokens.join(" ").replace(/[^a-z0-9 ]+/g, "").replace(/\s+/g, " ").trim();
}

function uniqueHit(
  choices: string[],
  predicate: (choice: string) => boolean,
): string | undefined {
  const hits = choices.filter(predicate);
  return hits.length === 1 ? hits[0] : undefined;
}

function isPrefixOrStemMatch(needle: string, choice: string): boolean {
  const n = needle.trim().toLowerCase();
  const c = choice.trim().toLowerCase();
  if (!n) return false;
  if (c.startsWith(n) && (c.length === n.length || /[\s,]/.test(c[n.length] ?? ""))) {
    return true;
  }
  const needleStem = nameStem(needle);
  const choiceStem = nameStem(choice);
  return Boolean(needleStem) && needleStem === choiceStem;
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

  const prefix = uniqueHit(choices, (choice) =>
    isPrefixOrStemMatch(trimmed, choice),
  );
  if (prefix) return { match: prefix, confidence: "fuzzy" };

  const included = uniqueHit(
    choices,
    (choice) =>
      choice.toLowerCase().includes(trimmed.toLowerCase()) ||
      trimmed.toLowerCase().includes(choice.toLowerCase()),
  );
  if (included) return { match: included, confidence: "fuzzy" };

  const needle = normalize(trimmed);
  const normalizedHits = uniqueHit(
    choices,
    (choice) => normalize(choice) === needle,
  );
  if (normalizedHits) return { match: normalizedHits, confidence: "fuzzy" };

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

export function lookupOverride(
  raw: string,
  overrides: Record<string, string> | undefined,
): string {
  if (!overrides) return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (overrides[trimmed]) return overrides[trimmed];
  const key = trimmed.toLowerCase();
  const hit = Object.entries(overrides).find(
    ([stored]) => stored.trim().toLowerCase() === key,
  );
  return hit?.[1] ?? "";
}

/** Match a RISE value to form options. Last pick is used only when matching fails. */
export function resolveChoice(
  raw: string,
  options: string[],
  overrides?: Record<string, string>,
): string {
  const matched = matchChoice(raw, options);
  if (matched.match) return matched.match;
  const override = lookupOverride(raw, overrides);
  if (!override) return raw;
  return matchChoice(override, options).match || override;
}

/** Persist a pick only when the RISE default did not match a form option. */
export function rememberOverride(
  raw: string,
  selected: string,
  options: string[],
  existing?: Record<string, string>,
): Record<string, string> {
  const next = { ...existing };
  const key = raw.trim();
  if (!key) return next;

  for (const stored of Object.keys(next)) {
    if (stored.trim().toLowerCase() === key.toLowerCase()) {
      delete next[stored];
    }
  }

  const matched = matchChoice(raw, options);
  if (matched.match) return next;

  const selectedMatch = matchChoice(selected, options);
  const isRealOption = Boolean(selectedMatch.match) || options.includes(selected);
  if (isRealOption && selected !== raw) {
    next[key] = selectedMatch.match || selected;
  }
  return next;
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
