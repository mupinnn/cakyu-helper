import { PuzzleIcon, MapIcon, GraduationCapIcon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "./components/ui/card";
import { DownloadExtension } from "./components/download-extension";

export function App() {
  return (
    <main className="3xl:max-w-screen-2xl mx-auto max-w-[1400px] p-4 lg:p-8 flex flex-1 scroll-mt-20 flex-col gap-6">
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
        <Card>
          <CardHeader>
            <GraduationCapIcon className="text-muted-foreground" />
            <CardTitle>Isi dari RISE</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2">
            <p>
              Buka halaman sesi pembelajaran di RISE. Tombol{" "}
              <strong className="text-foreground">Isi Feedback</strong> muncul
              di samping Isi Presensi. Data mahasiswa tersimpan di browser.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <MapIcon className="text-muted-foreground" />
            <CardTitle>Form baru? Map sendiri</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2">
            <p>
              Tempel URL Google Form di popup ekstensi. Di halaman form, pakai{" "}
              <strong className="text-foreground">Map form</strong> lalu klik
              pertanyaan untuk bind ke NIM, mata kuliah, rating, dan seterusnya.
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
  );
}
