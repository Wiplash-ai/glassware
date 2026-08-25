import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, resolve } from "node:path";
import { chromium } from "playwright-core";

const root = resolve(import.meta.dirname, "..");
const extensionPath = resolve(root, "artifacts/glassware-extension");
const manifest = JSON.parse(await readFile(resolve(extensionPath, "manifest.json"), "utf8"));
const executablePath = process.env.GLASSWARE_EXTENSION_CHROME;
if (!executablePath) throw new Error("Set GLASSWARE_EXTENSION_CHROME to the browser executable under test.");
const profile = await mkdtemp(resolve(tmpdir(), "glassware-extension-auth-smoke-"));

let context;
try {
  context = await launch();
  const browser = context.browser();
  if (!browser) throw new Error("The extension auth smoke could not access its browser session.");
  const browserSession = await browser.newBrowserCDPSession();
  const installed = await browserSession.send("Extensions.getExtensions");
  const extension = installed.extensions.find((item) => item.name === manifest.name && item.version === manifest.version);
  if (!extension?.enabled) throw new Error("Glassware was not enabled for the extension auth smoke.");
  await context.close();
  context = undefined;
  await grantAuthOrigin(extension.id);

  context = await launch();
  const activeBrowser = context.browser();
  if (!activeBrowser) throw new Error("The extension auth smoke could not reopen its browser session.");
  const activeBrowserSession = await activeBrowser.newBrowserCDPSession();

  const editor = await context.newPage();
  await editor.goto(`chrome-extension://${extension.id}/app/app.html`, { waitUntil: "domcontentloaded" });
  await editor.locator(".workbench").waitFor();
  await editor.locator(".account-button").evaluate((button) => button.click());
  const dialog = editor.getByRole("dialog", { name: "Sign in or create an account" });
  await dialog.waitFor();
  const provider = dialog.getByRole("button", { name: /^Continue with Wiplash.ai/ });
  await provider.waitFor({ state: "visible" });
  await editor.waitForFunction(() => {
    const button = document.querySelector(".modal-wiplash-provider");
    return button instanceof HTMLButtonElement && !button.disabled;
  });
  await provider.click();

  const authorizationTarget = await waitForAuthorizationTarget(activeBrowserSession);
  if (!authorizationTarget) {
    const permission = await editor.evaluate(() => chrome.permissions.contains({ origins: ["https://auth.wiplash.ai/*"] }));
    const dialogText = await dialog.innerText();
    throw new Error(`Opera OAuth handoff did not open (permission=${permission}; dialog=${JSON.stringify(dialogText)}).`);
  }
  if (!authorizationTarget.url.startsWith("https://auth.wiplash.ai/glassware/extension/")) {
    throw new Error(`Opera opened an unexpected OAuth target: ${authorizationTarget.url}`);
  }
  await activeBrowserSession.send("Target.closeTarget", { targetId: authorizationTarget.targetId }).catch(() => {});
  console.log(`Glassware extension OAuth handoff passed in isolated ${basename(executablePath)} using a browser-owned Wiplash authorization target.`);
} finally {
  await context?.close();
  await rm(profile, { recursive: true, force: true });
}

function launch() {
  return chromium.launchPersistentContext(profile, {
    executablePath,
    headless: true,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      "--enable-unsafe-extension-debugging",
      "--no-sandbox",
      "--disable-gpu",
    ],
  });
}

async function grantAuthOrigin(extensionId) {
  const preferencesPath = resolve(profile, "Default", "Preferences");
  const preferences = JSON.parse(await readFile(preferencesPath, "utf8"));
  const settings = preferences.extensions?.settings?.[extensionId]
    ?? preferences.extensions?.opsettings?.[extensionId];
  if (!settings) {
    const candidates = (await readdir(profile, { recursive: true })).filter((entry) => /Preferences$|Local State$/.test(entry));
    const matches = [];
    for (const entry of candidates) {
      const contents = await readFile(resolve(profile, entry), "utf8").catch(() => "");
      if (contents.includes(extensionId)) matches.push(entry);
    }
    const paths = findValuePaths(preferences, extensionId);
    throw new Error(`Opera did not persist the unpacked extension settings in Default/Preferences (ID matches: ${matches.join(", ") || "none"}; JSON paths: ${paths.join(", ") || "none"}).`);
  }
  for (const key of ["active_permissions", "granted_permissions", "runtime_granted_permissions"]) {
    settings[key] ??= { api: [], explicit_host: [], manifest_permissions: [], scriptable_host: [] };
    settings[key].explicit_host ??= [];
    if (!settings[key].explicit_host.includes("https://auth.wiplash.ai/*")) {
      settings[key].explicit_host.push("https://auth.wiplash.ai/*");
    }
  }
  await writeFile(preferencesPath, JSON.stringify(preferences));
}

function findValuePaths(value, needle, path = "$") {
  if (value === needle) return [path];
  if (!value || typeof value !== "object") return [];
  const matches = [];
  for (const [key, nested] of Object.entries(value)) {
    if (key === needle) matches.push(`${path}.${key}`);
    matches.push(...findValuePaths(nested, needle, `${path}.${key}`));
  }
  return matches;
}

async function waitForAuthorizationTarget(browserSession) {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const targets = await browserSession.send("Target.getTargets");
    const target = targets.targetInfos.find((item) => item.url.startsWith("https://auth.wiplash.ai/glassware/extension/"));
    if (target) return target;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 50));
  }
  return null;
}
