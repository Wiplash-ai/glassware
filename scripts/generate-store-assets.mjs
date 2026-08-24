import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "store-assets/screenshots");
const demoImage = resolve(root, "store-assets/source/florist-worktable-demo.png");
const port = 4179;
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", String(port)], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
});
let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk; });
server.stderr.on("data", (chunk) => { serverOutput += chunk; });

await mkdir(output, { recursive: true });
let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ executablePath: process.env.GLASSWARE_CHROME || "/usr/bin/google-chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/app.html`, { waitUntil: "networkidle" });
  await page.locator(".workbench").waitFor();
  await page.locator('input[aria-label="Upload image file"]').setInputFiles(demoImage);
  await page.getByText("Revision 2", { exact: false }).waitFor();
  await seedCampaignProject(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".workbench").waitFor();
  await page.waitForFunction(() => document.querySelector(".project-name input")?.value === "Flora campaign — Photo Lab demo");

  await openTool("Photo");
  if (!await page.locator(".photo-inspector").isVisible()) await page.locator(".photo-layer-chooser button").click();
  await page.locator(".photo-inspector").waitFor();
  await capture("01-photo-lab-tonal-editing.png");
  console.log("Captured Photo Lab screenshot");

  await page.getByRole("button", { name: "Edit crop", exact: true }).click();
  await page.getByRole("dialog", { name: "Choose exactly what stays visible" }).waitFor();
  await capture("02-precision-crop.png");
  console.log("Captured precision crop screenshot");
  await page.getByRole("button", { name: "Close crop editor", exact: true }).click();

  await selectLayer("Campaign headline");
  await openTool("Text");
  await page.locator(".type-studio-controls").waitFor();
  await capture("03-type-studio-editable-overlay.png");
  console.log("Captured Type Studio screenshot");

  await selectLayer("Florist campaign source.png");
  await openTool("Studio");
  await page.locator(".studio-controls").waitFor();
  await capture("04-studio-presentation-tools.png");
  console.log("Captured Studio screenshot");

  await openTool("Layers");
  await page.locator(".layer-list").waitFor();
  await capture("05-editable-layer-stack.png");
  console.log("Captured Layers screenshot");

  await context.close();
  console.log(`Generated five edited 1280x800 store screenshots in ${output}`);

  async function openTool(name) {
    await page.getByRole("button", { name, exact: true }).first().click();
    if (name === "Photo") await page.getByRole("heading", { name: "Edit the image itself" }).waitFor();
    else if (name === "Text") await page.getByText("TYPE STUDIO", { exact: true }).waitFor();
    else await page.locator(".panel-heading h1", { hasText: name }).waitFor();
    await page.waitForTimeout(120);
  }

  async function selectLayer(name) {
    await openTool("Layers");
    await page.locator(".layer-row").filter({ hasText: name }).locator(".layer-main").click();
  }

  async function capture(name) {
    await page.locator(".message-bar").evaluate((element) => { element.style.visibility = "hidden"; }).catch(() => {});
    await page.waitForTimeout(150);
    await page.screenshot({ path: resolve(output, name), animations: "disabled" });
  }
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}

