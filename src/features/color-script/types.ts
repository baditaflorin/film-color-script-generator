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

export type ConfidenceLabel = "high" | "medium" | "low";

export interface InferenceConfidence {
  score: number;
  label: ConfidenceLabel;
  reasons: string[];
}

export type TimestampSource = "ffprobe-keyframe" | "fps-estimate" | "synthetic";

export interface FrameArtifacts {
  letterbox: boolean;
  dark: boolean;
  lowVariance: boolean;
  titleCard: boolean;
}

export interface FrameAnalysis {
  id: string;
  index: number;
  time: number;
  timestampSource: TimestampSource;
  width: number;
  height: number;
  palette: PaletteColor[];
  average: PaletteColor;
  luminance: number;
  variance: number;
  artifacts: FrameArtifacts;
  confidence: InferenceConfidence;
}

export interface SceneAnalysis {
  id: string;
  index: number;
  start: number;
  end: number;
  duration: number;
  representativeTime: number;
  frameIndices: number[];
  frameCount: number;
  palette: PaletteColor[];
  average: PaletteColor;
  confidence: InferenceConfidence;
  warnings: string[];
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
  timestampSource: TimestampSource;
  bytes: Uint8Array;
}

export interface DecodedFrameInput {
  index: number;
  time: number;
  timestampSource: TimestampSource;
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

export interface VideoFileDescriptor {
  name: string;
  type: string;
  sizeBytes: number;
  partial?: boolean | undefined;
}

export interface VideoMetadataInput {
  duration: number;
  width: number;
  height: number;
  hasVideo: boolean;
  rotationDegrees?: number | undefined;
  frameRateMode?: "constant" | "variable" | "unknown" | undefined;
}

export interface ProcessingPlan {
  sampleCount: number;
  paletteSize: number;
  sceneSensitivity: number;
  maxFrameWidth: number;
  stripMode: StripMode;
  preferKeyframes: boolean;
  estimatedCost: "small" | "medium" | "large" | "huge";
  reasons: string[];
}

export interface VideoPreflight {
  id: string;
  sourceFingerprint: string;
  blocked: boolean;
  confidence: InferenceConfidence;
  warnings: string[];
  errors: string[];
  normalized: VideoMetadataInput & {
    megapixels: number;
    aspectRatio: number;
    orientation: "landscape" | "portrait" | "square" | "unknown";
  };
  plan: ProcessingPlan;
  decisions: string[];
}
