export type ScheduleItem = {
  subject: string;
  subjectCode: string;
  hour: string;
  lecturer: string;
  room: string;
  session: string;
  sessionNo: number;
};

export type SchedulePart = {
  title: string | null;
  items: ScheduleItem[];
};

export type Schedule = {
  schedules: SchedulePart[];
  studyProgram: string;
  dateFrom: string;
  dateTo: string;
  updatedAt: string;
};
