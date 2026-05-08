import { transfer, wrap } from "comlink";
import type { DecodedFrameInput, FrameAnalysis } from "./types";
import type { PaletteWorkerApi } from "./palette.worker";

export interface PaletteWorkerClient {
  analyzeFrame(input: DecodedFrameInput): Promise<FrameAnalysis>;
  dispose(): void;
}

export function createPaletteWorkerClient(): PaletteWorkerClient {
  const worker = new Worker(new URL("./palette.worker.ts", import.meta.url), { type: "module" });
  const api = wrap<PaletteWorkerApi>(worker);

  return {
    analyzeFrame(input: DecodedFrameInput): Promise<FrameAnalysis> {
      return api.analyzeFrame(transfer(input, [input.data.buffer as ArrayBuffer]));
    },
    dispose(): void {
      worker.terminate();
    }
  };
}
