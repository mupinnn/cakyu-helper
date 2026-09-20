import { PuzzleIcon, MapIcon, HeartIcon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "./components/ui/card";
import { DownloadExtension } from "./components/download-extension";
import { HowToUse } from "./components/how-to-use";
import { GITHUB_REPO_URL, GITHUB_USER_URL } from "./lib/github-releases";

export function App() {
  return (
    <div className="flex min-h-svh flex-col">
      <main className="3xl:max-w-screen-2xl mx-auto flex w-full max-w-[1400px] flex-1 scroll-mt-20 flex-col gap-6 p-4 lg:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Cakyu Class Helper
        </h1>
        <p className="text-muted-foreground">
          Prefill form feedback kuliah dari sesi RISE, tanpa mengisi NIM dan
          kode kelas berulang-ulang.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <PuzzleIcon className="text-muted-foreground" />
            <CardTitle>Pasang ekstensi</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2">
            <DownloadExtension />
          </CardContent>
        </Card>

        <HowToUse />

        <Card className="md:col-span-2">
          <CardHeader>
            <MapIcon className="text-muted-foreground" />
            <CardTitle>Form baru? Map sendiri</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2">
            <p>
              Tempel URL Google Form di dialog Isi Feedback. Di halaman form,
              pakai <strong className="text-foreground">Map form</strong> lalu
              klik pertanyaan untuk bind ke NIM, mata kuliah, rating, dan
              seterusnya.
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        Default mapping semester ganjil 2026/2027 ada di{" "}
        <a className="underline" href="/mappings/default.json">
          /mappings/default.json
        </a>
        . Mapping override milikmu tidak pernah dikirim ke server.
      </p>
      </main>
      <footer className="border-t">
        <div className="3xl:max-w-screen-2xl mx-auto flex w-full max-w-[1400px] flex-col gap-1 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>
            Proyek ini open source di{" "}
            <a
              className="text-foreground underline"
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            .
          </p>
          <p className="inline-flex items-center gap-1">
            Built with
            <HeartIcon
              className="size-3.5 fill-current text-rose-500"
              aria-hidden
            />
            by{" "}
            <a
              className="text-foreground underline"
              href={GITHUB_USER_URL}
              target="_blank"
              rel="noreferrer"
            >
              @mupinnn
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
