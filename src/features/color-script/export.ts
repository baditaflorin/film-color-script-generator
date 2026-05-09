import { buildInfo } from "../../generated/buildInfo";
import { AppError } from "../../lib/errors";
import { colorScriptExportSchema, type ColorScriptExport } from "./schema";
import type {
  GeneratorSettings,
  PaletteColor,
  SceneAnalysis,
  VideoMetadata,
  VideoPreflight
} from "./types";

export interface StripRenderOptions {
  width: number;
  height: number;
  background: string;
}

function drawPaletteBands(
  context: CanvasRenderingContext2D,
  palette: PaletteColor[],
  x: number,
  y: number,
  width: number,
  height: number
): void {
  let offset = 0;

  for (const color of palette) {
    const bandHeight = Math.max(1, height * color.weight);
    context.fillStyle = color.hex;
    context.fillRect(x, y + offset, width, bandHeight);
    offset += bandHeight;
  }

  if (offset < height && palette[0]) {
    context.fillStyle = palette[0].hex;
    context.fillRect(x, y + offset, width, height - offset);
  }
}

export function renderStripCanvas(
  scenes: SceneAnalysis[],
  settings: GeneratorSettings,
  options: StripRenderOptions
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ratio = window.devicePixelRatio || 1;
  canvas.width = options.width * ratio;
  canvas.height = options.height * ratio;
  canvas.style.width = `${options.width}px`;
  canvas.style.height = `${options.height}px`;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new AppError("export-failed", "Canvas is not available in this browser.");
  }

  context.scale(ratio, ratio);
  context.fillStyle = options.background;
  context.fillRect(0, 0, options.width, options.height);

  const totalDuration =
    scenes.reduce((sum, scene) => sum + scene.duration, 0) || scenes.length || 1;
  let x = 0;

  scenes.forEach((scene, index) => {
    const remaining = options.width - x;
    const targetWidth =
      settings.stripMode === "equal"
        ? options.width / scenes.length
        : (scene.duration / totalDuration) * options.width;
    const width = index === scenes.length - 1 ? remaining : Math.max(3, targetWidth);

    context.fillStyle = scene.average.hex;
    context.fillRect(x, 0, width, options.height);
    drawPaletteBands(context, scene.palette, x, 12, width, options.height - 24);

    context.strokeStyle = "rgba(24, 34, 29, 0.34)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(Math.round(x) + 0.5, 0);
    context.lineTo(Math.round(x) + 0.5, options.height);
    context.stroke();

    x += width;
  });

  return canvas;
}

export function createExportPayload(
  video: VideoMetadata,
  settings: GeneratorSettings,
  scenes: SceneAnalysis[],
  preflight?: VideoPreflight
): ColorScriptExport {
  return colorScriptExportSchema.parse({
    schemaVersion: 2,
    appVersion: buildInfo.version,
    commit: buildInfo.fullCommit,
    sourceFingerprint: preflight?.sourceFingerprint,
    source: video,
    settings,
    preflight,
    scenes,
    generatedAt: new Date().toISOString()
  });
}

export function createCanonicalAnalysisJson(
  video: VideoMetadata,
  settings: GeneratorSettings,
  scenes: SceneAnalysis[],
  preflight?: VideoPreflight
): string {
  const payload = colorScriptExportSchema.parse({
    schemaVersion: 2,
    appVersion: buildInfo.version,
    commit: buildInfo.fullCommit,
    sourceFingerprint: preflight?.sourceFingerprint,
    source: video,
    settings,
    preflight,
    scenes,
    generatedAt: "1970-01-01T00:00:00.000Z"
  });

  return `${stableStringify(payload)}\n`;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function createSvgStrip(scenes: SceneAnalysis[], settings: GeneratorSettings): string {
  const width = Math.max(960, scenes.length * 120);
  const height = 240;
  const totalDuration =
    scenes.reduce((sum, scene) => sum + scene.duration, 0) || scenes.length || 1;
  let x = 0;
  const rects: string[] = [];

  scenes.forEach((scene, index) => {
    const remaining = width - x;
    const sceneWidth =
      settings.stripMode === "equal"
        ? width / scenes.length
        : (scene.duration / totalDuration) * width;
    const segmentWidth = index === scenes.length - 1 ? remaining : Math.max(3, sceneWidth);
    let y = 8;

    rects.push(
      `<rect x="${x.toFixed(2)}" y="0" width="${segmentWidth.toFixed(2)}" height="${height}" fill="${scene.average.hex}" />`
    );

    for (const color of scene.palette) {
      const bandHeight = Math.max(1, (height - 16) * color.weight);
      rects.push(
        `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${segmentWidth.toFixed(2)}" height="${bandHeight.toFixed(2)}" fill="${color.hex}" />`
      );
      y += bandHeight;
    }

    rects.push(
      `<line x1="${x.toFixed(2)}" y1="0" x2="${x.toFixed(2)}" y2="${height}" stroke="rgba(24,34,29,0.35)" stroke-width="1" />`
    );
    x += segmentWidth;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${rects.join("")}</svg>`;
}

export async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png", 0.96)
  );

  if (!blob) {
    throw new AppError("export-failed", "The browser could not create a PNG export.");
  }

  return blob;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function safeBaseName(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
