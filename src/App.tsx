import { Button } from "./components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./components/ui/select";

export function App() {
  return (
    <main className="flex flex-col gap-4 max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold underline">
        Cakyu SIAKAD to Google Calendar{" "}
      </h1>

      <section className="flex flex-col gap-2 items-start">
        <Button variant="outline">Fetch Semester</Button>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select a semester you want to scrape" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Semester Ganjil 2025</SelectItem>
          </SelectContent>
        </Select>
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
