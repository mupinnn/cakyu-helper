import { useQuery } from "@tanstack/react-query";
import { DownloadIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import {
  GITHUB_RELEASES_PAGE,
  RELEASES_STALE_TIME_MS,
  fetchExtensionReleases,
  isCacheFresh,
  readCachedReleases,
  writeCachedReleases,
  type ExtensionRelease,
} from "@/lib/github-releases";

const cache = typeof window === "undefined" ? undefined : readCachedReleases();
const cacheIsFresh = cache ? isCacheFresh(cache.savedAt) : false;

function CloneBuildFallback({ asAlternative }: { asAlternative?: boolean }) {
  return (
    <div className="space-y-2">
      <p>{asAlternative ? "Atau build dari source:" : "Build dari source:"}</p>
      <ol className="list-decimal list-inside space-y-1">
        <li>
          Clone repo lalu build{" "}
          <code className="text-foreground">apps/extension</code>
        </li>
        <li>
          Chrome/Brave:{" "}
          <code className="text-foreground">chrome://extensions</code> atau{" "}
          <code className="text-foreground">brave://extensions</code>, Load
          unpacked folder{" "}
          <code className="text-foreground">apps/extension/dist</code>
        </li>
        <li>
          Firefox (sementara):{" "}
          <code className="text-foreground">
            about:debugging#/runtime/this-firefox
          </code>
          , Load Temporary Add-on, pilih{" "}
          <code className="text-foreground">apps/extension/dist/manifest.json</code>
        </li>
      </ol>
    </div>
  );
}

function ChromiumInstallSteps() {
  return (
    <ol className="list-decimal space-y-1 pl-4">
      <li>Unzip file yang diunduh</li>
      <li>
        Buka <code className="text-foreground">chrome://extensions</code> atau{" "}
        <code className="text-foreground">brave://extensions</code>
      </li>
      <li>Aktifkan Developer mode</li>
      <li>Load unpacked, pilih folder hasil unzip</li>
    </ol>
  );
}

function FirefoxInstallSteps() {
  return (
    <ol className="list-decimal space-y-1 pl-4">
      <li>Unduh file .xpi</li>
      <li>
        Buka <code className="text-foreground">about:addons</code>
      </li>
      <li>
        Klik ikon gear, lalu <strong className="text-foreground">Install Add-on From File…</strong>
      </li>
      <li>Pilih file .xpi dan izinkan pemasangan</li>
    </ol>
  );
}

function Checksum({ value }: { value: string | null }) {
  if (!value) return null;
  return (
    <p className="text-xs break-all">
      SHA-256: <code className="text-foreground">{value}</code>
    </p>
  );
}

function BrowserSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-foreground text-sm font-medium">{title}</p>
      {children}
    </div>
  );
}

function LatestDownloads({ latest }: { latest: ExtensionRelease }) {
  return (
    <div className="space-y-4">
      <BrowserSection title="Chrome atau Brave, mode developer">
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <a href={latest.zipUrl} download={latest.zipName}>
              <DownloadIcon />
              Unduh zip {latest.tag}
            </a>
          </Button>
          {latest.sha256sumsUrl ? (
            <Button asChild variant="outline" size="sm">
              <a href={latest.sha256sumsUrl} download="SHA256SUMS">
                SHA256SUMS
              </a>
            </Button>
          ) : null}
        </div>
        <Checksum value={latest.sha256} />
        <ChromiumInstallSteps />
      </BrowserSection>

      <BrowserSection title="Firefox 140+ (XPI bertanda tangan Mozilla)">
        {latest.xpiUrl && latest.xpiName ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild>
                <a href={latest.xpiUrl} download={latest.xpiName}>
                  <DownloadIcon />
                  Unduh xpi {latest.tag}
                </a>
              </Button>
            </div>
            <Checksum value={latest.xpiSha256} />
            <FirefoxInstallSteps />
          </>
        ) : (
          <p>
            File .xpi belum ada di rilis ini. Build dari source lalu load
            sementara lewat{" "}
            <code className="text-foreground">about:debugging</code>, atau
            tunggu rilis berikutnya.
          </p>
        )}
      </BrowserSection>
    </div>
  );
}

export function DownloadExtension() {
  const { data, isPending } = useQuery({
    queryKey: ["github-releases"],
    queryFn: async () => {
      const releases = await fetchExtensionReleases();
      if (releases.length > 0) {
        writeCachedReleases(releases);
      }
      return releases;
    },
    staleTime: RELEASES_STALE_TIME_MS,
    gcTime: RELEASES_STALE_TIME_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
    initialData: cacheIsFresh ? cache?.data : undefined,
    initialDataUpdatedAt: cacheIsFresh ? cache?.savedAt : undefined,
    placeholderData: cacheIsFresh ? undefined : cache?.data,
  });

  const [latest, ...previous] = data ?? [];

  if (!latest) {
    return (
      <div className="space-y-2">
        <p>Chrome, Brave, atau Firefox:</p>
        {isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <CloneBuildFallback />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <LatestDownloads latest={latest} />

      <p className="text-xs">
        Verifikasi:{" "}
        <code className="text-foreground">sha256sum -c SHA256SUMS</code>
      </p>

      {previous.length > 0 ? (
        <div className="space-y-1">
          <p className="text-foreground text-sm font-medium">
            Versi sebelumnya
          </p>
          <ul className="space-y-1">
            {previous.slice(0, 8).map((release) => (
              <li key={release.tag} className="flex flex-wrap gap-x-2">
                <span>{release.tag}</span>
                <a
                  className="underline"
                  href={release.zipUrl}
                  download={release.zipName}
                >
                  zip
                </a>
                {release.xpiUrl && release.xpiName ? (
                  <a
                    className="underline"
                    href={release.xpiUrl}
                    download={release.xpiName}
                  >
                    xpi
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p>
        <a className="underline" href={GITHUB_RELEASES_PAGE}>
          Semua rilis
        </a>
      </p>

      <CloneBuildFallback asAlternative />
    </div>
  );
}
