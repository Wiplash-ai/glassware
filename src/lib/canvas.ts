import Konva from "konva";
import type { Filter } from "konva/lib/Node";
import {
  DEFAULT_IMAGE_ADJUSTMENTS,
  DEFAULT_IMAGE_MASK,
  DEFAULT_IMAGE_PRESENTATION,
  DEFAULT_IMAGE_WARP,
  FULL_IMAGE_CROP,
  cloneImagePresentation,
  cloneImageMask,
  cloneImageWarp,
  cloneObjectShadow,
  cloneTextCurve,
  cloneTextGradient,
  type DesignNode,
  type ImageAdjustments,
  type ImageDesignNode,
  type ImageFrame,
  type ImageMask,
  type ImagePresentation,
  type NormalizedCrop,
  type ShapeDesignNode,
  type ShapeKind,
  type TextDesignNode,
} from "./model";
import type { StoredAsset } from "./storage";
import { createWarpedImageSource } from "./photo-lab";

export const DESIGN_OBJECT_NAME = "design-object";

type AssetResolver = (assetId: string) => Promise<StoredAsset | null>;

function regularPolygonPoints(width: number, height: number, sides: number, innerRatio?: number): number[] {
  const points: number[] = [];
  const count = innerRatio ? sides * 2 : sides;
  for (let index = 0; index < count; index += 1) {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
    const radius = innerRatio && index % 2 ? innerRatio : 1;
    points.push(
      width / 2 + Math.cos(angle) * width * 0.48 * radius,
      height / 2 + Math.sin(angle) * height * 0.48 * radius,
    );
  }
  return points;
}

function drawPoints(context: Konva.Context, points: number[]): void {
  context.moveTo(points[0], points[1]);
  for (let index = 2; index < points.length; index += 2) context.lineTo(points[index], points[index + 1]);
  context.closePath();
}

function createPathShape(node: ShapeDesignNode): Konva.Shape {
  return new Konva.Shape({
    ...commonAttributes(node),
    fill: node.fill,
    designFill: node.fill,
    designShape: node.shape,
    sceneFunc(context, shape) {
      const width = shape.width();
      const height = shape.height();
      context.beginPath();
      if (node.shape === "heart") {
        context.moveTo(width / 2, height * 0.92);
        context.bezierCurveTo(width * 0.42, height * 0.78, width * 0.08, height * 0.56, width * 0.08, height * 0.3);
        context.bezierCurveTo(width * 0.08, height * 0.08, width * 0.36, height * 0.02, width / 2, height * 0.24);
        context.bezierCurveTo(width * 0.64, height * 0.02, width * 0.92, height * 0.08, width * 0.92, height * 0.3);
        context.bezierCurveTo(width * 0.92, height * 0.56, width * 0.58, height * 0.78, width / 2, height * 0.92);
        context.closePath();
      } else if (node.shape === "speech-bubble") {
        const radius = Math.min(width, height) * 0.12;
        const bodyBottom = height * 0.76;
        context.moveTo(radius, 0);
        context.lineTo(width - radius, 0);
        context.quadraticCurveTo(width, 0, width, radius);
        context.lineTo(width, bodyBottom - radius);
        context.quadraticCurveTo(width, bodyBottom, width - radius, bodyBottom);
        context.lineTo(width * 0.38, bodyBottom);
        context.lineTo(width * 0.2, height);
        context.lineTo(width * 0.23, bodyBottom);
        context.lineTo(radius, bodyBottom);
        context.quadraticCurveTo(0, bodyBottom, 0, bodyBottom - radius);
        context.lineTo(0, radius);
        context.quadraticCurveTo(0, 0, radius, 0);
        context.closePath();
      } else {
        const points = node.shape === "triangle"
          ? regularPolygonPoints(width, height, 3)
          : node.shape === "diamond"
            ? [width / 2, 0, width, height / 2, width / 2, height, 0, height / 2]
            : node.shape === "pentagon"
              ? regularPolygonPoints(width, height, 5)
              : node.shape === "hexagon"
                ? regularPolygonPoints(width, height, 6)
                : regularPolygonPoints(width, height, 5, 0.44);
        drawPoints(context, points);
      }
      context.fillStrokeShape(shape);
    },
  });
}

