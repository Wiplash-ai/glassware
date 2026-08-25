import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { unzipSync, zipSync } from "fflate";

const root = resolve(import.meta.dirname, "..");
const chromiumTarget = resolve(root, "artifacts/glassware-extension");
const firefoxTarget = resolve(root, "artifacts/glassware-extension-firefox");
const storeRoot = resolve(root, "artifacts/store");
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const version = packageJson.version;
const fixedArchiveDate = new Date("2020-01-01T00:00:00.000Z");

await Promise.all([
  rm(chromiumTarget, { recursive: true, force: true }),
  rm(firefoxTarget, { recursive: true, force: true }),
  ...["chromium", "chrome", "edge", "opera", "firefox"].map((target) => rm(resolve(storeRoot, target), { recursive: true, force: true })),
]);

await prepareUnpacked(chromiumTarget);
const chromiumManifest = await readManifest(chromiumTarget);
const chromiumArchive = await makeArchive(chromiumTarget);
for (const target of ["chromium", "chrome", "edge", "opera"]) {
  const archiveName = target === "chromium"
    ? `glassware-${version}-chromium.zip`
    : `glassware-${version}-${target}.zip`;
  await writeRelease(target, archiveName, chromiumArchive, chromiumManifest, "chromium-mv3");
}

await cp(chromiumTarget, firefoxTarget, { recursive: true });
const firefoxManifest = await readManifest(firefoxTarget);
firefoxManifest.background = {
  scripts: ["background.js"],
  service_worker: "background.js",
};
firefoxManifest.browser_specific_settings = {
  gecko: {
    id: "glassware-image-editor@wiplash.ai",
    strict_min_version: "142.0",
    data_collection_permissions: {
      required: ["none"],
      optional: [
        "authenticationInfo",
        "personallyIdentifyingInfo",
        "financialAndPaymentInfo",
        "personalCommunications",
        "browsingActivity",
        "websiteContent",
      ],
    },
  },
};
await writeFile(resolve(firefoxTarget, "manifest.json"), `${JSON.stringify(firefoxManifest, null, 2)}\n`);
const firefoxArchive = await makeArchive(firefoxTarget);
await writeRelease("firefox", `glassware-${version}-firefox.zip`, firefoxArchive, firefoxManifest, "firefox-mv3");
await writeFirefoxSourceArchive();

console.log(`Packaged Chromium MV3 extension at ${chromiumTarget}`);
console.log(`Packaged Firefox MV3 extension at ${firefoxTarget}`);