async function seedCampaignProject(page) {
  await page.evaluate(async () => {
    const request = indexedDB.open("imagestitch", 5);
    const database = await new Promise((resolvePromise, reject) => {
      request.onsuccess = () => resolvePromise(request.result);
      request.onerror = () => reject(request.error);
    });
    const read = (store, key) => new Promise((resolvePromise, reject) => {
      const item = store.get(key);
      item.onsuccess = () => resolvePromise(item.result);
      item.onerror = () => reject(item.error);
    });
    const settingTx = database.transaction("settings", "readonly");
    const active = await read(settingTx.objectStore("settings"), "activeProjectId");
    const projectTx = database.transaction("projects", "readonly");
    const project = await read(projectTx.objectStore("projects"), active.value);
    const image = structuredClone(project.objects.find((object) => object.kind === "image"));
    const textBase = structuredClone(project.objects.find((object) => object.kind === "text"));
    const shapeBase = structuredClone(project.objects.find((object) => object.kind === "shape"));
    const uid = (label) => `${label}-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const canvas = {
      ...project.canvas,
      preset: "landscape",
      width: 1200,
      height: 675,
      background: "#f6efe4",
      guides: [],
      showRulers: false,
      presentation: {
        ...project.canvas.presentation,
        enabled: true,
        padding: 34,
        background: "#111111",
        backdrop: {
          ...project.canvas.presentation.backdrop,
          type: "gradient",
          value: "linear-gradient(135deg, #111111 0%, #25375f 52%, #df7255 100%)",
          opacity: 1,
          blur: 0,
          noise: 8,
        },
        cornerRadius: 22,
        frame: { ...project.canvas.presentation.frame, type: "none", width: 0, padding: 0, title: "" },
        shadow: { ...project.canvas.presentation.shadow, enabled: true, color: "#000000", blur: 34, offsetX: 0, offsetY: 15, opacity: 0.34 },
      },
    };
    const sourceImage = {
      ...image,
      name: "Florist campaign source.png",
      x: 0,
      y: 0,
      width: 1200,
      height: 675,
      crop: { x: 0, y: 0, width: 1, height: 1 },
      adjustments: {
        ...image.adjustments,
        brightness: 0.04,
        exposure: 0.06,
        contrast: 18,
        saturation: 0.12,
        vibrance: 0.24,
        highlights: -0.08,
        shadows: 0.12,
        curve: "soft-contrast",
        temperature: 0.06,
        sharpen: 0.2,
        vignette: 0.12,
      },
      presentation: {
        ...image.presentation,
        cornerRadius: 18,
        shadow: { ...image.presentation.shadow, enabled: false },
      },
    };
    const panel = {
      ...shapeBase,
      id: uid("panel"),
      name: "Warm white copy panel",
      shape: "rounded-rect",
      x: 65,
      y: 72,
      width: 492,
      height: 530,
      fill: "#fffaf2",
      opacity: 0.94,
      cornerRadius: 30,
      shadow: { ...shapeBase.shadow, enabled: true, color: "#111111", blur: 28, offsetX: 0, offsetY: 12, opacity: 0.22 },
    };
    const accent = {
      ...shapeBase,
      id: uid("accent"),
      name: "Coral campaign rule",
      shape: "rounded-rect",
      x: 105,
      y: 118,
      width: 80,
      height: 12,
      fill: "#ed684f",
      opacity: 1,
      cornerRadius: 6,
      shadow: { ...shapeBase.shadow, enabled: false },
    };
    const eyebrow = {
      ...textBase,
      id: uid("eyebrow"),
      name: "Campaign eyebrow",
      text: "FALL FLORAL WORKSHOP",
      x: 105,
      y: 154,
      width: 390,
      height: 45,
      fill: "#354c89",
      fontFamily: "Arial",
      fontSize: 23,
      fontStyle: "bold",
      fontWeight: 700,
      letterSpacing: 2.4,
      lineHeight: 1,
      gradient: { enabled: false, start: "#354c89", end: "#ed684f", angle: 0 },
      curve: { mode: "none", amount: 0 },
      shadow: { ...textBase.shadow, enabled: false },
    };
    const headline = {
      ...textBase,
      id: uid("headline"),
      name: "Campaign headline",
      text: "MAKE ROOM\nFOR COLOR.",
      x: 101,
      y: 216,
      width: 410,
      height: 210,
      fill: "#111111",
      fontFamily: "Arial",
      fontSize: 60,
      fontStyle: "bold",
      fontWeight: 800,
      letterSpacing: -1.2,
      lineHeight: 0.92,
      gradient: { enabled: true, start: "#111111", end: "#354c89", angle: 16 },
      curve: { mode: "none", amount: 0 },
      shadow: { ...textBase.shadow, enabled: false },
    };
    const detail = {
      ...textBase,
      id: uid("detail"),
      name: "Campaign details",
      text: "Hands-on arranging · October 18\nNorth Loop Studio · 10 AM",
      x: 106,
      y: 462,
      width: 390,
      height: 100,
      fill: "#282828",
      fontFamily: "Arial",
      fontSize: 25,
      fontStyle: "normal",
      fontWeight: 400,
      letterSpacing: 0,
      lineHeight: 1.35,
      gradient: { enabled: false, start: "#282828", end: "#282828", angle: 0 },
      curve: { mode: "none", amount: 0 },
      shadow: { ...textBase.shadow, enabled: false },
    };
    const objects = [sourceImage, panel, accent, eyebrow, headline, detail];
    project.name = "Flora campaign — Photo Lab demo";
    project.updatedAt = now;
    project.canvas = canvas;
    project.objects = objects;
    project.pages = project.pages.map((item) => item.id === project.activePageId ? { ...item, canvas, objects } : item);
    project.revisions = project.revisions.map((item) => item.id === project.currentRevisionId
      ? { ...item, summary: "Store demo image edited", snapshot: { canvas, objects } }
      : item);
    const writeTx = database.transaction("projects", "readwrite");
    writeTx.objectStore("projects").put(project);
    await new Promise((resolvePromise, reject) => {
      writeTx.oncomplete = resolvePromise;
      writeTx.onerror = () => reject(writeTx.error);
      writeTx.onabort = () => reject(writeTx.error);
    });
    database.close();
  });
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/app.html`);
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  throw new Error(`Store-asset preview server did not start.\n${serverOutput}`);
}
