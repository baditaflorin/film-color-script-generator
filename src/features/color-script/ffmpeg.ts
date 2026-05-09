import { AppError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import type { ExtractedPngFrame, GeneratorSettings, ProcessingProgress } from "./types";
import type { FFmpeg as FFmpegInstance } from "@ffmpeg/ffmpeg";

type FileData = Uint8Array | string;

interface ProbeFrame {
  best_effort_timestamp_time?: string;
  pkt_pts_time?: string;
  pict_type?: string;
}

interface ProbeOutput {
  frames?: ProbeFrame[];
}

let ffmpegPromise: Promise<FFmpegInstance> | null = null;

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException("Operation aborted.", "AbortError");
  }
}

function ffmpegOptions(signal?: AbortSignal): { signal: AbortSignal } | undefined {
  return signal ? { signal } : undefined;
}

function fileExtension(file: File): string {
  const match = /\.([a-z0-9]+)$/i.exec(file.name);
  const extension = match?.[1];
  return extension ? extension.toLowerCase() : "mp4";
}

function sanitizeInputName(file: File): string {
  return `input.${fileExtension(file)}`;
}

function normalizeFileData(data: FileData): Uint8Array {
  if (typeof data === "string") {
    return new TextEncoder().encode(data);
  }
  return data;
}

function scaleFilter(maxFrameWidth: number): string {
  const size = Math.max(160, Math.min(720, maxFrameWidth));
  return `scale=w=${size}:h=${size}:force_original_aspect_ratio=decrease:flags=lanczos`;
}

async function loadInstance(
  onProgress?: (progress: ProcessingProgress) => void,
  signal?: AbortSignal
): Promise<FFmpegInstance> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      try {
        onProgress?.({ phase: "engine", value: 0.04, message: "Loading engine" });
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const ffmpeg = new FFmpeg();
        const baseUrl = `${import.meta.env.BASE_URL}vendor/ffmpeg-core`;

        ffmpeg.on("log", ({ message }) => logger.debug("ffmpeg", message));
        ffmpeg.on("progress", ({ progress }) => {
          onProgress?.({
            phase: "sampling",
            value: 0.18 + Math.max(0, Math.min(1, progress)) * 0.52,
            message: "Sampling key frames"
          });
        });

        await ffmpeg.load(
          {
            coreURL: `${baseUrl}/ffmpeg-core.js`,
            wasmURL: `${baseUrl}/ffmpeg-core.wasm`
          },
          ffmpegOptions(signal)
        );

        onProgress?.({ phase: "engine", value: 0.16, message: "Engine ready" });
        return ffmpeg;
      } catch (error) {
        ffmpegPromise = null;
        throw new AppError("ffmpeg-load-failed", "FFmpeg-WASM could not start.", {
          detail: error instanceof Error ? error.message : String(error),
          hint: "Refresh the page, then try a smaller or more common video format.",
          cause: error
        });
      }
    })();
  }

  return ffmpegPromise;
}

export async function warmupFFmpeg(
  onProgress?: (progress: ProcessingProgress) => void,
  signal?: AbortSignal
): Promise<void> {
  await loadInstance(onProgress, signal);
}

async function clearFrames(ffmpeg: FFmpegInstance, directory: string): Promise<void> {
  try {
    const entries = (await ffmpeg.listDir(directory)) as Array<{ name: string; isDir: boolean }>;
    await Promise.all(
      entries
        .filter((entry) => !entry.isDir && entry.name.endsWith(".png"))
        .map((entry) => ffmpeg.deleteFile(`${directory}/${entry.name}`))
    );
    await ffmpeg.deleteDir(directory);
  } catch (error) {
    logger.warn("Failed to clean FFmpeg frame directory", error);
  }
}

async function readPngFrames(
  ffmpeg: FFmpegInstance,
  directory: string,
  videoDuration: number,
  measuredTimestamps: number[] = []
): Promise<ExtractedPngFrame[]> {
  const entries = ((await ffmpeg.listDir(directory)) as Array<{ name: string; isDir: boolean }>)
    .filter((entry) => !entry.isDir && entry.name.endsWith(".png"))
    .sort((a, b) => a.name.localeCompare(b.name));

  const frames: ExtractedPngFrame[] = [];

  for (const [index, entry] of entries.entries()) {
    const data = normalizeFileData(
      (await ffmpeg.readFile(`${directory}/${entry.name}`)) as FileData
    );
    const measuredTime = measuredTimestamps[index];
    const hasMeasuredTime = typeof measuredTime === "number" && Number.isFinite(measuredTime);
    const estimatedTime =
      Number.isFinite(videoDuration) && videoDuration > 0 && entries.length > 1
        ? (index / Math.max(1, entries.length - 1)) * videoDuration
        : index;
    frames.push({
      index,
      time: hasMeasuredTime ? measuredTime : estimatedTime,
      timestampSource: hasMeasuredTime ? "ffprobe-keyframe" : "fps-estimate",
      bytes: data
    });
  }

  return frames;
}