function createShapeNode(node: ShapeDesignNode): Konva.Shape {
  const shared = {
    ...commonAttributes(node),
    designFill: node.fill,
    designShape: node.shape,
  };
  if (node.shape === "rect" || node.shape === "rounded-rect" || node.shape === "redact") {
    return new Konva.Rect({
      ...shared,
      fill: node.shape === "redact" ? "#111111" : node.fill,
      cornerRadius: node.shape === "rounded-rect" ? Math.max(node.cornerRadius, 24) : 0,
    });
  }
  if (node.shape === "ellipse") {
    return new Konva.Ellipse({
      ...shared,
      x: node.x + node.width / 2,
      y: node.y + node.height / 2,
      radiusX: node.width / 2,
      radiusY: node.height / 2,
      fill: node.fill,
    });
  }
  if (node.shape === "line") {
    return new Konva.Line({
      ...shared,
      points: [0, node.height / 2, node.width, node.height / 2],
      stroke: node.fill,
      strokeWidth: Math.max(8, node.height * 0.16),
      lineCap: "round",
    });
  }
  if (node.shape === "arrow") {
    return new Konva.Arrow({
      ...shared,
      points: [0, node.height / 2, node.width, node.height / 2],
      fill: node.fill,
      stroke: node.fill,
      strokeWidth: Math.max(8, node.height * 0.12),
      pointerLength: Math.min(node.width * 0.22, node.height * 0.7),
      pointerWidth: Math.min(node.width * 0.24, node.height * 0.8),
      lineCap: "round",
      lineJoin: "round",
    });
  }
  if (node.shape === "curved-arrow") {
    return new Konva.Arrow({
      ...shared,
      points: [0, node.height * 0.72, node.width * 0.34, node.height * 0.08, node.width, node.height * 0.45],
      tension: 0.48,
      fill: node.fill,
      stroke: node.fill,
      strokeWidth: Math.max(8, node.height * 0.1),
      pointerLength: Math.min(node.width * 0.16, node.height * 0.48),
      pointerWidth: Math.min(node.width * 0.18, node.height * 0.52),
      lineCap: "round",
      lineJoin: "round",
    });
  }
  if (node.shape === "blur") {
    return new Konva.Rect({
      ...shared,
      fill: "rgba(255,255,255,.72)",
      stroke: "rgba(17,17,17,.16)",
      dash: [10, 7],
      cornerRadius: Math.max(node.cornerRadius, 8),
    });
  }
  return createPathShape(node);
}

function textCurvePath(
  width: number,
  height: number,
  mode: "arc-up" | "arc-down",
  amount: number,
): string {
  const strength = Math.min(1, Math.max(0, amount));
  const baseline = mode === "arc-up" ? height * 0.76 : height * 0.24;
  const controlY = mode === "arc-up"
    ? baseline - height * (0.25 + strength * 0.7)
    : baseline + height * (0.25 + strength * 0.7);
  return `M 0 ${baseline} Q ${width / 2} ${controlY} ${width} ${baseline}`;
}

function applyTextGradient(
  node: Konva.Text | Konva.TextPath,
  gradient: ReturnType<typeof cloneTextGradient>,
  fallback: string,
  width: number,
  height: number,
): void {
  (node as Konva.Node).setAttr("textGradient", cloneTextGradient(gradient));
  if (!gradient.enabled) {
    node.setAttrs({ fill: fallback, fillLinearGradientColorStops: [] });
    return;
  }
  const radians = gradient.angle * Math.PI / 180;
  const center = { x: width / 2, y: height / 2 };
  const radius = Math.max(width, height) / 2;
  const vector = { x: Math.cos(radians) * radius, y: Math.sin(radians) * radius };
  node.fillLinearGradientStartPoint({ x: center.x - vector.x, y: center.y - vector.y });
  node.fillLinearGradientEndPoint({ x: center.x + vector.x, y: center.y + vector.y });
  node.fillLinearGradientColorStops([0, gradient.start, 1, gradient.end]);
}

export function isTextCanvasNode(node: Konva.Node | null | undefined): node is Konva.Text | Konva.TextPath {
  return node instanceof Konva.Text || node instanceof Konva.TextPath;
}

