import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { canonicalPreflightJson, preflightVideo } from "./preflight";
import type { GeneratorSettings, VideoFileDescriptor, VideoMetadataInput } from "./types";

interface FixtureInput {
  id: string;
  file: VideoFileDescriptor;
  metadata: VideoMetadataInput;
  riskHints: string[];
}

interface FixtureExpected {
  id: string;
  expectedPass: boolean;
  blocked: boolean;
  expectedWarnings: string[];
  expectedPlan: {
    sampleCountMin: number;
    sampleCountMax: number;
    maxFrameWidthMax: number;
  };
  minConfidence: number;
}

const fixtureDir = join(process.cwd(), "test/fixtures/realdata");
const defaultSettings: GeneratorSettings = {
  sampleCount: 36,
  paletteSize: 5,
  sceneSensitivity: 70,
  maxFrameWidth: 360,
  stripMode: "duration"
};

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function loadFixtures(): Array<{ input: FixtureInput; expected: FixtureExpected }> {
  return readdirSync(fixtureDir)
    .filter((file) => file.endsWith(".input.json"))
    .sort()
    .map((inputFile) => {
      const expectedFile = inputFile.replace(".input.json", ".expected.json");
      return {
        input: readJson<FixtureInput>(join(fixtureDir, inputFile)),
        expected: readJson<FixtureExpected>(join(fixtureDir, expectedFile))
      };
    });
}

describe("real-data preflight fixtures", () => {
  const fixtures = loadFixtures();

  it("covers the 10 real-data audit inputs", () => {
    expect(fixtures).toHaveLength(10);
  });

  it.each(fixtures)("$input.id matches expected preflight behavior", ({ input, expected }) => {
    const preflight = preflightVideo(input.file, input.metadata, defaultSettings, input.riskHints);

    expect(preflight.blocked).toBe(expected.blocked);
    expect(preflight.confidence.score).toBeGreaterThanOrEqual(expected.minConfidence);

    for (const warning of expected.expectedWarnings) {
      expect(preflight.warnings).toContain(warning);
    }

    expect(preflight.plan.sampleCount).toBeGreaterThanOrEqual(expected.expectedPlan.sampleCountMin);
    expect(preflight.plan.sampleCount).toBeLessThanOrEqual(expected.expectedPlan.sampleCountMax);
    expect(preflight.plan.maxFrameWidth).toBeLessThanOrEqual(
      expected.expectedPlan.maxFrameWidthMax
    );
    expect(preflight.confidence.reasons.length).toBeGreaterThan(0);
  });

  it("is deterministic for every fixture", () => {
    for (const { input } of fixtures) {
      const first = preflightVideo(input.file, input.metadata, defaultSettings, input.riskHints);
      const second = preflightVideo(input.file, input.metadata, defaultSettings, input.riskHints);

      expect(canonicalPreflightJson(first)).toBe(canonicalPreflightJson(second));
    }
  });

  it("achieves the phase 2 preflight pass target", () => {
    const useful = fixtures.filter(({ input }) => {
      const preflight = preflightVideo(
        input.file,
        input.metadata,
        defaultSettings,
        input.riskHints
      );
      return preflight.blocked || preflight.plan.sampleCount > 0;
    });

    expect(useful.length / fixtures.length).toBeGreaterThanOrEqual(0.7);
  });
});
