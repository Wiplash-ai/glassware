import { pathToFileURL } from "node:url";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const root = resolve(import.meta.dirname, "..");
const assets = [
  { name: "small-440x280", width: 440, height: 280 },
  { name: "marquee-1400x560", width: 1400, height: 560 },
];
const browser = await chromium.launch({ executablePath: process.env.GLASSWARE_CHROME || "/usr/bin/google-chrome", headless: true });
try {
  const page = await browser.newPage({ colorScheme: "light", reducedMotion: "reduce" });
  for (const asset of assets) {
    await page.setViewportSize({ width: asset.width, height: asset.height });
    const svgPath = resolve(root, "store-assets/promo", `${asset.name}.svg`);
    await page.goto(pathToFileURL(svgPath).href, { waitUntil: "load" });
    await page.waitForTimeout(150);
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, height: document.documentElement.clientHeight }));
    if (dimensions.width !== asset.width || dimensions.height !== asset.height) {
      throw new Error(`${asset.name} rendered at ${dimensions.width}x${dimensions.height}`);
    }
    await page.screenshot({
      path: resolve(root, "store-assets/promo", `${asset.name}.png`),
      clip: { x: 0, y: 0, width: asset.width, height: asset.height },
      animations: "disabled",
    });
  }
  const storeDerivatives = [
    {
      source: resolve(root, "store-assets/promo/small-440x280.png"),
      output: resolve(root, "store-assets/opera-promo-300x188.png"),
      width: 300,
      height: 188,
      objectFit: "cover",
      transparent: false,
    },
    {
      source: resolve(root, "extension/icons/icon-128.png"),
      output: resolve(root, "store-assets/opera-icon-64.png"),
      width: 64,
      height: 64,
      objectFit: "contain",
      transparent: true,
    },
  ];
  await page.goto("about:blank");
  for (const asset of storeDerivatives) {
    const bytes = await readFile(asset.source);
    const source = `data:image/png;base64,${bytes.toString("base64")}`;
    await page.setViewportSize({ width: asset.width, height: asset.height });
    await page.setContent(`<style>*{box-sizing:border-box}html,body{margin:0;width:${asset.width}px;height:${asset.height}px;overflow:hidden;background:${asset.transparent ? "transparent" : "white"}}img{display:block;width:100%;height:100%;object-fit:${asset.objectFit}}</style><img src="${source}" alt="">`);
    await page.locator("img").waitFor();
    await page.screenshot({
      path: asset.output,
      clip: { x: 0, y: 0, width: asset.width, height: asset.height },
      omitBackground: asset.transparent,
    });
  }
  const operaOutput = resolve(root, "store-assets/opera-screenshots");
  await mkdir(operaOutput, { recursive: true });
  const screenshotNames = [
    "01-photo-lab-tonal-editing.png",
    "02-precision-crop.png",
    "03-type-studio-editable-overlay.png",
    "04-studio-presentation-tools.png",
    "05-editable-layer-stack.png",
  ];
  await page.goto("about:blank");
  await page.setViewportSize({ width: 612, height: 408 });
  for (const name of screenshotNames) {
    const bytes = await readFile(resolve(root, "store-assets/screenshots", name));
    const source = `data:image/png;base64,${bytes.toString("base64")}`;
    await page.setContent(`<style>*{box-sizing:border-box}html,body{margin:0;width:612px;height:408px;overflow:hidden;background:white}img{width:612px;height:408px;object-fit:cover}</style><img src="${source}" alt="">`);
    await page.locator("img").waitFor();
    await page.screenshot({ path: resolve(operaOutput, name), clip: { x: 0, y: 0, width: 612, height: 408 } });
  }
} finally {
  await browser.close();
}

console.log("Rendered GlassWare Chrome/Edge promotional tiles, Opera store art, and Opera screenshot references.");