export function applyTextDesignStyle(
  node: Konva.Text | Konva.TextPath,
  design: TextDesignNode,
): void {
  const transformedText = design.textTransform === "uppercase"
    ? design.text.toLocaleUpperCase()
    : design.textTransform === "lowercase"
      ? design.text.toLocaleLowerCase()
      : design.text;
  const italic = design.fontStyle.includes("italic");
  const weight = design.fontWeight ?? (design.fontStyle.includes("bold") ? 700 : 400);
  node.setAttrs({
    text: node instanceof Konva.TextPath ? transformedText.replace(/\s*\n\s*/g, " ") : transformedText,
    designText: design.text,
    fontFamily: design.fontFamily,
    fontSize: design.fontSize,
    fontStyle: `${italic ? "italic " : ""}${weight}`.trim(),
    align: design.align,
    lineHeight: design.lineHeight,
    letterSpacing: design.letterSpacing ?? 0,
    textDecoration: design.textDecoration === "none" ? "" : design.textDecoration,
    stroke: design.stroke ?? "#111111",
    strokeWidth: design.strokeWidth ?? 0,
    textTransform: design.textTransform ?? "none",
    textFontWeight: weight,
    textCurve: cloneTextCurve(design.curve),
  });
  const curve = cloneTextCurve(design.curve);
  if (node instanceof Konva.TextPath && curve.mode !== "none") {
    node.data(textCurvePath(design.width, design.height, curve.mode, curve.amount));
  }
  applyTextGradient(node, cloneTextGradient(design.gradient), design.fill, design.width, design.height);
}

function commonAttributes(node: DesignNode) {
  const shadow = node.kind === "image" ? null : cloneObjectShadow(node.shadow);
  return {
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    rotation: node.rotation,
    scaleX: node.scaleX,
    scaleY: node.scaleY,
    skewX: Math.tan((node.skewX ?? 0) * Math.PI / 180),
    skewY: Math.tan((node.skewY ?? 0) * Math.PI / 180),
    opacity: node.opacity,
    visible: node.visible,
    draggable: !node.locked,
    listening: !node.locked,
    name: DESIGN_OBJECT_NAME,
    designId: node.id,
    designName: node.name,
    nodeKind: node.kind,
    designLocked: node.locked,
    ...(node.groupId ? { designGroupId: node.groupId } : {}),
    globalCompositeOperation: node.blendMode ?? "source-over",
    ...(shadow ? {
      designShadow: cloneObjectShadow(shadow),
      shadowEnabled: shadow.enabled,
      shadowColor: shadow.color,
      shadowBlur: shadow.blur,
      shadowOffsetX: shadow.offsetX,
      shadowOffsetY: shadow.offsetY,
      shadowOpacity: shadow.opacity,
    } : {}),
  };
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to decode image asset"));
    };
    image.src = url;
  });
}

function createMaskedImageSource(image: HTMLImageElement, crop: NormalizedCrop, mask: ImageMask): CanvasImageSource {
  if (!mask.enabled || !mask.strokes.length) return image;
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;
  const scale = Math.min(1, 4096 / Math.max(naturalWidth, naturalHeight));
  const width = Math.max(1, Math.round(naturalWidth * scale));
  const height = Math.max(1, Math.round(naturalHeight * scale));
  const source = document.createElement("canvas");
  const alpha = document.createElement("canvas");
  source.width = alpha.width = width;
  source.height = alpha.height = height;
  const sourceContext = source.getContext("2d");
  const alphaContext = alpha.getContext("2d");
  if (!sourceContext || !alphaContext) return image;
  sourceContext.drawImage(image, 0, 0, width, height);
  if (!mask.inverted) {
    alphaContext.fillStyle = "#ffffff";
    alphaContext.fillRect(0, 0, width, height);
  }
  const cropWidth = crop.width * width;
  const cropHeight = crop.height * height;
  for (const stroke of mask.strokes) {
    alphaContext.save();
    const hidesPixels = mask.inverted ? stroke.mode === "reveal" : stroke.mode === "hide";
    alphaContext.globalCompositeOperation = hidesPixels ? "destination-out" : "source-over";
    alphaContext.strokeStyle = "#ffffff";
    alphaContext.fillStyle = "#ffffff";
    alphaContext.lineCap = "round";
    alphaContext.lineJoin = "round";
    alphaContext.lineWidth = Math.max(1, stroke.size * Math.min(cropWidth, cropHeight));
    alphaContext.beginPath();
    for (let index = 0; index < stroke.points.length; index += 2) {
      const x = (crop.x + stroke.points[index] * crop.width) * width;
      const y = (crop.y + stroke.points[index + 1] * crop.height) * height;
      if (index === 0) alphaContext.moveTo(x, y);
      else alphaContext.lineTo(x, y);
    }
    if (stroke.points.length === 2) alphaContext.lineTo(
      (crop.x + stroke.points[0] * crop.width) * width + 0.01,
      (crop.y + stroke.points[1] * crop.height) * height,
    );
    alphaContext.stroke();
    alphaContext.restore();
  }
  sourceContext.save();
  sourceContext.globalCompositeOperation = "destination-in";
  if (mask.feather > 0) sourceContext.filter = `blur(${Math.min(100, mask.feather) * scale}px)`;
  sourceContext.drawImage(alpha, 0, 0);
  sourceContext.restore();
  return source;
}

