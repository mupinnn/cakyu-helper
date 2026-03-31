import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import dayjsCustomParseFormat from "dayjs/plugin/customParseFormat";
import {
  ClockIcon,
  UserIcon,
  DoorOpenIcon,
  NotebookIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Skeleton } from "./components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card";
import { FeedbackDialog } from "./components/feedback-dialog";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { apiClient } from "./lib/api.lib";

import "dayjs/locale/id";

dayjs.extend(dayjsCustomParseFormat);

export function App() {
  const schedulesQuery = useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const response = await apiClient.api.schedules.$get({
        query: { studyProgram: "Sains Data" },
      });
      if (!response.ok)
        throw new Error("Terjadi kesalahan ketika mengambil jadwal.");
      return await response.json();
    },
  });

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

      <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
        <AlertTriangleIcon />
        <AlertTitle>Perhatian!</AlertTitle>
        <AlertDescription>
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

      <Tabs defaultValue="Sains Data" className="gap-4">
        <TabsList>
          <TabsTrigger value="Sains Data">
            Sains Data, Profesional (2025)
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
                return (
                  <div key={schedule.title} className="flex flex-col gap-2">
                    <p className="font-semibold underline flex items-center gap-2">
                      <span className="inline-block size-2 bg-green-500 rounded-full" />{" "}
                      {schedule.title}
                    </p>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      {schedule.items.map((item) => (
                        <Card key={`${schedule.title}-${item.subject}`}>
                          <CardHeader>
                            <CardTitle>{item.subject}</CardTitle>
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
                            </div>

                            <FeedbackDialog
                              trigger={<Button>Isi Feedback</Button>}
                              schedule={item}
                            />
                          </CardContent>
                        </Card>
                      ))}
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
