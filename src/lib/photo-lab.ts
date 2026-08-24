import type { ImageWarp } from "./model";

type RasterSource = HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;

type PicaFactory = (typeof import("pica"))["default"];
type PicaInstance = ReturnType<PicaFactory>;
let resizerPromise: Promise<PicaInstance> | null = null;

function getResizer(): Promise<PicaInstance> {
  resizerPromise ??= import("pica").then(({ default: createPica }) => createPica());
  return resizerPromise;
}

function sourceSize(source: RasterSource): { width: number; height: number } {
  if (source instanceof HTMLImageElement) {
    return {
      width: source.naturalWidth || source.width,
      height: source.naturalHeight || source.height,
    };
  }
  return { width: source.width, height: source.height };
}

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function warpPoint(
  x: number,
  y: number,
  warp: ImageWarp,
): { x: number; y: number } {
  if (warp.mode === "none") return { x, y };
  if (warp.mode === "perspective") {
    const horizontal = clamp(warp.perspectiveX, -1, 1) * 0.32;
    const vertical = clamp(warp.perspectiveY, -1, 1) * 0.32;
    const corners = {
      topLeft: { x: Math.max(0, horizontal), y: Math.max(0, vertical) },
      topRight: { x: 1 - Math.max(0, horizontal), y: Math.max(0, -vertical) },
      bottomRight: { x: 1 - Math.max(0, -horizontal), y: 1 - Math.max(0, -vertical) },
      bottomLeft: { x: Math.max(0, -horizontal), y: 1 - Math.max(0, vertical) },
    };
    const topX = corners.topLeft.x + (corners.topRight.x - corners.topLeft.x) * x;
    const topY = corners.topLeft.y + (corners.topRight.y - corners.topLeft.y) * x;
    const bottomX = corners.bottomLeft.x + (corners.bottomRight.x - corners.bottomLeft.x) * x;
    const bottomY = corners.bottomLeft.y + (corners.bottomRight.y - corners.bottomLeft.y) * x;
    return { x: topX + (bottomX - topX) * y, y: topY + (bottomY - topY) * y };
  }

  const centeredX = x - 0.5;
  const centeredY = y - 0.5;
  const distance = Math.sqrt(centeredX ** 2 + centeredY ** 2);
  const strength = clamp(Math.abs(warp.amount), 0, 1);
  if (warp.mode === "wave") {
    return {
      x: clamp(x + Math.sin(y * Math.PI * 2) * strength * 0.085),
      y: clamp(y + Math.sin(x * Math.PI * 2) * strength * 0.055),
    };
  }
  if (distance <= 0.00001 || distance >= 0.72) return { x, y };
  const falloff = (1 - distance / 0.72) ** 2;
  const direction = warp.mode === "pinch" ? -1 : 1;
  const scale = 1 + direction * strength * falloff * 0.72;
  return { x: clamp(0.5 + centeredX * scale), y: clamp(0.5 + centeredY * scale) };
}

function applyTriangleTransform(
  context: CanvasRenderingContext2D,
  source: RasterSource,
  sourcePoints: Array<{ x: number; y: number }>,
  destinationPoints: Array<{ x: number; y: number }>,
): void {
  const [s0, s1, s2] = sourcePoints;
  const [d0, d1, d2] = destinationPoints;
  const denominator = s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
  if (Math.abs(denominator) < 0.000001) return;
  const a = (d0.x * (s1.y - s2.y) + d1.x * (s2.y - s0.y) + d2.x * (s0.y - s1.y)) / denominator;
  const c = (d0.x * (s2.x - s1.x) + d1.x * (s0.x - s2.x) + d2.x * (s1.x - s0.x)) / denominator;
  const e = (
    d0.x * (s1.x * s2.y - s2.x * s1.y)
    + d1.x * (s2.x * s0.y - s0.x * s2.y)
    + d2.x * (s0.x * s1.y - s1.x * s0.y)
  ) / denominator;
  const b = (d0.y * (s1.y - s2.y) + d1.y * (s2.y - s0.y) + d2.y * (s0.y - s1.y)) / denominator;
  const d = (d0.y * (s2.x - s1.x) + d1.y * (s0.x - s2.x) + d2.y * (s1.x - s0.x)) / denominator;
  const f = (
    d0.y * (s1.x * s2.y - s2.x * s1.y)
    + d1.y * (s2.x * s0.y - s0.x * s2.y)
    + d2.y * (s0.x * s1.y - s1.x * s0.y)
  ) / denominator;

  context.save();
  context.beginPath();
  context.moveTo(d0.x, d0.y);
  context.lineTo(d1.x, d1.y);
  context.lineTo(d2.x, d2.y);
  context.closePath();
  context.clip();
  context.setTransform(a, b, c, d, e, f);
  context.drawImage(source, 0, 0);
  context.restore();
}

export function createWarpedImageSource(source: RasterSource, warp: ImageWarp): RasterSource {
  if (warp.mode === "none") return source;
  const { width, height } = sourceSize(source);
  const maximumSide = Math.max(width, height);
  const scale = Math.min(1, 4096 / Math.max(1, maximumSide));
  const outputWidth = Math.max(1, Math.round(width * scale));
  const outputHeight = Math.max(1, Math.round(height * scale));
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = outputWidth;
  sourceCanvas.height = outputHeight;
  sourceCanvas.getContext("2d")?.drawImage(source, 0, 0, outputWidth, outputHeight);
  const output = document.createElement("canvas");
  output.width = outputWidth;
  output.height = outputHeight;
  const context = output.getContext("2d");
  if (!context) return source;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  const grid = 24;
  const point = (column: number, row: number) => {
    const normalized = warpPoint(column / grid, row / grid, warp);
    return { x: normalized.x * outputWidth, y: normalized.y * outputHeight };
  };
  const sourcePoint = (column: number, row: number) => ({
    x: column / grid * outputWidth,
    y: row / grid * outputHeight,
  });
  for (let row = 0; row < grid; row += 1) {
    for (let column = 0; column < grid; column += 1) {
      const s00 = sourcePoint(column, row);
      const s10 = sourcePoint(column + 1, row);
      const s11 = sourcePoint(column + 1, row + 1);
      const s01 = sourcePoint(column, row + 1);
      const d00 = point(column, row);
      const d10 = point(column + 1, row);
      const d11 = point(column + 1, row + 1);
      const d01 = point(column, row + 1);
      applyTriangleTransform(context, sourceCanvas, [s00, s10, s11], [d00, d10, d11]);
      applyTriangleTransform(context, sourceCanvas, [s00, s11, s01], [d00, d11, d01]);
    }
  }
  return output;
}

export async function resampleImageBlob(
  blob: Blob,
  width: number,
  height: number,
  mimeType = blob.type || "image/png",
  quality = 0.92,
): Promise<Blob> {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1 || width > 16384 || height > 16384) {
    throw new Error("Choose image dimensions between 1 and 16,384 pixels.");
  }
  const bitmap = await createImageBitmap(blob);
  try {
    const resizer = await getResizer();
    const source = document.createElement("canvas");
    source.width = bitmap.width;
    source.height = bitmap.height;
    const sourceContext = source.getContext("2d");
    if (!sourceContext) throw new Error("The browser could not prepare the source image.");
    sourceContext.drawImage(bitmap, 0, 0);
    const target = document.createElement("canvas");
    target.width = Math.round(width);
    target.height = Math.round(height);
    await resizer.resize(source, target, { filter: "mks2013" });
    return await resizer.toBlob(target, mimeType, quality);
  } finally {
    bitmap.close();
  }
}
