import { describe, expect, it } from "vitest";
import { analyzePixelData, colorDistance, mergePalettes, rgbToHex } from "./palette";
import type { DecodedFrameInput, FrameAnalysis } from "./types";

function frameFromPixels(pixels: Array<[number, number, number]>): DecodedFrameInput {
  const data = new Uint8ClampedArray(pixels.length * 4);

  pixels.forEach(([r, g, b], index) => {
    const offset = index * 4;
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = 255;
  });

  return {
    index: 0,
    time: 0,
    width: pixels.length,
    height: 1,
    data,
    paletteSize: 3
  };
}

describe("palette analysis", () => {
  it("formats RGB values as hex", () => {
    expect(rgbToHex({ r: 217, g: 130, b: 91 })).toBe("#d9825b");
  });

  it("extracts dominant colors from pixel data", () => {
    const frame = analyzePixelData(
      frameFromPixels([
        [220, 20, 20],
        [220, 20, 20],
        [220, 20, 20],
        [20, 40, 210],
        [20, 40, 210]
      ])
    );

    expect(frame.palette).toHaveLength(2);
    expect(frame.palette[0]?.hex).toBe("#dc1414");
    expect(frame.palette[0]?.weight).toBeGreaterThan(frame.palette[1]?.weight ?? 0);
  });

  it("keeps normalized color distance stable", () => {
    expect(colorDistance({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(1);
    expect(colorDistance({ r: 12, g: 34, b: 56 }, { r: 12, g: 34, b: 56 })).toBe(0);
  });

  it("merges frame palettes for scene-level palettes", () => {
    const frames: FrameAnalysis[] = [
      analyzePixelData(
        frameFromPixels([
          [10, 20, 30],
          [10, 20, 30],
          [200, 80, 40]
        ])
      ),
      analyzePixelData(
        frameFromPixels([
          [10, 20, 30],
          [210, 90, 50],
          [210, 90, 50]
        ])
      )
    ];

    const merged = mergePalettes(frames, 2);

    expect(merged).toHaveLength(2);
    expect(merged[0]?.weight).toBeGreaterThan(0.4);
  });
});
