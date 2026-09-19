import type {
  DataSource,
  FieldMapping,
  FormConfig,
  RatingPayload,
  ResolvedField,
  SessionContext,
  StudentProfile,
} from "./types";
import { matchChoice, sessionOption } from "./match";
import { canonicalizeMajor } from "./sources";

export function extractFormId(url: string): string | null {
  const encoded = url.match(/\/forms\/d\/e\/([^/]+)/);
  if (encoded?.[1]) return encoded[1];
  const id = url.match(/\/forms\/d\/([^/]+)/);
  return id?.[1] ?? null;
}

export function mappingApplies(
  mapping: FieldMapping,
  school: string,
): boolean {
  if (!mapping.when?.school) return true;
  return mapping.when.school === school;
}

export function activeMappings(
  mappings: FieldMapping[],
  school: string,
): FieldMapping[] {
  return mappings.filter((mapping) => mappingApplies(mapping, school));
}

export function choicesFor(
  mappings: FieldMapping[],
  source: DataSource,
  school: string,
): string[] {
  const hit = mappings.find(
    (mapping) => mapping.source === source && mappingApplies(mapping, school),
  );
  return hit?.choices ?? [];
}

export function customKeyOf(mapping: FieldMapping): string {
  return mapping.customKey ?? mapping.entryId;
}

export function customMappings(
  mappings: FieldMapping[],
  school: string,
): FieldMapping[] {
  return activeMappings(mappings, school).filter(
    (mapping) => mapping.source === "custom",
  );
}

export function sourceValue(
  mapping: FieldMapping,
  profile: StudentProfile,
  session: SessionContext,
  ratings: RatingPayload,
  mappings: FieldMapping[],
): string {
  if (mapping.source === "custom") {
    return profile.extras[customKeyOf(mapping)] ?? "";
  }

  switch (mapping.source) {
    case "student.nim":
      return profile.nim;
    case "student.enrollmentYear":
      return profile.enrollmentYear;
    case "student.semester":
      return profile.semester;
    case "student.school":
      return profile.school;
    case "student.major":
      return canonicalizeMajor(profile.major);
    case "schedule.subject":
      return session.subject;
    case "schedule.classCode":
      return session.classCode;
    case "schedule.lecturer":
      return session.lecturer;
    case "schedule.session":
      return sessionOption(
        session.sessionNo,
        session.isUts,
        session.isUas,
        choicesFor(mappings, "schedule.session", profile.school),
      );
    case "schedule.delivery":
      return session.delivery;
    case "rating.understanding": {
      const options = choicesFor(
        mappings,
        "rating.understanding",
        profile.school,
      );
      return options[ratings.understanding - 1] ?? String(ratings.understanding);
    }
    case "rating.interactivity": {
      const options = choicesFor(
        mappings,
        "rating.interactivity",
        profile.school,
      );
      return options[ratings.interactivity - 1] ?? String(ratings.interactivity);
    }
    case "rating.lecturerPerformance": {
      const options = choicesFor(
        mappings,
        "rating.lecturerPerformance",
        profile.school,
      );
      return (
        options[ratings.lecturerPerformance - 1] ??
        String(ratings.lecturerPerformance)
      );
    }
    case "feedback.understanding":
      return ratings.feedbackUnderstanding;
    case "feedback.lecturer":
      return ratings.feedbackLecturer;
    default:
      return "";
  }
}

export function resolveMappings(
  config: FormConfig,
  profile: StudentProfile,
  session: SessionContext,
  ratings: RatingPayload,
): ResolvedField[] {
  return activeMappings(config.mappings, profile.school).map((mapping) => {
    const raw = sourceValue(
      mapping,
      profile,
      session,
      ratings,
      config.mappings,
    );
    const matched = matchChoice(raw, mapping.choices);
    return {
      mapping,
      raw,
      value: matched.match,
      confidence: matched.confidence,
    };
  });
}

export function buildPrefillUrl(
  formUrl: string,
  fields: ResolvedField[],
): string {
  const url = new URL(formUrl);
  for (const field of fields) {
    if (!field.value) continue;
    url.searchParams.set(field.mapping.entryId, field.value);
  }
  return url.toString();
}

export function emptyProfile(): StudentProfile {
  return {
    nim: "",
    enrollmentYear: "",
    semester: "",
    school: "",
    major: "",
    extras: {},
  };
}

export function emptyRatings(): RatingPayload {
  return {
    overall: 5,
    understanding: 5,
    interactivity: 5,
    lecturerPerformance: 5,
    feedbackUnderstanding: "-",
    feedbackLecturer: "-",
  };
}
