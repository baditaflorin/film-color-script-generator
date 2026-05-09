import type { ConfidenceLabel, InferenceConfidence } from "./types";

export function confidenceLabel(score: number): ConfidenceLabel {
  if (score >= 0.75) {
    return "high";
  }
  if (score >= 0.5) {
    return "medium";
  }
  return "low";
}

export function makeConfidence(score: number, reasons: string[]): InferenceConfidence {
  const normalized = Math.max(0, Math.min(1, Number(score.toFixed(4))));
  return {
    score: normalized,
    label: confidenceLabel(normalized),
    reasons
  };
}

export function combineConfidence(
  items: InferenceConfidence[],
  extraReasons: string[] = []
): InferenceConfidence {
  if (items.length === 0) {
    return makeConfidence(0.5, ["No evidence was available.", ...extraReasons]);
  }

  const score = items.reduce((sum, item) => sum + item.score, 0) / items.length;
  const reasons = [...new Set([...items.flatMap((item) => item.reasons), ...extraReasons])];
  return makeConfidence(score, reasons);
}
