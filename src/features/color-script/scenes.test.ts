import { describe, expect, it } from "vitest";
import { groupFramesIntoScenes, sceneCountLabel } from "./scenes";
import type { FrameAnalysis, GeneratorSettings, PaletteColor } from "./types";

const settings: GeneratorSettings = {
  sampleCount: 4,
  paletteSize: 3,
  sceneSensitivity: 70,
  maxFrameWidth: 320,
  stripMode: "duration"
};

function color(hex: string): PaletteColor {
  return {
    hex,
    rgb: {
      r: Number.parseInt(hex.slice(1, 3), 16),
      g: Number.parseInt(hex.slice(3, 5), 16),
      b: Number.parseInt(hex.slice(5, 7), 16)
    },
    weight: 1
  };
}

function frame(index: number, time: number, hex: string): FrameAnalysis {
  const paletteColor = color(hex);
  return {
    index,
    time,
    width: 16,
    height: 16,
    palette: [paletteColor],
    average: paletteColor
  };
}

describe("scene grouping", () => {
  it("splits on large palette changes", () => {
    const scenes = groupFramesIntoScenes(
      [
        frame(0, 0, "#101820"),
        frame(1, 4, "#111922"),
        frame(2, 8, "#d9825b"),
        frame(3, 12, "#db855f")
      ],
      settings,
      16
    );

    expect(scenes).toHaveLength(2);
    expect(scenes[0]?.frameIndices).toEqual([0, 1]);
    expect(scenes[1]?.frameIndices).toEqual([2, 3]);
  });

  it("labels scene counts", () => {
    expect(sceneCountLabel(1)).toBe("1 scene");
    expect(sceneCountLabel(3)).toBe("3 scenes");
  });
});
