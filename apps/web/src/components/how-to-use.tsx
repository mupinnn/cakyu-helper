import { BookOpenIcon, InfoIcon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { cn } from "@/lib/utils";

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="grid gap-3 sm:grid-cols-[auto_1fr] sm:gap-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {n}
      </span>
      <div className="space-y-3">
        <h3 className="pt-1 text-base font-medium text-foreground">{title}</h3>
        <div className="space-y-3 text-muted-foreground">{children}</div>
      </div>
    </li>
  );
}

function Screenshot({
  src,
  alt,
  caption,
  className,
}: {
  src: string;
  alt: string;
  caption: string;
  className?: string;
}) {
  return (
    <figure className={cn("overflow-hidden rounded-xl ring-1 ring-foreground/10", className)}>
      <img src={src} alt={alt} className="w-full bg-muted object-contain" />
      <figcaption className="border-t bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

export function HowToUse() {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <BookOpenIcon className="text-muted-foreground" />
        <CardTitle>Cara pakai prefill feedback</CardTitle>
        <CardDescription>
          Isi form dari kartu sesi RISE. Helper hanya menolong bagian yang
          berulang — penilaian tetap kamu yang tentukan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
          <InfoIcon />
          <AlertTitle>Isi jujur, jangan skip penilaian</AlertTitle>
          <AlertDescription>
            <p>
              Rating pemahaman dan performa dosen default-nya 5, dan kolom
              feedback dosen sering terisi <strong>"-"</strong>. Itu hanya
              penghemat waktu, bukan nilai yang harus dikirim. Kalau materi
              belum jelas atau ada masukan untuk dosen, ubah rating-nya dan
              tulis feedback yang sebenarnya — kampus pakai ini untuk
              memperbaiki kelas.
            </p>
          </AlertDescription>
        </Alert>

        <ol className="space-y-8">
          <Step n={1} title="Pasang ekstensi">
            <p>
              Chrome/Brave: unduh zip di atas, unzip, lalu load unpacked di{" "}
              <code className="text-foreground">chrome://extensions</code> atau{" "}
              <code className="text-foreground">brave://extensions</code>{" "}
              (Developer mode). Firefox 140+: unduh .xpi, buka{" "}
              <code className="text-foreground">about:addons</code>, gear →{" "}
              <strong className="text-foreground">Install Add-on From File…</strong>
            </p>
          </Step>

          <Step n={2} title="Buka sesi di RISE, klik Isi Feedback">
            <p>
              Buka halaman pembelajaran kelas di{" "}
              <a
                className="underline text-foreground"
                href="https://rise.cakrawala.ac.id"
                target="_blank"
                rel="noreferrer"
              >
                RISE
              </a>
              . Di kartu pertemuan, tombol{" "}
              <strong className="text-foreground">Isi Feedback</strong> muncul
              di samping Isi Presensi.
            </p>
            <Screenshot
              src="/schedule-screenshot.png"
              alt="Kartu sesi RISE dengan tombol Isi Feedback di samping Isi Presensi"
              caption="Kartu pertemuan RISE — klik Isi Feedback di samping Isi Presensi."
            />
          </Step>

          <Step n={3} title="Cek data di dialog, lalu buka Google Form">
            <p>
              NIM, prodi, mata kuliah, dan dosen terisi dari RISE dan tersimpan
              di browser. Periksa dropdown kalau nama RISE tidak persis sama
              dengan opsi form (misalnya kode kelas). Pastikan akun Google yang
              aktif sesuai email kampus, lalu klik{" "}
              <strong className="text-foreground">Buka Google Form</strong>.
            </p>
            <Screenshot
              src="/feedback-dialog-screenshot.png"
              alt="Dialog Isi Feedback dengan data mahasiswa dan sesi kelas"
              caption="Dialog Isi Feedback — cek data, isi penilaian, lalu buka Google Form."
              className="max-w-96"
            />
          </Step>

          <Step n={4} title="Tinjau prefill, isi penilaian, kirim">
            <p>
              Form terbuka dengan field yang sudah terisi. Tetap review sebelum
              submit: sesuaikan rating pemahaman dan performa dosen, isi topik
              yang belum dipahami jika rating pemahaman 4 atau kurang, dan
              tulis feedback dosen jika ada yang perlu disampaikan.
            </p>
          </Step>
        </ol>
      </CardContent>
    </Card>
  );
}
