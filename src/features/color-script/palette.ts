import type { DecodedFrameInput, FrameAnalysis, PaletteColor, RGB } from "./types";

const MAX_DISTANCE = Math.sqrt(255 * 255 * 3);

interface Bucket {
  r: number;
  g: number;
  b: number;
  count: number;
}

export function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function rgbToHex(rgb: RGB): string {
  return `#${[rgb.r, rgb.g, rgb.b].map((channel) => clampByte(channel).toString(16).padStart(2, "0")).join("")}`;
}

export function colorDistance(a: RGB, b: RGB): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db) / MAX_DISTANCE;
}

function saturation(rgb: RGB): number {
  const max = Math.max(rgb.r, rgb.g, rgb.b) / 255;
  const min = Math.min(rgb.r, rgb.g, rgb.b) / 255;
  if (max === 0) {
    return 0;
  }
  return (max - min) / max;
}

function toPaletteColor(bucket: Bucket, total: number): PaletteColor {
  const rgb = {
    r: bucket.r / bucket.count,
    g: bucket.g / bucket.count,
    b: bucket.b / bucket.count
  };

  return {
    hex: rgbToHex(rgb),
    rgb: {
      r: clampByte(rgb.r),
      g: clampByte(rgb.g),
      b: clampByte(rgb.b)
    },
    weight: total === 0 ? 0 : bucket.count / total
  };
}

function bucketKey(r: number, g: number, b: number): string {
  return `${r >> 4}:${g >> 4}:${b >> 4}`;
}

export function analyzePixelData(input: DecodedFrameInput): FrameAnalysis {
  const buckets = new Map<string, Bucket>();
  const totalPixels = input.width * input.height;
  const stride = Math.max(1, Math.floor(totalPixels / 9000));
  let sampled = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;

  for (let pixel = 0; pixel < totalPixels; pixel += stride) {
    const offset = pixel * 4;
    const alpha = input.data[offset + 3] ?? 255;

    if (alpha < 24) {
      continue;
    }

    const r = input.data[offset] ?? 0;
    const g = input.data[offset + 1] ?? 0;
    const b = input.data[offset + 2] ?? 0;
    const key = bucketKey(r, g, b);
    const bucket = buckets.get(key);

    if (bucket) {
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.count += 1;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }

    sampled += 1;
    sumR += r;
    sumG += g;
    sumB += b;
  }

  const candidates = [...buckets.values()]
    .map((bucket) => toPaletteColor(bucket, sampled))
    .sort((a, b) => {
      const scoreA = a.weight * (0.78 + saturation(a.rgb) * 0.32);
      const scoreB = b.weight * (0.78 + saturation(b.rgb) * 0.32);
      return scoreB - scoreA;
    });

  const palette: PaletteColor[] = [];

  for (const candidate of candidates) {
    const distinct = palette.every(
      (selected) => colorDistance(selected.rgb, candidate.rgb) > 0.085
    );

    if (distinct) {
      palette.push(candidate);
    }

    if (palette.length >= input.paletteSize) {
      break;
    }
  }

  for (const candidate of candidates) {
    if (palette.length >= input.paletteSize) {
      break;
    }
    if (!palette.includes(candidate)) {
      palette.push(candidate);
    }
  }

  const averageRgb = {
    r: sampled === 0 ? 0 : sumR / sampled,
    g: sampled === 0 ? 0 : sumG / sampled,
    b: sampled === 0 ? 0 : sumB / sampled
  };

  return {
    index: input.index,
    time: input.time,
    width: input.width,
    height: input.height,
    palette: normalizeWeights(palette),
    average: {
      hex: rgbToHex(averageRgb),
      rgb: {
        r: clampByte(averageRgb.r),
        g: clampByte(averageRgb.g),
        b: clampByte(averageRgb.b)
      },
      weight: 1
    }
  };
}

export function normalizeWeights(colors: PaletteColor[]): PaletteColor[] {
  const total = colors.reduce((sum, color) => sum + color.weight, 0);

  if (total <= 0) {
    return colors;
  }

  return colors.map((color) => ({
    ...color,
    weight: color.weight / total
  }));
}

export function mergePalettes(frames: FrameAnalysis[], paletteSize: number): PaletteColor[] {
  const buckets = new Map<string, Bucket>();

  for (const frame of frames) {
    for (const color of frame.palette) {
      const key = bucketKey(color.rgb.r, color.rgb.g, color.rgb.b);
      const count = Math.max(1, Math.round(color.weight * 1000));
      const bucket = buckets.get(key);

      if (bucket) {
        bucket.r += color.rgb.r * count;
        bucket.g += color.rgb.g * count;
        bucket.b += color.rgb.b * count;
        bucket.count += count;
      } else {
        buckets.set(key, {
          r: color.rgb.r * count,
          g: color.rgb.g * count,
          b: color.rgb.b * count,
          count
        });
      }
    }
  }

  const total = [...buckets.values()].reduce((sum, bucket) => sum + bucket.count, 0);

  return normalizeWeights(
    [...buckets.values()]
      .map((bucket) => toPaletteColor(bucket, total))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, paletteSize)
  );
}

export function averageFrameColor(frames: FrameAnalysis[]): PaletteColor {
  if (frames.length === 0) {
    return { hex: "#000000", rgb: { r: 0, g: 0, b: 0 }, weight: 1 };
  }

  const rgb = frames.reduce(
    (sum, frame) => ({
      r: sum.r + frame.average.rgb.r,
      g: sum.g + frame.average.rgb.g,
      b: sum.b + frame.average.rgb.b
    }),
    { r: 0, g: 0, b: 0 }
  );

  const average = {
    r: rgb.r / frames.length,
    g: rgb.g / frames.length,
    b: rgb.b / frames.length
  };

  return {
    hex: rgbToHex(average),
    rgb: {
      r: clampByte(average.r),
      g: clampByte(average.g),
      b: clampByte(average.b)
    },
    weight: 1
  };
}

export function paletteDistance(a: FrameAnalysis, b: FrameAnalysis): number {
  const average = colorDistance(a.average.rgb, b.average.rgb);
  const palette = a.palette.reduce((sum, color) => {
    const nearest = Math.min(
      ...b.palette.map((candidate) => colorDistance(color.rgb, candidate.rgb))
    );
    return sum + nearest * color.weight;
  }, 0);

  return average * 0.62 + palette * 0.38;
}
