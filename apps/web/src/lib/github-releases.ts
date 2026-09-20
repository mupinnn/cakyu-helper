export const GITHUB_USER = "mupinnn";
export const GITHUB_REPO = `${GITHUB_USER}/cakyu-helper`;
export const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO}`;
export const GITHUB_USER_URL = `https://github.com/${GITHUB_USER}`;
export const GITHUB_RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases`;
export const GITHUB_RELEASES_PAGE = `${GITHUB_REPO_URL}/releases`;

export const RELEASES_CACHE_KEY = "cakyu-helper:github-releases";
export const RELEASES_STALE_TIME_MS = 24 * 60 * 60 * 1000;

export type GithubReleaseAsset = {
  name: string;
  browser_download_url: string;
  digest?: string | null;
};

export type GithubRelease = {
  tag_name: string;
  name: string | null;
  html_url: string;
  published_at: string | null;
  draft: boolean;
  prerelease: boolean;
  body: string | null;
  assets: GithubReleaseAsset[];
};

export type ExtensionRelease = {
  tag: string;
  name: string;
  htmlUrl: string;
  publishedAt: string | null;
  zipUrl: string;
  zipName: string;
  sha256sumsUrl: string | null;
  sha256: string | null;
};

type CachedReleases = {
  savedAt: number;
  data: ExtensionRelease[];
};

export function readCachedReleases(): CachedReleases | undefined {
  try {
    const raw = localStorage.getItem(RELEASES_CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as CachedReleases;
    if (
      !Array.isArray(parsed.data) ||
      parsed.data.length === 0 ||
      typeof parsed.savedAt !== "number"
    ) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

export function writeCachedReleases(data: ExtensionRelease[]): void {
  try {
    const payload: CachedReleases = { savedAt: Date.now(), data };
    localStorage.setItem(RELEASES_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota / private-mode failures; in-memory React Query cache still applies.
  }
}

export function isCacheFresh(savedAt: number, now = Date.now()): boolean {
  return now - savedAt < RELEASES_STALE_TIME_MS;
}

function sha256FromDigest(digest: string | null | undefined): string | null {
  if (!digest) return null;
  const match = /^sha256:([a-fA-F0-9]{64})$/i.exec(digest);
  return match ? match[1].toLowerCase() : null;
}

function sha256FromBody(body: string | null, zipName: string): string | null {
  if (!body) return null;
  const escaped = zipName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`\\b([a-fA-F0-9]{64})\\s+${escaped}\\b`).exec(body);
  return match ? match[1].toLowerCase() : null;
}

export function parseExtensionRelease(
  release: GithubRelease,
): ExtensionRelease | null {
  const zip = release.assets.find(
    (asset) =>
      asset.name.startsWith("cakyu-helper-") && asset.name.endsWith(".zip"),
  );
  if (!zip) return null;

  const sha256sums = release.assets.find(
    (asset) => asset.name === "SHA256SUMS" || asset.name.endsWith(".sha256"),
  );

  return {
    tag: release.tag_name,
    name: release.name ?? release.tag_name,
    htmlUrl: release.html_url,
    publishedAt: release.published_at,
    zipUrl: zip.browser_download_url,
    zipName: zip.name,
    sha256sumsUrl: sha256sums?.browser_download_url ?? null,
    sha256:
      sha256FromDigest(zip.digest) ?? sha256FromBody(release.body, zip.name),
  };
}

export async function fetchExtensionReleases(): Promise<ExtensionRelease[]> {
  const response = await fetch(GITHUB_RELEASES_API, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub Releases API ${response.status}`);
  }

  const payload = (await response.json()) as GithubRelease[];
  return payload
    .filter((release) => !release.draft && !release.prerelease)
    .map(parseExtensionRelease)
    .filter((release): release is ExtensionRelease => release !== null);
}
