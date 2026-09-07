import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import dayjsCustomParseFormat from "dayjs/plugin/customParseFormat";
import dayjsIsToday from "dayjs/plugin/isToday";
import dayjsIsBetween from "dayjs/plugin/isBetween";
import {
  ClockIcon,
  UserIcon,
  DoorOpenIcon,
  NotebookIcon,
  AlertTriangleIcon,
  InfoIcon,
  PresentationIcon,
  CalendarPlusIcon,
} from "lucide-react";
import { type ScheduleItem } from "@cakyu-helper/shared/types";
import { Button } from "./components/ui/button";
import { Skeleton } from "./components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./components/ui/card";
import { FeedbackDialog } from "./components/feedback-dialog";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { apiClient } from "./lib/api.lib";
import { parseTimeRange } from "./lib/utils";

import "dayjs/locale/id";

dayjs.locale("id-ID");
dayjs.extend(dayjsCustomParseFormat);
dayjs.extend(dayjsIsToday);
dayjs.extend(dayjsIsBetween);

export function App() {
  const schedulesQuery = useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const response = await apiClient.api.schedules.$get({
        query: {
          studyProgram: "Sains Data",
          classType: "Profesional",
          ongoingSemester: "II (Genap)",
          intakeYear: "2025",
          intakeMonth: "September",
        },
      });
      if (!response.ok)
        throw new Error("Terjadi kesalahan ketika mengambil jadwal.");
      return await response.json();
    },
  });

  function handleAddToGoogleCalendar(date: string, schedule: ScheduleItem) {
    const parsedTimeRange = parseTimeRange(schedule.hour);
    const startDate = new Date(
      `${date} ${parsedTimeRange?.start?.hour}:${parsedTimeRange?.start?.minute}`,
    )
      .toISOString()
      .replace(/-|:|\.\d+/g, "");
    const endDate = new Date(
      `${date} ${parsedTimeRange?.end?.hour}:${parsedTimeRange?.end?.minute}`,
    )
      .toISOString()
      .replace(/-|:|\.\d+/g, "");
    const googleCalendarURL = new URL(
      "https://calendar.google.com/calendar/render?action=TEMPLATE",
    );
    googleCalendarURL.searchParams.set(
      "text",
      `[Kuliah] ${schedule.subject} - ${schedule.room}`,
    );
    googleCalendarURL.searchParams.set("dates", `${startDate}/${endDate}`);
    window.open(googleCalendarURL.toString(), "_blank");
  }

  return (
    <main className="3xl:max-w-screen-2xl mx-auto max-w-[1400px] p-4 lg:p-8 flex flex-1 scroll-mt-20 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Cakyu Class Helper
        </h1>
        <p className="text-muted-foreground">
          A helpful tools for your daily classes chores like filling feedback
          form :)
        </p>
      </div>

      <Alert className="border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-50">
        <InfoIcon />
        <AlertTitle>Informasi</AlertTitle>
        <AlertDescription>Sehubungan dengan adanya pembaruan sistem akademik Cakyu, Cakyu Helper ini untuk sementara waktu tidak bisa digunakan.</AlertDescription>
      </Alert>
    </main>
  );
}