function colorDetailFilter(adjustments: ImageAdjustments): Filter {
  return (imageData) => {
    const { data, width, height } = imageData;
    const source = adjustments.sharpen > 0 ? new Uint8ClampedArray(data) : null;
    const temperature = adjustments.temperature * 42;
    const tint = adjustments.tint * 34;
    const exposure = 2 ** adjustments.exposure;
    const levelsRange = Math.max(1, adjustments.levelsWhite - adjustments.levelsBlack);
    const gamma = 1 / Math.max(0.1, adjustments.levelsGamma);
    const centerX = (width - 1) / 2;
    const centerY = (height - 1) / 2;
    const maximumDistance = Math.sqrt(centerX * centerX + centerY * centerY) || 1;
    const clamp = (value: number) => Math.min(255, Math.max(0, value));
    const clampUnit = (value: number) => Math.min(1, Math.max(0, value));
    const toneCurve = (value: number) => {
      const normalized = clamp(value) / 255;
      if (adjustments.curve === "soft-contrast") return (normalized * normalized * (3 - 2 * normalized)) * 255;
      if (adjustments.curve === "strong-contrast") return clampUnit((normalized - 0.5) * 1.35 + 0.5) * 255;
      if (adjustments.curve === "matte") return (0.08 + normalized * 0.86) * 255;
      if (adjustments.curve === "soft-highlights") return (1 - (1 - normalized) ** 1.28) * 245;
      return normalized * 255;
    };

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        let red = data[index] * exposure + temperature + tint * 0.55;
        let green = data[index + 1] * exposure - Math.abs(tint) * 0.42;
        let blue = data[index + 2] * exposure - temperature + tint * 0.55;
        if (source && x > 0 && y > 0 && x < width - 1 && y < height - 1) {
          const strength = adjustments.sharpen * 0.7;
          const top = index - width * 4;
          const bottom = index + width * 4;
          for (let channel = 0; channel < 3; channel += 1) {
            const sharpened = source[index + channel] * (1 + strength * 4)
              - source[top + channel] * strength
              - source[bottom + channel] * strength
              - source[index - 4 + channel] * strength
              - source[index + 4 + channel] * strength;
            if (channel === 0) red = sharpened * exposure + temperature + tint * 0.55;
            if (channel === 1) green = sharpened * exposure - Math.abs(tint) * 0.42;
            if (channel === 2) blue = sharpened * exposure - temperature + tint * 0.55;
          }
        }
        const luminance = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;
        const shadowWeight = (1 - Math.min(1, luminance)) ** 2;
        const highlightWeight = Math.min(1, luminance) ** 2;
        const tonalLift = adjustments.shadows * shadowWeight * 92 + adjustments.highlights * highlightWeight * 92;
        red += tonalLift;
        green += tonalLift;
        blue += tonalLift;
        if (adjustments.vibrance !== 0) {
          const maximum = Math.max(red, green, blue);
          const minimum = Math.min(red, green, blue);
          const saturationRoom = 1 - Math.min(1, (maximum - minimum) / 255);
          const average = (red + green + blue) / 3;
          const boost = adjustments.vibrance * saturationRoom;
          red = average + (red - average) * (1 + boost);
          green = average + (green - average) * (1 + boost);
          blue = average + (blue - average) * (1 + boost);
        }
        const level = (value: number) => Math.pow(clampUnit((value - adjustments.levelsBlack) / levelsRange), gamma) * 255;
        red = toneCurve(level(red));
        green = toneCurve(level(green));
        blue = toneCurve(level(blue));
        if (adjustments.fade > 0) {
          const fade = adjustments.fade * 0.34;
          red = red * (1 - fade) + 232 * fade;
          green = green * (1 - fade) + 226 * fade;
          blue = blue * (1 - fade) + 218 * fade;
        }
        if (adjustments.vignette > 0) {
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) / maximumDistance;
          const shade = Math.max(0, (distance - 0.34) / 0.66) ** 1.7 * adjustments.vignette;
          red *= 1 - shade * 0.82;
          green *= 1 - shade * 0.82;
          blue *= 1 - shade * 0.82;
        }
        data[index] = clamp(red);
        data[index + 1] = clamp(green);
        data[index + 2] = clamp(blue);
      }
    }
  };
}

