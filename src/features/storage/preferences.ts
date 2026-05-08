import { z } from "zod";
import type { GeneratorSettings } from "../color-script/types";

const STORAGE_KEY = "film-color-script-generator:settings:v1";

export const defaultSettings: GeneratorSettings = {
  sampleCount: 36,
  paletteSize: 5,
  sceneSensitivity: 70,
  maxFrameWidth: 360,
  stripMode: "duration"
};

const settingsSchema = z.object({
  sampleCount: z.number().int().min(8).max(96),
  paletteSize: z.number().int().min(3).max(8),
  sceneSensitivity: z.number().min(0).max(100),
  maxFrameWidth: z.number().int().min(160).max(720),
  stripMode: z.enum(["duration", "equal"])
});

export function loadSettings(): GeneratorSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return defaultSettings;
    }

    return settingsSchema.parse({ ...defaultSettings, ...JSON.parse(raw) });
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: GeneratorSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsSchema.parse(settings)));
}
