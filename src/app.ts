import {
  BadgeDollarSign,
  Clapperboard,
  Download,
  FileJson,
  Film,
  GitFork,
  ImageDown,
  LoaderCircle,
  Palette,
  Play,
  RefreshCw,
  Star,
  WandSparkles,
  X,
  createElement as createIconElement,
  type IconNode
} from "lucide";
import { buildInfo } from "./generated/buildInfo";
import { fetchLatestMainCommit } from "./features/github/latestCommit";
import { AppError, normalizeError } from "./lib/errors";
import { logger } from "./lib/logger";
import {
  canvasToPngBlob,
  createExportPayload,
  createSvgStrip,
  downloadBlob,
  renderStripCanvas,
  safeBaseName
} from "./features/color-script/export";
import { extractPngFrames, warmupFFmpeg } from "./features/color-script/ffmpeg";
import { decodePngFrame } from "./features/color-script/frameDecode";
import { groupFramesIntoScenes, sceneCountLabel } from "./features/color-script/scenes";
import {
  createPaletteWorkerClient,
  type PaletteWorkerClient
} from "./features/color-script/workerClient";
import { defaultSettings, loadSettings, saveSettings } from "./features/storage/preferences";
import type {
  FrameAnalysis,
  GeneratorSettings,
  ProcessingProgress,
  SceneAnalysis,
  VideoMetadata
} from "./features/color-script/types";

interface AppRefs {
  fileInput: HTMLInputElement;
  dropZone: HTMLElement;
  videoPreview: HTMLVideoElement;
  fileName: HTMLElement;
  fileMeta: HTMLElement;
  sampleCount: HTMLInputElement;
  sampleValue: HTMLElement;
  paletteSize: HTMLInputElement;
  paletteValue: HTMLElement;
  sceneSensitivity: HTMLInputElement;
  sensitivityValue: HTMLElement;
  maxFrameWidth: HTMLInputElement;
  maxFrameValue: HTMLElement;
  stripMode: HTMLSelectElement;
  loadEngine: HTMLButtonElement;
  generate: HTMLButtonElement;
  cancel: HTMLButtonElement;
  demo: HTMLButtonElement;
  status: HTMLElement;
  progress: HTMLElement;
  stripPreview: HTMLElement;
  sceneList: HTMLElement;
  exportPng: HTMLButtonElement;
  exportJson: HTMLButtonElement;
  exportSvg: HTMLButtonElement;
  version: HTMLElement;
  commit: HTMLAnchorElement;
}

function icon(node: IconNode, label: string): string {
  const svg = createIconElement(node, {
    width: "18",
    height: "18",
    "aria-hidden": "true",
    focusable: "false"
  });
  svg.setAttribute("data-icon-label", label);
  return svg.outerHTML;
}

