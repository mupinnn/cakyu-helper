import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");

const VERSION_FILES = [
  "apps/extension/package.json",
  "apps/extension/manifest.json",
] as const;

const VERSION_FIELD = /("version"\s*:\s*")([^"]+)(")/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function usage(): never {
  console.error(`Usage: bun run bump <patch|minor|major|x.y.z> [--dry-run]

Updates:
  ${VERSION_FILES.join("\n  ")}`);
  process.exit(1);
}

function readVersion(text: string, file: string): string {
  const matches = [...text.matchAll(new RegExp(VERSION_FIELD, "g"))];
  if (matches.length !== 1) {
    throw new Error(
      `${file}: expected exactly one "version" field, found ${matches.length}`,
    );
  }
  const version = matches[0]?.[2];
  if (!version || !SEMVER.test(version)) {
    throw new Error(`${file}: version "${version}" is not major.minor.patch`);
  }
  return version;
}

function nextVersion(current: string, arg: string): string {
  if (SEMVER.test(arg)) return arg;

  const match = SEMVER.exec(current);
  if (!match) {
    throw new Error(`current version "${current}" is not major.minor.patch`);
  }
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  if (arg === "major") return `${major + 1}.0.0`;
  if (arg === "minor") return `${major}.${minor + 1}.0`;
  if (arg === "patch") return `${major}.${minor}.${patch + 1}`;

  throw new Error(
    `Unknown bump "${arg}". Use patch, minor, major, or x.y.z.`,
  );
}

try {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const positional = args.filter((arg) => !arg.startsWith("--"));
  const target = positional[0];

  if (!target || positional.length !== 1) usage();

  const files = await Promise.all(
    VERSION_FILES.map(async (rel) => {
      const path = resolve(root, rel);
      const text = await Bun.file(path).text();
      return { rel, path, text, version: readVersion(text, rel) };
    }),
  );

  const current = files[0]?.version;
  if (!current) throw new Error("No version files configured");

  const drifted = files.filter((file) => file.version !== current);
  if (drifted.length > 0) {
    const details = files
      .map((file) => `${file.rel}=${file.version}`)
      .join(", ");
    throw new Error(`Version files disagree (${details}). Align them first.`);
  }

  const next = nextVersion(current, target);
  if (next === current) {
    console.log(`${current} (unchanged)`);
    process.exit(0);
  }

  for (const file of files) {
    const updated = file.text.replace(VERSION_FIELD, `$1${next}$3`);
    if (updated === file.text) {
      throw new Error(`${file.rel}: failed to replace version`);
    }
    if (!dryRun) await Bun.write(file.path, updated);
    console.log(
      `${dryRun ? "would update" : "updated"} ${file.rel}: ${current} -> ${next}`,
    );
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
