import { z } from "zod";
import { makeConfidence } from "./confidence";
import type {
  GeneratorSettings,
  ProcessingPlan,
  VideoFileDescriptor,
  VideoMetadataInput,
  VideoPreflight
} from "./types";

const MB = 1024 * 1024;
const HUGE_RESOLUTION_PIXELS = 3840 * 2160;
const LARGE_FILE_BYTES = 100 * MB;
const HUGE_FILE_BYTES = 250 * MB;

export const videoFileDescriptorSchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  partial: z.boolean().optional()
});

export const videoMetadataInputSchema = z.object({
  duration: z.number().nonnegative(),
  width: z.number().int().nonnegative(),
  height: z.number().int().nonnegative(),
  hasVideo: z.boolean(),
  rotationDegrees: z.number().optional(),
  frameRateMode: z.enum(["constant", "variable", "unknown"]).optional()
});

export function sourceFingerprint(file: VideoFileDescriptor, metadata: VideoMetadataInput): string {
  const source = [
    file.name,
    file.type,
    file.sizeBytes,
    file.partial ? "partial" : "complete",
    metadata.duration.toFixed(3),
    metadata.width,
    metadata.height,
    metadata.rotationDegrees ?? 0,
    metadata.frameRateMode ?? "unknown"
  ].join("|");
  let hash = 2166136261;

  for (const char of source) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return `src-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function orientation(
  width: number,
  height: number
): "landscape" | "portrait" | "square" | "unknown" {
  if (width <= 0 || height <= 0) {
    return "unknown";
  }
  if (width === height) {
    return "square";
  }
  return width > height ? "landscape" : "portrait";
}

function inferSampleCount(duration: number, fileSize: number, megapixels: number): number {
  if (duration <= 0) {
    return 0;
  }

  let sampleCount = 8;
  if (duration >= 8) {
    sampleCount = 16;
  }
  if (duration >= 20) {
    sampleCount = 24;
  }
  if (duration >= 40) {
    sampleCount = 36;
  }
  if (duration >= 60) {
    sampleCount = 44;
  }
  if (duration >= 180) {
    sampleCount = 64;
  }
  if (duration >= 420) {
    sampleCount = 84;
  }

  if (fileSize > HUGE_FILE_BYTES) {
    sampleCount = Math.min(sampleCount, 64);
  }

  if (megapixels >= 8 && duration <= 20) {
    sampleCount = Math.min(sampleCount, 20);
  }

  return Math.max(8, Math.min(96, sampleCount));
}

function inferCost(
  fileSize: number,
  duration: number,
  megapixels: number
): ProcessingPlan["estimatedCost"] {
  if (fileSize > HUGE_FILE_BYTES || duration > 900 || megapixels >= 12) {
    return "huge";
  }
  if (fileSize > LARGE_FILE_BYTES || duration > 300 || megapixels >= 8) {
    return "large";
  }
  if (fileSize > 25 * MB || duration > 60 || megapixels >= 3) {
    return "medium";
  }
  return "small";
}

export function preflightVideo(
  fileInput: VideoFileDescriptor,
  metadataInput: VideoMetadataInput,
  currentSettings?: GeneratorSettings,
  riskHints: string[] = []
): VideoPreflight {
  const file = videoFileDescriptorSchema.parse(fileInput);
  const metadata = videoMetadataInputSchema.parse(metadataInput);
  const warnings = new Set<string>();
  const errors = new Set<string>();
  const decisions: string[] = [];
  const width = metadata.width;
  const height = metadata.height;
  const megapixels = width > 0 && height > 0 ? (width * height) / 1_000_000 : 0;
  const aspectRatio = width > 0 && height > 0 ? width / height : 0;

  if (file.sizeBytes === 0 || riskHints.includes("empty")) {
    warnings.add("empty-file");
    errors.add("no-usable-video");
  }
  if (file.partial || riskHints.includes("partial") || riskHints.includes("metadata-failed")) {
    warnings.add("partial-file");
    errors.add("no-usable-video");
  }
  if (!metadata.hasVideo || metadata.duration <= 0 || width <= 0 || height <= 0) {
    warnings.add("no-usable-video");
    errors.add("no-usable-video");
  }
  if (/webm/i.test(file.type) || /\.webm$/i.test(file.name)) {
    warnings.add("codec-container-variant");
  }
  if (file.sizeBytes > LARGE_FILE_BYTES) {
    warnings.add("large-file");
  }
  if (metadata.duration > 300) {
    warnings.add("long-duration");
  }
  if (width * height >= HUGE_RESOLUTION_PIXELS || riskHints.includes("4k")) {
    warnings.add("huge-resolution");
  }
  if ((metadata.rotationDegrees ?? 0) % 180 !== 0 || riskHints.includes("rotation-metadata")) {
    warnings.add("orientation-metadata");
  }
  if (metadata.frameRateMode === "variable" || riskHints.includes("vfr")) {
    warnings.add("variable-frame-rate");
  }
  if (orientation(width, height) === "portrait" || riskHints.includes("portrait-display")) {
    warnings.add("portrait-display");
  }
  if (riskHints.includes("letterbox")) {
    warnings.add("letterbox-risk");
  }
  if (riskHints.includes("dark-scenes")) {
    warnings.add("dark-frame-risk");
  }

  const blocked = errors.size > 0;
  const estimatedCost = inferCost(file.sizeBytes, metadata.duration, megapixels);
  const sampleCount = blocked ? 0 : inferSampleCount(metadata.duration, file.sizeBytes, megapixels);
  const maxFrameWidth = blocked
    ? 0
    : width * height >= HUGE_RESOLUTION_PIXELS
      ? 320
      : estimatedCost === "huge"
        ? 280
        : (currentSettings?.maxFrameWidth ?? 360);
  const sceneSensitivity = blocked
    ? (currentSettings?.sceneSensitivity ?? 70)
    : metadata.duration > 60 || riskHints.includes("visible-cuts")
      ? 74
      : (currentSettings?.sceneSensitivity ?? 70);

  decisions.push(
    blocked
      ? "Generation is blocked until the input has a usable video track."
      : `Recommended ${sampleCount} samples at ${maxFrameWidth}px for a ${estimatedCost} browser workload.`
  );

  if (warnings.has("variable-frame-rate")) {
    decisions.push(
      "Frame timestamps must come from FFmpeg when available; even timing is low confidence."
    );
  }
  if (warnings.has("letterbox-risk")) {
    decisions.push(
      "Palette confidence should be reduced if frame edges are dominated by bars or titles."
    );
  }

  const warningPenalty = Math.min(0.38, warnings.size * 0.055);
  const score = blocked && errors.has("no-usable-video") ? 0.95 : 0.92 - warningPenalty;
  const confidence = makeConfidence(score, [
    blocked
      ? "The file was classified before generation."
      : "The processing plan was inferred from source metadata.",
    ...decisions
  ]);
  const fingerprint = sourceFingerprint(file, metadata);

  return {
    id: `preflight-${fingerprint}`,
    sourceFingerprint: fingerprint,
    blocked,
    confidence,
    warnings: [...warnings].sort(),
    errors: [...errors].sort(),
    normalized: {
      ...metadata,
      rotationDegrees: metadata.rotationDegrees ?? 0,
      frameRateMode: metadata.frameRateMode ?? "unknown",
      megapixels: Number(megapixels.toFixed(3)),
      aspectRatio: Number(aspectRatio.toFixed(4)),
      orientation: orientation(width, height)
    },
    plan: {
      sampleCount,
      paletteSize: currentSettings?.paletteSize ?? 5,
      sceneSensitivity,
      maxFrameWidth,
      stripMode: currentSettings?.stripMode ?? "duration",
      preferKeyframes: !blocked,
      estimatedCost,
      reasons: decisions
    },
    decisions
  };
}

export function canonicalPreflightJson(preflight: VideoPreflight): string {
  return `${stableStringify(preflight)}\n`;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