export function applyImageEdits(
  imageNode: Konva.Image,
  crop: NormalizedCrop,
  adjustments: ImageAdjustments,
): void {
  const source = imageNode.image();
  const sourceWidth = source && "width" in source ? Number(source.width) : imageNode.width();
  const sourceHeight = source && "height" in source ? Number(source.height) : imageNode.height();
  imageNode.crop({
    x: crop.x * sourceWidth,
    y: crop.y * sourceHeight,
    width: crop.width * sourceWidth,
    height: crop.height * sourceHeight,
  });
  imageNode.setAttr("normalizedCrop", { ...crop });
  imageNode.setAttr("imageAdjustments", { ...adjustments });
  imageNode.brightness(adjustments.brightness);
  imageNode.contrast(adjustments.contrast);
  imageNode.saturation(adjustments.saturation);
  imageNode.hue(adjustments.hue);
  imageNode.blurRadius(adjustments.blur);

  const filters: Filter[] = [];
  if (adjustments.brightness !== 0) filters.push(Konva.Filters.Brighten);
  if (adjustments.contrast !== 0) filters.push(Konva.Filters.Contrast);
  if (adjustments.saturation !== 0 || adjustments.hue !== 0) filters.push(Konva.Filters.HSL);
  if (
    adjustments.exposure !== 0 || adjustments.vibrance !== 0 || adjustments.highlights !== 0 || adjustments.shadows !== 0 || adjustments.fade !== 0 ||
    adjustments.levelsBlack !== 0 || adjustments.levelsWhite !== 255 || adjustments.levelsGamma !== 1 || adjustments.curve !== "linear" ||
    adjustments.temperature !== 0 || adjustments.tint !== 0 || adjustments.sharpen > 0 || adjustments.vignette > 0
  ) filters.push(colorDetailFilter(adjustments));
  if (adjustments.blur > 0) filters.push(Konva.Filters.Blur);
  if (adjustments.grayscale) filters.push(Konva.Filters.Grayscale);
  if (adjustments.sepia) filters.push(Konva.Filters.Sepia);
  imageNode.clearCache();
  if (filters.length) {
    imageNode.cache({ pixelRatio: 1 });
    imageNode.filters(filters);
  } else {
    imageNode.filters([]);
  }
}

export function applyImagePresentation(
  imageNode: Konva.Image,
  presentation: ImagePresentation,
): void {
  imageNode.setAttr("imagePresentation", cloneImagePresentation(presentation));
  imageNode.cornerRadius(presentation.cornerRadius);
  imageNode.strokeEnabled(false);
  imageNode.shadowEnabled(presentation.shadow.enabled && presentation.frame.type === "none");
  imageNode.shadowColor(presentation.shadow.color);
  imageNode.shadowBlur(presentation.shadow.blur);
  imageNode.shadowOffsetX(presentation.shadow.offsetX);
  imageNode.shadowOffsetY(presentation.shadow.offsetY);
  imageNode.shadowOpacity(presentation.shadow.opacity);
  const shell = imageNode.getParent()?.findOne(`#frame-shell-${imageNode.getAttr("designId")}`);
  if (shell instanceof Konva.Group) {
    updatePresentationFrameShell(shell, imageNode.width(), imageNode.height(), presentation);
    syncImageFrameShell(imageNode, shell);
  }
}

function frameIsDark(type: ImageFrame["type"]): boolean {
  return type.endsWith("-dark") || type === "arc-dark" || type === "border-dark";
}

function frameHasChrome(type: ImageFrame["type"]): boolean {
  return type.startsWith("arc-") || type.startsWith("macos-") || type.startsWith("windows-");
}

