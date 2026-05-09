import { z } from "zod";

const rgbSchema = z.object({
  r: z.number().int().min(0).max(255),
  g: z.number().int().min(0).max(255),
  b: z.number().int().min(0).max(255)
});

const colorSchema = z.object({
  hex: z.string().regex(/^#[0-9a-f]{6}$/i),
  rgb: rgbSchema,
  weight: z.number().min(0).max(1)
});

const confidenceSchema = z.object({
  score: z.number().min(0).max(1),
  label: z.enum(["high", "medium", "low"]),
  reasons: z.array(z.string())
});

const processingPlanSchema = z.object({
  sampleCount: z.number().int().nonnegative(),
  paletteSize: z.number().int().positive(),
  sceneSensitivity: z.number().min(0).max(100),
  maxFrameWidth: z.number().int().nonnegative(),
  stripMode: z.enum(["duration", "equal"]),
  preferKeyframes: z.boolean(),
  estimatedCost: z.enum(["small", "medium", "large", "huge"]),
  reasons: z.array(z.string())
});

const preflightSchema = z.object({
  id: z.string(),
  sourceFingerprint: z.string(),
  blocked: z.boolean(),
  confidence: confidenceSchema,
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
  normalized: z.object({
    duration: z.number().nonnegative(),
    width: z.number().int().nonnegative(),
    height: z.number().int().nonnegative(),
    hasVideo: z.boolean(),
    rotationDegrees: z.number(),
    frameRateMode: z.enum(["constant", "variable", "unknown"]),
    megapixels: z.number().nonnegative(),
    aspectRatio: z.number().nonnegative(),
    orientation: z.enum(["landscape", "portrait", "square", "unknown"])
  }),
  plan: processingPlanSchema,
  decisions: z.array(z.string())
});

export const colorScriptExportSchema = z.object({
  schemaVersion: z.literal(2),
  appVersion: z.string(),
  commit: z.string(),
  sourceFingerprint: z.string().optional(),
  source: z.object({
    name: z.string(),
    size: z.number().nonnegative(),
    type: z.string(),
    duration: z.number().nonnegative(),
    width: z.number().nonnegative(),
    height: z.number().nonnegative()
  }),
  settings: z.object({
    sampleCount: z.number().int().positive(),
    paletteSize: z.number().int().positive(),
    sceneSensitivity: z.number().min(0).max(100),
    maxFrameWidth: z.number().int().positive(),
    stripMode: z.enum(["duration", "equal"])
  }),
  preflight: preflightSchema.optional(),
  scenes: z.array(
    z.object({
      id: z.string(),
      index: z.number().int().nonnegative(),
      start: z.number().nonnegative(),
      end: z.number().nonnegative(),
      duration: z.number().positive(),
      representativeTime: z.number().nonnegative(),
      frameIndices: z.array(z.number().int().nonnegative()),
      frameCount: z.number().int().positive(),
      palette: z.array(colorSchema),
      average: colorSchema,
      confidence: confidenceSchema,
      warnings: z.array(z.string())
    })
  ),
  generatedAt: z.string()
});

export type ColorScriptExport = z.infer<typeof colorScriptExportSchema>;
