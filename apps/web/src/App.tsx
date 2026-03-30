import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { type InferResponseType, type InferRequestType } from "hono/client";
import dayjs from "dayjs";
import dayjsCustomParseFormat from "dayjs/plugin/customParseFormat";
import { ClockIcon, UserIcon, DoorOpenIcon, NotebookIcon } from "lucide-react";
import { Button } from "./components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./components/ui/select";
import { Skeleton } from "./components/ui/skeleton";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/ui/card";
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
                  <div className="flex flex-col gap-2">
                    <p className="font-semibold underline flex items-center gap-2">
                      <div className="size-2 bg-green-500 rounded-full" />{" "}
                      {schedule.title}
                    </p>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      {schedule.items.map((item) => (
                        <Card>
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

                            <Button>Isi Feedback</Button>
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