export function updatePresentationFrameShell(
  shell: Konva.Group,
  width: number,
  height: number,
  presentation: ImagePresentation,
): void {
  shell.destroyChildren();
  const frame = presentation.frame;
  const enabled = frame.type !== "none";
  shell.visible(enabled);
  shell.setAttrs({ width, height, framePresentation: { ...frame } });
  if (!enabled) return;

  const dark = frameIsDark(frame.type);
  const chrome = frameHasChrome(frame.type);
  const titleHeight = chrome ? Math.max(30, frame.padding || 30) : 0;
  const padding = chrome ? Math.max(1, frame.width) : Math.max(frame.padding, frame.width);
  const shellX = -padding;
  const shellY = -padding - titleHeight;
  const shellWidth = width + padding * 2;
  const shellHeight = height + padding * 2 + titleHeight;
  const bodyColor = frame.type === "photograph"
    ? "#ffffff"
    : frame.type.startsWith("glass-")
      ? dark ? "rgba(12,18,28,.72)" : "rgba(255,255,255,.72)"
      : frame.color;
  const strokeColor = frame.type === "outline-light" || frame.type === "border-light"
    ? "#ffffff"
    : frame.type === "border-dark"
      ? "#111111"
      : dark ? "#242424" : "#d8d8d8";
  shell.add(new Konva.Rect({
    x: shellX,
    y: shellY,
    width: shellWidth,
    height: shellHeight,
    fill: bodyColor,
    opacity: frame.opacity,
    stroke: strokeColor,
    strokeWidth: Math.max(frame.width, frame.type.startsWith("glass-") ? 2 : 1),
    cornerRadius: Math.max(4, presentation.cornerRadius + (chrome ? 8 : padding)),
    shadowEnabled: presentation.shadow.enabled,
    shadowColor: presentation.shadow.color,
    shadowBlur: presentation.shadow.blur,
    shadowOffsetX: presentation.shadow.offsetX,
    shadowOffsetY: presentation.shadow.offsetY,
    shadowOpacity: presentation.shadow.opacity,
    listening: false,
  }));

  if (!chrome) return;
  const textColor = dark ? "#f5f5f5" : "#242424";
  shell.add(new Konva.Text({
    x: shellX + 78,
    y: shellY + Math.max(8, titleHeight * 0.28),
    width: Math.max(40, shellWidth - 156),
    text: frame.title || (frame.type.startsWith("arc-") ? "glassware.app" : "GlassWare"),
    align: "center",
    fill: textColor,
    opacity: 0.82,
    fontFamily: "Arial",
    fontSize: Math.max(10, titleHeight * 0.32),
    listening: false,
  }));
  if (frame.type.startsWith("windows-")) {
    ["−", "□", "×"].forEach((symbol, index) => shell.add(new Konva.Text({
      x: shellX + shellWidth - 66 + index * 21,
      y: shellY + 7,
      width: 18,
      text: symbol,
      align: "center",
      fill: textColor,
      fontFamily: "Arial",
      fontSize: Math.max(11, titleHeight * 0.38),
      listening: false,
    })));
  } else {
    ["#ff5f57", "#febc2e", "#28c840"].forEach((color, index) => shell.add(new Konva.Circle({
      x: shellX + 18 + index * 19,
      y: shellY + titleHeight / 2,
      radius: Math.max(4, titleHeight * 0.14),
      fill: color,
      listening: false,
    })));
  }
}

export function syncImageFrameShell(imageNode: Konva.Image, shell: Konva.Group): void {
  shell.setAttrs({
    x: imageNode.x(),
    y: imageNode.y(),
    rotation: imageNode.rotation(),
    scaleX: imageNode.scaleX(),
    scaleY: imageNode.scaleY(),
    opacity: imageNode.opacity(),
    visible: imageNode.visible() && imageNode.getAttr("imagePresentation")?.frame?.type !== "none",
  });
}

export function createImageFrameShell(
  imageNode: Konva.Image,
  presentation: ImagePresentation,
): Konva.Group {
  const shell = new Konva.Group({
    id: `frame-shell-${imageNode.getAttr("designId")}`,
    listening: false,
  });
  updatePresentationFrameShell(shell, imageNode.width(), imageNode.height(), presentation);
  syncImageFrameShell(imageNode, shell);
  imageNode.on("xChange.frameShell yChange.frameShell widthChange.frameShell heightChange.frameShell rotationChange.frameShell scaleXChange.frameShell scaleYChange.frameShell opacityChange.frameShell visibleChange.frameShell", () => {
    updatePresentationFrameShell(
      shell,
      imageNode.width(),
      imageNode.height(),
      imageNode.getAttr("imagePresentation") ?? presentation,
    );
    syncImageFrameShell(imageNode, shell);
  });
  return shell;
}

