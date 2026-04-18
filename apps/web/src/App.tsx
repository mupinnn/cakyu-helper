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

      <Alert
        className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50"
        style={{ wordBreak: "break-word" }}
      >
        <AlertTriangleIcon />
        <AlertTitle>Perhatian!</AlertTitle>
        <AlertDescription className="gap-2">
          <p>
            Untuk saat ini, jadwal yang tertera hanya tersedia untuk kelas Sains
            Data Profesional Intake September 2025 yang sudah dipaketkan dan
            tidak termasuk jadwal kelas-kelas semester pendek atau pilihan
            individu.
          </p>
          <p>
            Jika kalian tertarik ingin menampilkan jadwal kelas kalian, hubungi{" "}
            <strong>YWhtYWQubXV3YWZmYXFAY2FrcmF3YWxhLmFjLmlk</strong> atau
            silakan gunakan{" "}
            <a
              href="https://github.com/mupinnn/cakyu-helper"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
            >
              repositori ini.
            </a>
          </p>
        </AlertDescription>
      </Alert>

      <Alert className="border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-50">
        <InfoIcon />
        <AlertTitle>Informasi</AlertTitle>
        <AlertDescription>
          Jadwal yang ditampilkan adalah jadwal mingguan dan diperbarui setiap
          hari Minggu.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="Sains Data" className="gap-4">
        <TabsList>
          <TabsTrigger value="Sains Data">
            Sains Data, Profesional (Sep 2025)
          </TabsTrigger>
        </TabsList>
        <TabsContent value="Sains Data">
          <div className="flex flex-col gap-6">
            {schedulesQuery.isPending ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6" />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <Skeleton className="h-40" />
                </div>
              </div>
            ) : schedulesQuery.isError ? (
              <p>Terjadi kesalahan.</p>
            ) : (
              schedulesQuery.data.schedules.map((schedule) => {
                const isToday = dayjs(schedule.title).isToday();

                return (
                  <div key={schedule.title} className="flex flex-col gap-2">
                    <p className="font-semibold underline flex items-center gap-2">
                      {isToday && (
                        <span className="inline-block size-2 bg-green-500 rounded-full" />
                      )}
                      {schedule.title}
                    </p>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      {schedule.items.map((item) => {
                        const parsedTimeRange = parseTimeRange(item.hour);
                        const startMin =
                          Number(parsedTimeRange?.start.hour) * 60 +
                          Number(parsedTimeRange?.start.minute);
                        const endMin =
                          Number(parsedTimeRange?.end.hour) * 60 +
                          Number(parsedTimeRange?.end.minute);
                        const today = new Date();
                        const nowMin =
                          today.getHours() * 60 + today.getMinutes();
                        const isClassStarted =
                          isToday && nowMin >= startMin && nowMin <= endMin;

                        return (
                          <Card
                            key={`${schedule.title}-${item.subject}`}
                            data-started={isClassStarted}
                            className="data-[started=true]:border-green-500 data-[started=true]:border-2"
                          >
                            <CardHeader>
                              <CardTitle>
                                {item.subject} ({item.subjectClassCode})
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2 [&_p]:flex [&_p]:items-center [&_p]:gap-2 [&_svg]:size-4 [&_svg]:shrink-0">
                                <p>
                                  <ClockIcon /> {item.hour}
                                </p>
                                <p>
                                  <UserIcon /> {item.lecturer}
                                </p>
                                <p>
                                  <DoorOpenIcon /> {item.room}
                                </p>
                                <p>
                                  <NotebookIcon /> {item.session}
                                </p>
                                <p>
                                  <PresentationIcon /> {item.type}
                                </p>
                              </div>
                            </CardContent>
                            <CardFooter className="gap-2 flex-wrap">
                              <FeedbackDialog
                                trigger={<Button>Isi Feedback</Button>}
                                schedule={item}
                              />
                              <Button
                                variant="outline"
                                onClick={() =>
                                  handleAddToGoogleCalendar(
                                    schedule.title ?? "",
                                    item,
                                  )
                                }
                              >
                                <CalendarPlusIcon /> Tambah ke Google Calendar
                              </Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
