import { averageFrameColor, mergePalettes, paletteDistance } from "./palette";
import type { FrameAnalysis, GeneratorSettings, SceneAnalysis } from "./types";
import { combineConfidence, makeConfidence } from "./confidence";

function sensitivityToThreshold(sensitivity: number): number {
  const normalized = Math.max(0, Math.min(100, sensitivity)) / 100;
  return 0.64 - normalized * 0.48;
}

function makeScene(
  index: number,
  frames: FrameAnalysis[],
  end: number,
  settings: GeneratorSettings
): SceneAnalysis {
  const first = frames[0];
  const last = frames[frames.length - 1];

  if (!first || !last) {
    throw new Error("Cannot create a scene without frames.");
  }

  const start = first.time;
  const duration = Math.max(0.01, end - start);
  const warnings = new Set<string>();

  if (frames.some((frame) => frame.artifacts.letterbox)) {
    warnings.add("letterbox-risk");
  }
  if (frames.some((frame) => frame.artifacts.dark)) {
    warnings.add("dark-frame-risk");
  }
  if (frames.some((frame) => frame.artifacts.lowVariance)) {
    warnings.add("low-variance");
  }
  if (frames.some((frame) => frame.timestampSource === "fps-estimate")) {
    warnings.add("estimated-timing");
  }
  if (frames.length === 1) {
    warnings.add("single-frame-scene");
  }

  const confidence = combineConfidence(
    frames.map((frame) => frame.confidence),
    warnings.size > 0
      ? [`Scene warnings: ${[...warnings].join(", ")}.`]
      : ["Scene grouped from adjacent palette distance."]
  );

  return {
    id: `scene-${String(index + 1).padStart(3, "0")}`,
    index,
    start,
    end,
    duration,
    representativeTime: start + duration / 2,
    frameIndices: frames.map((frame) => frame.index),
    frameCount: frames.length,
    palette: mergePalettes(frames, settings.paletteSize),
    average: averageFrameColor(frames),
    confidence: frames.length === 0 ? makeConfidence(0.4, ["No frames in scene."]) : confidence,
    warnings: [...warnings].sort()
  };
}

export function groupFramesIntoScenes(
  frames: FrameAnalysis[],
  settings: GeneratorSettings,
  videoDuration: number
): SceneAnalysis[] {
  if (frames.length === 0) {
    return [];
  }

  const ordered = [...frames].sort((a, b) => a.time - b.time);
  const threshold = sensitivityToThreshold(settings.sceneSensitivity);
  const groups: FrameAnalysis[][] = [[ordered[0] as FrameAnalysis]];

  for (let index = 1; index < ordered.length; index += 1) {
    const frame = ordered[index] as FrameAnalysis;
    const previous = ordered[index - 1] as FrameAnalysis;
    const currentGroup = groups[groups.length - 1] as FrameAnalysis[];
    const split = paletteDistance(previous, frame) > threshold && currentGroup.length >= 1;

    if (split) {
      groups.push([frame]);
    } else {
      currentGroup.push(frame);
    }
  }

  return groups.map((group, index) => {
    const next = groups[index + 1]?.[0];
    const last = group[group.length - 1];
    if (!last) {
      throw new Error("Cannot create a scene without frames.");
    }
    const fallbackEnd =
      Number.isFinite(videoDuration) && videoDuration > 0 ? videoDuration : last.time + 1;
    const end = next ? next.time : fallbackEnd;
    return makeScene(index, group, end, settings);
  });
}

export function sceneCountLabel(count: number): string {
  return count === 1 ? "1 scene" : `${count} scenes`;
}
