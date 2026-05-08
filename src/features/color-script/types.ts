export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface PaletteColor {
  hex: string;
  rgb: RGB;
  weight: number;
}

export interface FrameAnalysis {
  index: number;
  time: number;
  width: number;
  height: number;
  palette: PaletteColor[];
  average: PaletteColor;
}

export interface SceneAnalysis {
  index: number;
  start: number;
  end: number;
  duration: number;
  representativeTime: number;
  frameIndices: number[];
  frameCount: number;
  palette: PaletteColor[];
  average: PaletteColor;
}

export type StripMode = "duration" | "equal";

export interface GeneratorSettings {
  sampleCount: number;
  paletteSize: number;
  sceneSensitivity: number;
  maxFrameWidth: number;
  stripMode: StripMode;
}

export interface VideoMetadata {
  name: string;
  size: number;
  type: string;
  duration: number;
  width: number;
  height: number;
}

export interface ExtractedPngFrame {
  index: number;
  time: number;
  bytes: Uint8Array;
}

export interface DecodedFrameInput {
  index: number;
  time: number;
  width: number;
  height: number;
  data: Uint8ClampedArray;
  paletteSize: number;
}

export interface ProcessingProgress {
  phase: "idle" | "metadata" | "engine" | "sampling" | "palette" | "render" | "done";
  value: number;
  message: string;
}