async function createBlurRegionNode(
  node: ShapeDesignNode,
  source?: Konva.Container,
): Promise<Konva.Shape> {
  if (!source) return createShapeNode(node);
  const transform = source.getAbsoluteTransform();
  const topLeft = transform.point({ x: node.x, y: node.y });
  const topRight = transform.point({ x: node.x + node.width, y: node.y });
  const bottomLeft = transform.point({ x: node.x, y: node.y + node.height });
  const cropWidth = Math.max(1, Math.hypot(topRight.x - topLeft.x, topRight.y - topLeft.y));
  const cropHeight = Math.max(1, Math.hypot(bottomLeft.x - topLeft.x, bottomLeft.y - topLeft.y));
  const sourceLayer = source.getLayer();
  const sourceWasVisible = sourceLayer?.visible() ?? true;
  let snapshot: HTMLCanvasElement;
  try {
    // Project renders are assembled on a hidden staging layer. Konva skips
    // hidden ancestors when rasterizing, so expose that layer only for this
    // synchronous offscreen capture and restore it before the browser paints.
    if (sourceLayer && !sourceWasVisible) sourceLayer.visible(true);
    source.draw();
    snapshot = source.toCanvas({
      x: topLeft.x,
      y: topLeft.y,
      width: cropWidth,
      height: cropHeight,
      pixelRatio: 1,
    });
  } finally {
    if (sourceLayer && !sourceWasVisible) sourceLayer.visible(false);
  }
  const blur = new Konva.Image({
    ...commonAttributes(node),
    image: snapshot,
    designFill: node.fill,
    designShape: node.shape,
  });
  blur.cache({ pixelRatio: 1 });
  blur.blurRadius(28);
  blur.filters([Konva.Filters.Blur]);
  return blur;
}

export async function designNodeToKonva(
  node: DesignNode,
  resolveAsset: AssetResolver,
  blurSource?: Konva.Container,
): Promise<Konva.Shape> {
  if (node.kind === "text") {
    const transformedText = node.textTransform === "uppercase"
      ? node.text.toLocaleUpperCase()
      : node.textTransform === "lowercase"
        ? node.text.toLocaleLowerCase()
        : node.text;
    const italic = node.fontStyle.includes("italic");
    const fontStyle = `${italic ? "italic " : ""}${node.fontWeight ?? (node.fontStyle.includes("bold") ? 700 : 400)}`.trim();
    const textStyle = {
      ...commonAttributes(node),
      text: transformedText,
      fill: node.fill,
      fontFamily: node.fontFamily,
      fontSize: node.fontSize,
      fontStyle,
      align: node.align,
      lineHeight: node.lineHeight,
      letterSpacing: node.letterSpacing ?? 0,
      textDecoration: node.textDecoration === "none" ? "" : node.textDecoration,
      stroke: node.stroke ?? "#111111",
      strokeWidth: node.strokeWidth ?? 0,
      designText: node.text,
      textTransform: node.textTransform ?? "none",
      textGradient: cloneTextGradient(node.gradient),
      textCurve: cloneTextCurve(node.curve),
      textFontWeight: node.fontWeight ?? (node.fontStyle.includes("bold") ? 700 : 400),
    };
    const curve = cloneTextCurve(node.curve);
    const textNode: Konva.Text | Konva.TextPath = curve.mode === "none"
      ? new Konva.Text(textStyle)
      : new Konva.TextPath({
          ...textStyle,
          data: textCurvePath(node.width, node.height, curve.mode, curve.amount),
        });
    applyTextDesignStyle(textNode, node);
    return textNode;
  }
  if (node.kind === "shape") {
    if (node.shape === "blur") return createBlurRegionNode(node, blurSource);
    return createShapeNode(node);
  }

  const asset = await resolveAsset(node.assetId);
  if (!asset) {
    return new Konva.Rect({
      ...commonAttributes(node),
      fill: "#f2f2f2",
      stroke: "#b42318",
      dash: [12, 8],
      assetId: node.assetId,
      normalizedCrop: { ...node.crop },
      imageAdjustments: { ...node.adjustments },
      imagePresentation: cloneImagePresentation(node.presentation),
      imageMask: cloneImageMask(node.mask),
      missingAsset: true,
    });
  }
  const image = await loadImage(asset.blob);
  const maskedSource = createMaskedImageSource(image, node.crop, node.mask) as HTMLImageElement | HTMLCanvasElement;
  const imageNode = new Konva.Image({
    ...commonAttributes(node),
    image: createWarpedImageSource(maskedSource, node.warp ?? DEFAULT_IMAGE_WARP),
    assetId: node.assetId,
    imageMask: cloneImageMask(node.mask),
    imageWarp: cloneImageWarp(node.warp),
  });
  applyImageEdits(imageNode, node.crop, node.adjustments);
  applyImagePresentation(imageNode, node.presentation);
  return imageNode;
}