async function prepareUnpacked(target) {
  await mkdir(target, { recursive: true });
  await cp(resolve(root, "extension"), target, { recursive: true });
  await cp(resolve(root, "dist"), resolve(target, "app"), {
    recursive: true,
    filter: (source) => !source.endsWith(".map"),
  });
  const manifest = await readManifest(target);
  manifest.version = version;
  await writeFile(resolve(target, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  for (const file of await collectFiles(target)) {
    if (!/\.(?:css|js)$/i.test(file)) continue;
    const source = resolve(target, ...file.split("/"));
    const cleaned = (await readFile(source, "utf8"))
      .replace(/\n?\/\/# sourceMappingURL=.*$/gm, "")
      .replace(/\n?\/\*# sourceMappingURL=.*?\*\//gm, "");
    await writeFile(source, cleaned);
  }
}

async function readManifest(target) {
  return JSON.parse(await readFile(resolve(target, "manifest.json"), "utf8"));
}

async function makeArchive(target) {
  const files = await collectFiles(target);
  const zippable = {};
  for (const file of files) {
    const bytes = new Uint8Array(await readFile(resolve(target, ...file.split("/"))));
    zippable[file] = [bytes, { mtime: fixedArchiveDate, os: 3, attrs: 0o644 << 16 }];
  }
  const archive = zipSync(zippable, { level: 9, mtime: fixedArchiveDate });
  const expanded = unzipSync(archive);
  if (!expanded["manifest.json"] || Object.keys(expanded).some((file) => file.startsWith("glassware-extension/"))) {
    throw new Error("The store ZIP must contain manifest.json at its root.");
  }
  return { bytes: archive, files };
}

async function writeRelease(target, archiveName, archive, manifest, runtimeTarget) {
  const targetDirectory = resolve(storeRoot, target);
  await mkdir(targetDirectory, { recursive: true });
  const archivePath = resolve(targetDirectory, archiveName);
  await writeFile(archivePath, archive.bytes);
  const sha256 = createHash("sha256").update(archive.bytes).digest("hex");
  await writeFile(resolve(targetDirectory, `${archiveName}.sha256`), `${sha256}  ${archiveName}\n`);
  await writeFile(resolve(targetDirectory, "release.json"), `${JSON.stringify({
    schemaVersion: 1,
    product: "Glassware Image Editor",
    target: runtimeTarget,
    store: target,
    version,
    archive: archiveName,
    sha256,
    bytes: archive.bytes.byteLength,
    files: archive.files.length,
    permissions: manifest.permissions,
    hostPermissions: manifest.host_permissions,
    optionalHostPermissions: manifest.optional_host_permissions,
  }, null, 2)}\n`);
  console.log(`Created ${target} store archive at ${archivePath}`);
  console.log(`SHA-256 ${sha256}`);
}

async function writeFirefoxSourceArchive() {
  const sourcePaths = [
    "AGENTS.md",
    "LICENSE",
    "README.md",
    "app.html",
    "index.html",
    "privacy.html",
    "package.json",
    "package-lock.json",
    "tsconfig.app.json",
    "tsconfig.json",
    "tsconfig.node.json",
    "vite.config.ts",
    "extension",
    "public",
    "scripts",
    "src",
    "tests",
  ];
  const zippable = {
    "SOURCE_BUILD.md": [new TextEncoder().encode([
      "# Glassware Image Editor source build",
      "",
      "Reviewer environment: Node.js 20 or newer and npm.",
      "",
      "1. Run `npm ci`.",
      "2. Run `npm run build:extension`.",
      `3. The matching Firefox package is artifacts/store/firefox/glassware-${version}-firefox.zip.`,
      "",
      "The Vite/TypeScript build bundles first-party source and declared npm dependencies. No remote code is loaded.",
      "",
    ].join("\n")), { mtime: fixedArchiveDate, os: 3, attrs: 0o644 << 16 }],
  };
  for (const sourcePath of sourcePaths) {
    const absolute = resolve(root, sourcePath);
    const sourceStat = await stat(absolute).catch(() => null);
    if (!sourceStat) continue;
    const files = sourceStat.isDirectory() ? await collectFiles(absolute) : [""];
    for (const file of files) {
      const archivePath = file ? `${sourcePath}/${file}` : sourcePath;
      const bytes = new Uint8Array(await readFile(file ? resolve(absolute, ...file.split("/")) : absolute));
      zippable[archivePath] = [bytes, { mtime: fixedArchiveDate, os: 3, attrs: 0o644 << 16 }];
    }
  }
  const sourceArchive = zipSync(zippable, { level: 9, mtime: fixedArchiveDate });
  const targetDirectory = resolve(storeRoot, "firefox");
  const archiveName = `glassware-${version}-firefox-source.zip`;
  await writeFile(resolve(targetDirectory, archiveName), sourceArchive);
  const sha256 = createHash("sha256").update(sourceArchive).digest("hex");
  await writeFile(resolve(targetDirectory, `${archiveName}.sha256`), `${sha256}  ${archiveName}\n`);
}

async function collectFiles(directory) {
  const collected = [];
  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const path = resolve(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) collected.push(relative(directory, path).split(sep).join("/"));
    }
  }
  await walk(directory);
  return collected;
}
