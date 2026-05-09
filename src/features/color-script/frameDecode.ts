import { AppError } from "../../lib/errors";
import type { DecodedFrameInput, ExtractedPngFrame } from "./types";

export async function decodePngFrame(
  frame: ExtractedPngFrame,
  paletteSize: number
): Promise<DecodedFrameInput> {
  const blob = new Blob([frame.bytes as BlobPart], { type: "image/png" });
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    bitmap.close();
    throw new AppError("palette-failed", "Canvas pixel access is not available in this browser.");
  }

  context.drawImage(bitmap, 0, 0);
  const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);
  bitmap.close();

  return {
    index: frame.index,
    time: frame.time,
    timestampSource: frame.timestampSource,
    width: imageData.width,
    height: imageData.height,
    data: imageData.data,
    paletteSize
  };
}