function readCommon(node: Konva.Node) {
  return {
    id: String(node.getAttr("designId")),
    name: String(node.getAttr("designName") || "Layer"),
    x: node.x(),
    y: node.y(),
    width: node.width(),
    height: node.height(),
    rotation: node.rotation(),
    scaleX: node.scaleX(),
    scaleY: node.scaleY(),
    skewX: Math.atan(node.skewX()) * 180 / Math.PI,
    skewY: Math.atan(node.skewY()) * 180 / Math.PI,
    opacity: node.opacity(),
    visible: node.visible(),
    locked: Boolean(node.getAttr("designLocked")),
    ...(node.getAttr("designGroupId") ? { groupId: String(node.getAttr("designGroupId")) } : {}),
    blendMode: (node.globalCompositeOperation() || "source-over") as DesignNode["blendMode"],
  };
}

export function konvaNodeToDesign(node: Konva.Node): DesignNode {
  const kind = node.getAttr("nodeKind") as DesignNode["kind"];
  if (kind === "text") {
    const text = node as Konva.Text | Konva.TextPath;
    const fontStyle = text.fontStyle();
    return {
      ...readCommon(node),
      kind,
      text: String(node.getAttr("designText") ?? text.text()),
      fill: String(text.fill() || "#111111"),
      fontFamily: text.fontFamily(),
      fontSize: text.fontSize(),
      fontStyle: fontStyle.includes("italic") ? "italic" : "normal",
      align: text.align() as TextDesignNode["align"],
      lineHeight: node instanceof Konva.Text ? node.lineHeight() : Number(node.getAttr("lineHeight") ?? 1),
      fontWeight: Number(node.getAttr("textFontWeight") ?? (fontStyle.includes("bold") ? 700 : Number(fontStyle) || 400)),
      letterSpacing: text.letterSpacing(),
      textDecoration: (text.textDecoration() || "none") as TextDesignNode["textDecoration"],
      textTransform: (node.getAttr("textTransform") || "none") as TextDesignNode["textTransform"],
      stroke: String(text.stroke() || "#111111"),
      strokeWidth: text.strokeWidth(),
      gradient: cloneTextGradient(node.getAttr("textGradient")),
      curve: cloneTextCurve(node.getAttr("textCurve")),
      shadow: cloneObjectShadow(node.getAttr("designShadow")),
    } satisfies TextDesignNode;
  }
  if (kind === "shape") {
    const shape = node as Konva.Shape;
    const isEllipse = node instanceof Konva.Ellipse;
    const common = readCommon(node);
    const shapeKind = (node.getAttr("designShape") || (isEllipse ? "ellipse" : "rect")) as ShapeKind;
    return {
      ...common,
      x: isEllipse ? node.x() - node.width() / 2 : common.x,
      y: isEllipse ? node.y() - node.height() / 2 : common.y,
      kind,
      shape: shapeKind,
      fill: String(node.getAttr("designFill") || shape.fill() || shape.stroke() || "#111111"),
      cornerRadius: shapeKind === "rounded-rect" && node instanceof Konva.Rect ? Number(node.cornerRadius()) : 0,
      shadow: cloneObjectShadow(node.getAttr("designShadow")),
    } satisfies ShapeDesignNode;
  }
  return {
    ...readCommon(node),
    kind: "image",
    assetId: String(node.getAttr("assetId")),
    crop: { ...(node.getAttr("normalizedCrop") ?? FULL_IMAGE_CROP) },
    adjustments: { ...(node.getAttr("imageAdjustments") ?? DEFAULT_IMAGE_ADJUSTMENTS) },
    presentation: cloneImagePresentation(node.getAttr("imagePresentation") ?? DEFAULT_IMAGE_PRESENTATION),
    mask: cloneImageMask(node.getAttr("imageMask") ?? DEFAULT_IMAGE_MASK),
    warp: cloneImageWarp(node.getAttr("imageWarp") ?? DEFAULT_IMAGE_WARP),
  } satisfies ImageDesignNode;
}

export function serializeLayer(layer: Konva.Layer): DesignNode[] {
  return layer
    .find(`.${DESIGN_OBJECT_NAME}`)
    .map((node) => konvaNodeToDesign(node));
}

export function findDesignNode(layer: Konva.Layer, designId: string): Konva.Shape | null {
  return (layer.find(`.${DESIGN_OBJECT_NAME}`).find((node) => node.getAttr("designId") === designId) as Konva.Shape | undefined) ?? null;
}

export function applyLockedState(node: Konva.Node, locked: boolean): void {
  node.setAttr("designLocked", locked);
  node.draggable(!locked);
  node.listening(!locked);
}

export function applyDesignFill(node: Konva.Node, color: string): void {
  node.setAttr("designFill", color);
  if (!(node instanceof Konva.Shape)) return;
  if (node instanceof Konva.Line || node instanceof Konva.Arrow) node.stroke(color);
  node.fill(color);
}
