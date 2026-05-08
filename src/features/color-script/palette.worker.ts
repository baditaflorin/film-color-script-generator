import { expose } from "comlink";
import { analyzePixelData } from "./palette";
import type { DecodedFrameInput, FrameAnalysis } from "./types";

const api = {
  analyzeFrame(input: DecodedFrameInput): FrameAnalysis {
    return analyzePixelData(input);
  }
};

export type PaletteWorkerApi = typeof api;

expose(api);
