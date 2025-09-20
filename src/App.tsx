import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { api } from "./lib/api.lib";

export function App() {
  const [selectedSemester, setSelectedSemester] = useState<string>();

  const semestersQuery = useQuery({
    queryKey: ["semesters"],
    queryFn: async () => {
      const res = await api.api.semesters.$get();
      return await res.json();
    },
    enabled: false,
    throwOnError: true,
  });

  const schedulesQuery = useQuery({
    queryKey: ["schedules", selectedSemester],
    queryFn: async () => {
      const res = await api.api.schedule.$get({
        query: {
          semester: selectedSemester ?? "",
        },
      });
      return await res.json();
    },
    enabled: false,
    throwOnError: true,
  });

  const handleFetchSemester = async () => {
    await semestersQuery.refetch();
  };

  const handleFetchSchedule = async () => {
    await schedulesQuery.refetch();
  };

  return (
    <main className="flex flex-col gap-4 max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold underline">
        Cakyu SIAKAD to Google Calendar{" "}
      </h1>

      <section className="flex flex-col gap-2 items-start">
        <Button variant="outline" onClick={handleFetchSemester}>
          Fetch Semester
        </Button>

        {semestersQuery.data ? (
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger>
              <SelectValue placeholder="Select a semester you want to scrape" />
            </SelectTrigger>
            <SelectContent>
              {semestersQuery.data.semesters.map((semester) => (
                <SelectItem key={semester.value} value={semester.value}>
                  {semester.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : semestersQuery.isError ? (
          <span>
            Error while fetching semesters: {semestersQuery.error.message}
          </span>
        ) : semestersQuery.isLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : null}
      </section>

      <hr />

      {selectedSemester && (
        <section className="flex flex-col gap-2 items-start">
          <Button variant="outline" onClick={handleFetchSchedule}>
            Fetch "
            {
              semestersQuery.data?.semesters.find(
                (s) => s.value === selectedSemester,
              )?.label
            }
            " Schedule
          </Button>

          {schedulesQuery.data ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {schedulesQuery.data.schedules.map((schedule) => (
                <div
                  key={schedule.no}
                  className="flex flex-col p-4 border border-border-primary rounded space-y-1"
                >
                  <Badge variant="secondary">{schedule.room}</Badge>
                  <p className="text-sm">
                    {schedule.day}, {schedule.date} - {schedule.startHour}–
                    {schedule.endHour}
                  </p>
                  <p className="font-semibold mb-4">{schedule.subject}</p>
                  <Button>Add to Google Calendar</Button>
                </div>
              ))}
            </div>
          ) : schedulesQuery.isError ? (
            <span>
              Error while fetching schedules: {schedulesQuery.error.message}
            </span>
          ) : schedulesQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : null}
        </section>
      )}
    </main>
  );
}
