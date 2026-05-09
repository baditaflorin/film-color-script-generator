import { describe, expect, it } from "vitest";
import { makeConfidence } from "./confidence";
import { createExportPayload, safeBaseName } from "./export";
import type { GeneratorSettings, SceneAnalysis, VideoMetadata } from "./types";

const settings: GeneratorSettings = {
  sampleCount: 12,
  paletteSize: 3,
  sceneSensitivity: 50,
  maxFrameWidth: 320,
  stripMode: "equal"
};

const video: VideoMetadata = {
  name: "My Film.mov",
  size: 1024,
  type: "video/quicktime",
  duration: 10,
  width: 1920,
  height: 1080
};

const scene: SceneAnalysis = {
  id: "scene-001",
  index: 0,
  start: 0,
  end: 10,
  duration: 10,
  representativeTime: 5,
  frameIndices: [0],
  frameCount: 1,
  palette: [{ hex: "#d9825b", rgb: { r: 217, g: 130, b: 91 }, weight: 1 }],
  average: { hex: "#d9825b", rgb: { r: 217, g: 130, b: 91 }, weight: 1 },
  confidence: makeConfidence(0.9, ["Test scene."]),
  warnings: []
};

describe("export contract", () => {
  it("creates schema-valid JSON payloads", () => {
    const payload = createExportPayload(video, settings, [scene]);

    expect(payload.schemaVersion).toBe(1);
    expect(payload.source.name).toBe("My Film.mov");
    expect(payload.scenes[0]?.palette[0]?.hex).toBe("#d9825b");
  });

  it("normalizes export names", () => {
    expect(safeBaseName("My Film: Scene 01.mov")).toBe("my-film-scene-01");
  });
});
