export type ScheduleItem = {
  subject: string;
  subjectCode: string;
  subjectClassCode: string;
  hour: string;
  lecturer: string;
  room: string;
  session: string;
  sessionNo: number;
  type: string;
};

export type SchedulePart = {
  title: string | null;
  items: ScheduleItem[];
};

export type Schedule = {
  schedules: SchedulePart[];
  studyProgram: string;
  classType: string;
  intakeYear: string;
  ongoingSemester: string;
  dateFrom?: string;
  dateTo?: string;
  updatedAt: string;
};
