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

export const colorScriptExportSchema = z.object({
  schemaVersion: z.literal(1),
  appVersion: z.string(),
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
  scenes: z.array(
    z.object({
      index: z.number().int().nonnegative(),
      start: z.number().nonnegative(),
      end: z.number().nonnegative(),
      duration: z.number().positive(),
      representativeTime: z.number().nonnegative(),
      frameIndices: z.array(z.number().int().nonnegative()),
      frameCount: z.number().int().positive(),
      palette: z.array(colorSchema),
      average: colorSchema
    })
  ),
  generatedAt: z.string()
});

export type ColorScriptExport = z.infer<typeof colorScriptExportSchema>;
