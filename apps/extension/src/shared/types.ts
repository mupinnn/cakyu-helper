export type DataSource =
  | "student.nim"
  | "student.enrollmentYear"
  | "student.semester"
  | "student.school"
  | "student.major"
  | "schedule.subject"
  | "schedule.classCode"
  | "schedule.lecturer"
  | "schedule.session"
  | "schedule.delivery"
  | "rating.understanding"
  | "rating.interactivity"
  | "rating.lecturerPerformance"
  | "feedback.understanding"
  | "feedback.lecturer"
  | "custom";

export type FieldType = "text" | "paragraph" | "radio" | "dropdown";

export type FieldMapping = {
  entryId: string;
  title: string;
  type: FieldType;
  source: DataSource;
  customKey?: string;
  when?: { school: string };
  choices?: string[];
};

export type FormConfig = {
  formId: string;
  formUrl: string;
  title?: string;
  mappings: FieldMapping[];
};

export type StudentProfile = {
  nim: string;
  enrollmentYear: string;
  semester: string;
  school: string;
  major: string;
  extras: Record<string, string>;
};

export type SessionContext = {
  subject: string;
  classCode: string;
  classCodeFull: string;
  lecturer: string;
  period: string;
  sessionNo: number;
  sessionLabel: string;
  isUts: boolean;
  isUas: boolean;
  date: string;
  time: string;
  room: string;
  hasZoom: boolean;
  delivery: "Online" | "On-site/Offline";
  studentName: string;
  studentNim: string;
  studentMajor: string;
};

export type RatingPayload = {
  overall: number;
  understanding: number;
  interactivity: number;
  lecturerPerformance: number;
  feedbackUnderstanding: string;
  feedbackLecturer: string;
};

export type MatchConfidence = "exact" | "fuzzy" | "none";

export type ResolvedField = {
  mapping: FieldMapping;
  raw: string;
  value: string;
  confidence: MatchConfidence;
};

export type DialogDefaults = {
  sessionChoice?: string;
  delivery?: SessionContext["delivery"];
  ratings?: RatingPayload;
  customizeLecturer?: boolean;
};

export type ExtensionStorage = {
  formUrl?: string;
  profile?: StudentProfile;
  mappingOverrides?: Record<string, FieldMapping[]>;
  publishedDefault?: FormConfig;
  dialogDefaults?: DialogDefaults;
};
