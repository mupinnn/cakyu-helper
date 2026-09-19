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
          Buka <code className="text-foreground">chrome://extensions</code> atau{" "}
          <code className="text-foreground">brave://extensions</code>
        </li>
        <li>
          Load unpacked folder{" "}
          <code className="text-foreground">apps/extension/dist</code>
        </li>
      </ol>
    </div>
  );
}

function InstallSteps() {
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
        <p>Chrome atau Brave, mode developer:</p>
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
      <p>Chrome atau Brave, mode developer:</p>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild>
          <a href={latest.zipUrl} download={latest.zipName}>
            <DownloadIcon />
            Unduh {latest.tag}
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

      {latest.sha256 ? (
        <p className="text-xs break-all">
          SHA-256:{" "}
          <code className="text-foreground">{latest.sha256}</code>
        </p>
      ) : null}

      <p className="text-xs">
        Verifikasi:{" "}
        <code className="text-foreground">sha256sum -c SHA256SUMS</code>
      </p>

      <InstallSteps />

      {previous.length > 0 ? (
        <div className="space-y-1">
          <p className="text-foreground text-sm font-medium">
            Versi sebelumnya
          </p>
          <ul className="space-y-1">
            {previous.slice(0, 8).map((release) => (
              <li key={release.tag}>
                <a
                  className="underline"
                  href={release.zipUrl}
                  download={release.zipName}
                >
                  {release.tag}
                </a>
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