function template(): string {
  return `
    <header class="topbar">
      <a class="brand" href="${buildInfo.pagesUrl}" aria-label="Film Color Script Generator">
        <span class="brand-mark">${icon(Film, "Film")}</span>
        <span>Film Color Script</span>
      </a>
      <nav class="top-actions" aria-label="Project links">
        <a class="top-link" href="${buildInfo.repoUrl}" target="_blank" rel="noreferrer" title="Star on GitHub">
          ${icon(Star, "Star")}
          <span>Star</span>
        </a>
        <a class="top-link" href="${buildInfo.repoUrl}" target="_blank" rel="noreferrer" title="Repository">
          ${icon(GitFork, "Repository")}
          <span>Repo</span>
        </a>
        <a class="top-link" href="${buildInfo.paypalUrl}" target="_blank" rel="noreferrer" title="PayPal">
          ${icon(BadgeDollarSign, "PayPal")}
          <span>PayPal</span>
        </a>
      </nav>
      <div class="build-pill" aria-label="Build information">
        <span data-ref="version">v${buildInfo.version}</span>
        <a data-ref="commit" href="${buildInfo.commitUrl}" target="_blank" rel="noreferrer">${buildInfo.commit}</a>
      </div>
    </header>

    <main class="workspace">
      <section class="input-panel" aria-labelledby="input-title">
        <div class="panel-title">
          <h1 id="input-title">Video</h1>
          <button class="icon-button" data-action="demo" type="button" title="Demo">
            ${icon(WandSparkles, "Demo")}
          </button>
        </div>
        <label class="drop-zone" data-ref="dropZone">
          <input data-ref="fileInput" type="file" accept="video/*,.mov,.mp4,.m4v,.webm,.mkv" />
          <span class="drop-icon">${icon(Clapperboard, "Video")}</span>
          <span class="drop-primary">Drop video</span>
          <span class="drop-secondary">MP4, MOV, WebM, MKV</span>
        </label>
        <video data-ref="videoPreview" class="video-preview" controls muted playsinline hidden></video>
        <dl class="file-stats">
          <div>
            <dt>Name</dt>
            <dd data-ref="fileName">None</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd data-ref="fileMeta">No file selected</dd>
          </div>
        </dl>
      </section>

      <aside class="control-panel" aria-labelledby="controls-title">
        <div class="panel-title">
          <h2 id="controls-title">Controls</h2>
          <button class="icon-button" data-action="reset" type="button" title="Reset">
            ${icon(RefreshCw, "Reset")}
          </button>
        </div>

        <label class="control-row">
          <span>Samples <b data-ref="sampleValue"></b></span>
          <input data-ref="sampleCount" type="range" min="8" max="96" step="4" />
        </label>

        <label class="control-row">
          <span>Palette <b data-ref="paletteValue"></b></span>
          <input data-ref="paletteSize" type="range" min="3" max="8" step="1" />
        </label>

        <label class="control-row">
          <span>Cuts <b data-ref="sensitivityValue"></b></span>
          <input data-ref="sceneSensitivity" type="range" min="0" max="100" step="1" />
        </label>

        <label class="control-row">
          <span>Frame width <b data-ref="maxFrameValue"></b></span>
          <input data-ref="maxFrameWidth" type="range" min="160" max="720" step="40" />
        </label>

        <label class="control-row">
          <span>Strip mode</span>
          <select data-ref="stripMode">
            <option value="duration">Duration</option>
            <option value="equal">Equal</option>
          </select>
        </label>

        <div class="action-grid">
          <button class="primary-button" data-action="loadEngine" type="button">
            ${icon(LoaderCircle, "Engine")}
            <span>Engine</span>
          </button>
          <button class="primary-button" data-action="generate" type="button" disabled>
            ${icon(Play, "Generate")}
            <span>Generate</span>
          </button>
          <button class="secondary-button" data-action="cancel" type="button" disabled>
            ${icon(X, "Cancel")}
            <span>Cancel</span>
          </button>
        </div>

        <div class="status-box" role="status" aria-live="polite">
          <span data-ref="status">Idle</span>
          <span class="progress-track"><span data-ref="progress"></span></span>
        </div>
      </aside>

      <section class="output-panel" aria-labelledby="output-title">
        <div class="panel-title">
          <h2 id="output-title">Strip</h2>
          <div class="export-actions">
            <button class="icon-button" data-action="exportPng" type="button" title="PNG" disabled>
              ${icon(ImageDown, "PNG")}
            </button>
            <button class="icon-button" data-action="exportJson" type="button" title="JSON" disabled>
              ${icon(FileJson, "JSON")}
            </button>
            <button class="icon-button" data-action="exportSvg" type="button" title="SVG" disabled>
              ${icon(Download, "SVG")}
            </button>
          </div>
        </div>
        <div class="strip-preview" data-ref="stripPreview">
          <span>${icon(Palette, "Palette")}</span>
        </div>
        <div class="scene-list" data-ref="sceneList" aria-label="Scenes"></div>
      </section>
    </main>
  `;
}

function ref<T extends HTMLElement>(root: HTMLElement, name: string): T {
  const element = root.querySelector<T>(`[data-ref="${name}"]`);

  if (!element) {
    throw new Error(`Missing ref: ${name}`);
  }

  return element;
}