async function probeKeyframeTimestamps(
  ffmpeg: FFmpegInstance,
  inputName: string,
  signal?: AbortSignal
): Promise<number[]> {
  const outputName = `/probe_${crypto.randomUUID().replaceAll("-", "")}.json`;

  try {
    const exit = await ffmpeg.ffprobe(
      [
        "-v",
        "error",
        "-skip_frame",
        "nokey",
        "-select_streams",
        "v:0",
        "-show_entries",
        "frame=best_effort_timestamp_time,pkt_pts_time,pict_type",
        "-of",
        "json",
        inputName,
        "-o",
        outputName
      ],
      -1,
      ffmpegOptions(signal)
    );

    if (exit !== 0) {
      return [];
    }

    const raw = (await ffmpeg.readFile(outputName, "utf8", ffmpegOptions(signal))) as FileData;
    const text = typeof raw === "string" ? raw : new TextDecoder().decode(raw);
    const parsed = JSON.parse(text) as ProbeOutput;

    return (parsed.frames ?? [])
      .map((frame) => Number(frame.best_effort_timestamp_time ?? frame.pkt_pts_time))
      .filter((time) => Number.isFinite(time) && time >= 0)
      .sort((a, b) => a - b);
  } catch (error) {
    logger.warn("FFprobe key-frame timestamp lookup failed", error);
    return [];
  } finally {
    try {
      await ffmpeg.deleteFile(outputName);
    } catch {
      // The probe file may not exist when ffprobe fails before writing output.
    }
  }
}

async function runExtraction(
  ffmpeg: FFmpegInstance,
  args: string[],
  signal?: AbortSignal
): Promise<number> {
  assertNotAborted(signal);
  return ffmpeg.exec(args, -1, ffmpegOptions(signal));
}

export async function extractPngFrames(
  file: File,
  settings: GeneratorSettings,
  videoDuration: number,
  onProgress?: (progress: ProcessingProgress) => void,
  signal?: AbortSignal
): Promise<ExtractedPngFrame[]> {
  const ffmpeg = await loadInstance(onProgress, signal);
  const inputName = sanitizeInputName(file);
  const frameDir = `/frames_${crypto.randomUUID().replaceAll("-", "")}`;
  const scale = scaleFilter(settings.maxFrameWidth);

  try {
    onProgress?.({ phase: "sampling", value: 0.17, message: "Preparing video" });
    await ffmpeg.writeFile(
      inputName,
      new Uint8Array(await file.arrayBuffer()),
      ffmpegOptions(signal)
    );
    await ffmpeg.createDir(frameDir);
    const keyframeTimestamps = await probeKeyframeTimestamps(ffmpeg, inputName, signal);

    const keyFrameArgs = [
      "-skip_frame",
      "nokey",
      "-i",
      inputName,
      "-vf",
      scale,
      "-vsync",
      "0",
      "-frames:v",
      String(settings.sampleCount),
      `${frameDir}/frame_%04d.png`
    ];

    const keyFrameExit = await runExtraction(ffmpeg, keyFrameArgs, signal);
    let frames = await readPngFrames(ffmpeg, frameDir, videoDuration, keyframeTimestamps);

    if (keyFrameExit !== 0 || frames.length < Math.max(3, Math.floor(settings.sampleCount / 4))) {
      await clearFrames(ffmpeg, frameDir);
      await ffmpeg.createDir(frameDir);

      const fps =
        Number.isFinite(videoDuration) && videoDuration > 0
          ? Math.max(0.02, settings.sampleCount / videoDuration)
          : 0.35;
      const intervalArgs = [
        "-i",
        inputName,
        "-vf",
        `fps=${fps.toFixed(5)},${scale}`,
        "-frames:v",
        String(settings.sampleCount),
        `${frameDir}/frame_%04d.png`
      ];

      const intervalExit = await runExtraction(ffmpeg, intervalArgs, signal);
      frames = await readPngFrames(ffmpeg, frameDir, videoDuration);

      if (intervalExit !== 0 || frames.length === 0) {
        throw new AppError("frame-extract-failed", "No frames could be sampled from this video.", {
          hint: "Try an MP4, MOV, or WebM file with a standard video track."
        });
      }
    }

    return frames.slice(0, settings.sampleCount);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new AppError("frame-extract-failed", "The video could not be sampled.", {
      detail: error instanceof Error ? error.message : String(error),
      hint: "Try a shorter clip, lower the sample count, or use a more common container.",
      cause: error
    });
  } finally {
    try {
      await ffmpeg.deleteFile(inputName);
    } catch (error) {
      logger.warn("Failed to clean FFmpeg input file", error);
    }
    await clearFrames(ffmpeg, frameDir);
  }
}
