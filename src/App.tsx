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
import { api } from "./lib/api.lib";

export function App() {
  const semestersQuery = useQuery({
    queryKey: ["semesters"],
    queryFn: async () => {
      const res = await api.api.semesters.$get();
      return await res.json();
    },
    enabled: false,
    throwOnError: true,
  });

  const handleFetchSemester = async () => {
    await semestersQuery.refetch();
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
        {!semestersQuery.data && semestersQuery.fetchStatus === "fetching" && (
          <Skeleton className="h-9 w-full" />
        )}
        {semestersQuery.data && (
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select a semester you want to scrape" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Semester Ganjil 2025</SelectItem>
            </SelectContent>
          </Select>
        )}
        {semestersQuery.data ? (
          <p>{semestersQuery.data.message}</p>
        ) : semestersQuery.isError ? (
          <span>Error: {semestersQuery.error.message}</span>
        ) : semestersQuery.isLoading ? (
          <span>Loading...</span>
        ) : (
          <span>Not ready ...</span>
        )}

        <div>{semestersQuery.isFetching ? "Fetching..." : null}</div>
      </section>

      <hr />

      <section className="flex flex-col gap-2 items-start">
        <Button variant="outline">Fetch "Semester Ganjil 2025" Schedule</Button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex flex-col p-4 border border-border-primary rounded space-y-1">
            <p>Selasa, 9 Sep 2025 - 18.00--20.00 - Kemang/Bali</p>
            <p>Human-Computer Interaction - HCI07</p>
            <Button>Add to Google Calendar</Button>
          </div>
        </div>
      </section>
    </main>
  );
}