function action<T extends HTMLElement>(root: HTMLElement, name: string): T {
  const element = root.querySelector<T>(`[data-action="${name}"]`);

  if (!element) {
    throw new Error(`Missing action: ${name}`);
  }

  return element;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function setDisabled(buttons: HTMLButtonElement[], disabled: boolean): void {
  for (const button of buttons) {
    button.disabled = disabled;
  }
}

async function readVideoMetadata(
  file: File,
  preview: HTMLVideoElement,
  objectUrl: string
): Promise<VideoMetadata> {
  if (!file.type.startsWith("video/") && !/\.(mov|mp4|m4v|webm|mkv)$/i.test(file.name)) {
    throw new AppError("unsupported-file", "Choose a video file.");
  }

  preview.src = objectUrl;
  preview.hidden = false;

  await new Promise<void>((resolve, reject) => {
    preview.onloadedmetadata = () => resolve();
    preview.onerror = () =>
      reject(
        new AppError("metadata-failed", "The browser could not read video metadata.", {
          hint: "Try another export or a shorter clip."
        })
      );
  });

  return {
    name: file.name,
    size: file.size,
    type: file.type || "video",
    duration: Number.isFinite(preview.duration) ? preview.duration : 0,
    width: preview.videoWidth || 0,
    height: preview.videoHeight || 0
  };
}

function makeDemoFrames(settings: GeneratorSettings): FrameAnalysis[] {
  const colors = [
    ["#1b1f33", "#37445f", "#b75d4a", "#f0b36d", "#f8dfb2"],
    ["#20382f", "#5e7f62", "#c8b46a", "#e9d8a6", "#6a4738"],
    ["#14252f", "#2b6c74", "#82b2a8", "#d7e6eb", "#f6efe3"],
    ["#38263b", "#68506f", "#b16b7c", "#e7a66f", "#f8d9a8"],
    ["#111714", "#285f4e", "#3d8b63", "#d9825b", "#f8f5ed"]
  ];

  return colors.map((palette, index) => {
    const weighted = palette.slice(0, settings.paletteSize).map((hex, colorIndex) => ({
      hex,
      rgb: {
        r: Number.parseInt(hex.slice(1, 3), 16),
        g: Number.parseInt(hex.slice(3, 5), 16),
        b: Number.parseInt(hex.slice(5, 7), 16)
      },
      weight:
        colorIndex === 0
          ? 0.32
          : 0.68 / Math.max(1, Math.min(settings.paletteSize, palette.length) - 1)
    }));

    const average = weighted[0] ?? {
      hex: "#000000",
      rgb: { r: 0, g: 0, b: 0 },
      weight: 1
    };

    return {
      index,
      time: index * 14,
      width: 320,
      height: 180,
      palette: weighted,
      average
    };
  });
}

export function mountApp(root: HTMLElement): void {
  root.innerHTML = template();
  root.dataset.engineState = "idle";
  root.dataset.stripState = "empty";

  const refs: AppRefs = {
    fileInput: ref(root, "fileInput"),
    dropZone: ref(root, "dropZone"),
    videoPreview: ref(root, "videoPreview"),
    fileName: ref(root, "fileName"),
    fileMeta: ref(root, "fileMeta"),
    sampleCount: ref(root, "sampleCount"),
    sampleValue: ref(root, "sampleValue"),
    paletteSize: ref(root, "paletteSize"),
    paletteValue: ref(root, "paletteValue"),
    sceneSensitivity: ref(root, "sceneSensitivity"),
    sensitivityValue: ref(root, "sensitivityValue"),
    maxFrameWidth: ref(root, "maxFrameWidth"),
    maxFrameValue: ref(root, "maxFrameValue"),
    stripMode: ref(root, "stripMode"),
    loadEngine: action(root, "loadEngine"),
    generate: action(root, "generate"),
    cancel: action(root, "cancel"),
    demo: action(root, "demo"),
    status: ref(root, "status"),
    progress: ref(root, "progress"),
    stripPreview: ref(root, "stripPreview"),
    sceneList: ref(root, "sceneList"),
    exportPng: action(root, "exportPng"),
    exportJson: action(root, "exportJson"),
    exportSvg: action(root, "exportSvg"),
    version: ref(root, "version"),
    commit: ref(root, "commit")
  };

  let settings = loadSettings();
  let selectedFile: File | null = null;
  let video: VideoMetadata | null = null;
  let previewUrl: string | null = null;
  let frames: FrameAnalysis[] = [];
  let scenes: SceneAnalysis[] = [];
  let worker: PaletteWorkerClient | null = null;
  let abortController: AbortController | null = null;

  const setStatus = (progress: ProcessingProgress): void => {
    refs.status.textContent = progress.message;
    refs.progress.style.width = `${Math.round(Math.max(0, Math.min(1, progress.value)) * 100)}%`;
  };

  const setError = (error: unknown): void => {
    const appError = normalizeError(error, "Processing failed.");
    refs.status.textContent = appError.hint
      ? `${appError.userMessage} ${appError.hint}`
      : appError.userMessage;
    refs.progress.style.width = "0%";
    logger.warn("App error", appError);
  };

  const setBusy = (busy: boolean): void => {
    setDisabled([refs.fileInput as unknown as HTMLButtonElement], busy);
    refs.generate.disabled = busy || !selectedFile;
    refs.loadEngine.disabled = busy;
    refs.demo.disabled = busy;
    refs.cancel.disabled = !busy;
  };

  const renderSettings = (): void => {
    refs.sampleCount.value = String(settings.sampleCount);
    refs.sampleValue.textContent = String(settings.sampleCount);
    refs.paletteSize.value = String(settings.paletteSize);
    refs.paletteValue.textContent = String(settings.paletteSize);
    refs.sceneSensitivity.value = String(settings.sceneSensitivity);
    refs.sensitivityValue.textContent = String(settings.sceneSensitivity);
    refs.maxFrameWidth.value = String(settings.maxFrameWidth);
    refs.maxFrameValue.textContent = `${settings.maxFrameWidth}px`;
    refs.stripMode.value = settings.stripMode;
  };

  const renderExports = (): void => {
    const ready = scenes.length > 0;
    refs.exportPng.disabled = !ready;
    refs.exportJson.disabled = !ready;
    refs.exportSvg.disabled = !ready;
    root.dataset.stripState = ready ? "ready" : "empty";
  };

  const renderScenes = (): void => {
    refs.sceneList.replaceChildren();

    for (const scene of scenes) {
      const item = document.createElement("article");
      item.className = "scene-item";
      item.innerHTML = `
        <span class="scene-index">${String(scene.index + 1).padStart(2, "0")}</span>
        <span class="scene-time">${formatDuration(scene.start)}-${formatDuration(scene.end)}</span>
        <span class="scene-swatches"></span>
      `;
      const swatches = item.querySelector<HTMLElement>(".scene-swatches");

      for (const color of scene.palette) {
        const swatch = document.createElement("span");
        swatch.style.backgroundColor = color.hex;
        swatch.title = color.hex;
        swatches?.append(swatch);
      }

      refs.sceneList.append(item);
    }
  };

  const renderStrip = (): void => {
    refs.stripPreview.replaceChildren();

    if (scenes.length === 0) {
      const empty = document.createElement("span");
      empty.innerHTML = icon(Palette, "Palette");
      refs.stripPreview.append(empty);
      renderExports();
      return;
    }

    const width = Math.max(920, scenes.length * 120);
    const canvas = renderStripCanvas(scenes, settings, {
      width,
      height: 260,
      background: "#f8f5ed"
    });
    canvas.className = "strip-canvas";
    refs.stripPreview.append(canvas);
    renderExports();
  };

  const regroup = (): void => {
    if (!video || frames.length === 0) {
      return;
    }

    scenes = groupFramesIntoScenes(frames, settings, video.duration);
    renderStrip();
    renderScenes();
    refs.status.textContent = sceneCountLabel(scenes.length);
  };

  const updateSettings = (): void => {
    settings = {
      sampleCount: Number(refs.sampleCount.value),
      paletteSize: Number(refs.paletteSize.value),
      sceneSensitivity: Number(refs.sceneSensitivity.value),
      maxFrameWidth: Number(refs.maxFrameWidth.value),
      stripMode: refs.stripMode.value === "equal" ? "equal" : "duration"
    };
    saveSettings(settings);
    renderSettings();

    if (frames.length > 0) {
      regroup();
    }
  };

  const loadEngine = async (): Promise<void> => {
    const controller = new AbortController();
    root.dataset.engineState = "loading";
    refs.loadEngine.disabled = true;

    try {
      await warmupFFmpeg(setStatus, controller.signal);
      root.dataset.engineState = "ready";
      refs.status.textContent = "Engine ready";
      refs.progress.style.width = "100%";
    } catch (error) {
      root.dataset.engineState = "error";
      setError(error);
    } finally {
      refs.loadEngine.disabled = false;
    }
  };

  const selectFile = async (file: File): Promise<void> => {
    try {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      previewUrl = URL.createObjectURL(file);
      selectedFile = file;
      video = await readVideoMetadata(file, refs.videoPreview, previewUrl);
      frames = [];
      scenes = [];

      refs.fileName.textContent = video.name;
      refs.fileMeta.textContent = `${formatDuration(video.duration)} · ${video.width}x${video.height} · ${formatBytes(video.size)}`;
      refs.generate.disabled = false;
      refs.status.textContent = "Ready";
      refs.progress.style.width = "0%";
      renderStrip();
      renderScenes();
    } catch (error) {
      selectedFile = null;
      video = null;
      refs.generate.disabled = true;
      setError(error);
    }
  };

  const analyzeFrames = async (): Promise<void> => {
    if (!selectedFile || !video) {
      throw new AppError("unsupported-file", "Choose a video file.");
    }

    abortController = new AbortController();
    worker?.dispose();
    worker = createPaletteWorkerClient();
    setBusy(true);
    frames = [];
    scenes = [];
    renderStrip();
    renderScenes();

    try {
      const pngFrames = await extractPngFrames(
        selectedFile,
        settings,
        video.duration,
        setStatus,
        abortController.signal
      );

      for (const [index, pngFrame] of pngFrames.entries()) {
        const decoded = await decodePngFrame(pngFrame, settings.paletteSize);
        const frame = await worker.analyzeFrame(decoded);
        frames.push(frame);
        setStatus({
          phase: "palette",
          value: 0.72 + ((index + 1) / pngFrames.length) * 0.22,
          message: "Reading palettes"
        });
      }

      setStatus({ phase: "render", value: 0.96, message: "Building strip" });
      scenes = groupFramesIntoScenes(frames, settings, video.duration);
      renderStrip();
      renderScenes();
      setStatus({ phase: "done", value: 1, message: sceneCountLabel(scenes.length) });
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
      abortController = null;
    }
  };

  const runDemo = (): void => {
    video = {
      name: "demo-color-script",
      size: 0,
      type: "demo",
      duration: 70,
      width: 320,
      height: 180
    };
    selectedFile = null;
    refs.fileName.textContent = "demo-color-script";
    refs.fileMeta.textContent = "1:10 · synthetic palette study";
    frames = makeDemoFrames(settings);
    scenes = groupFramesIntoScenes(frames, settings, video.duration);
    refs.generate.disabled = true;
    refs.videoPreview.hidden = true;
    renderStrip();
    renderScenes();
    setStatus({ phase: "done", value: 1, message: sceneCountLabel(scenes.length) });
  };

  const exportPng = async (): Promise<void> => {
    if (scenes.length === 0) {
      return;
    }

    try {
      const canvas = renderStripCanvas(scenes, settings, {
        width: Math.max(1600, scenes.length * 180),
        height: 360,
        background: "#f8f5ed"
      });
      const blob = await canvasToPngBlob(canvas);
      downloadBlob(blob, `${safeBaseName(video?.name ?? "color-script") || "color-script"}.png`);
    } catch (error) {
      setError(error);
    }
  };

  const exportJson = (): void => {
    if (!video || scenes.length === 0) {
      return;
    }

    try {
      const payload = createExportPayload(video, settings, scenes);
      downloadBlob(
        new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
        `${safeBaseName(video.name) || "color-script"}.color-script.json`
      );
    } catch (error) {
      setError(error);
    }
  };

  const exportSvg = (): void => {
    if (scenes.length === 0) {
      return;
    }

    const svg = createSvgStrip(scenes, settings);
    downloadBlob(
      new Blob([svg], { type: "image/svg+xml" }),
      `${safeBaseName(video?.name ?? "color-script") || "color-script"}.svg`
    );
  };

  refs.fileInput.addEventListener("change", () => {
    const file = refs.fileInput.files?.[0];
    if (file) {
      void selectFile(file);
    }
  });

  refs.dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    refs.dropZone.classList.add("is-dragging");
  });

  refs.dropZone.addEventListener("dragleave", () => refs.dropZone.classList.remove("is-dragging"));

  refs.dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    refs.dropZone.classList.remove("is-dragging");
    const file = event.dataTransfer?.files[0];
    if (file) {
      void selectFile(file);
    }
  });

  for (const input of [
    refs.sampleCount,
    refs.paletteSize,
    refs.sceneSensitivity,
    refs.maxFrameWidth
  ]) {
    input.addEventListener("input", updateSettings);
  }
  refs.stripMode.addEventListener("change", updateSettings);
  action<HTMLButtonElement>(root, "reset").addEventListener("click", () => {
    settings = defaultSettings;
    saveSettings(settings);
    renderSettings();
    regroup();
  });
  refs.loadEngine.addEventListener("click", () => void loadEngine());
  refs.generate.addEventListener("click", () => void analyzeFrames());
  refs.cancel.addEventListener("click", () => abortController?.abort());
  refs.demo.addEventListener("click", runDemo);
  refs.exportPng.addEventListener("click", () => void exportPng());
  refs.exportJson.addEventListener("click", exportJson);
  refs.exportSvg.addEventListener("click", exportSvg);

  renderSettings();
  renderExports();

  const latestAbort = new AbortController();
  window.setTimeout(() => latestAbort.abort(), 3500);
  void fetchLatestMainCommit(latestAbort.signal).then((latest) => {
    if (!latest) {
      return;
    }
    refs.commit.textContent = latest.shortSha;
    refs.commit.href = latest.url;
  });

  window.__filmColorScriptSmoke = {
    loadEngine,
    runDemo
  };
}
