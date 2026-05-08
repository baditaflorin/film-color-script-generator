export type ErrorCode =
  | "unsupported-file"
  | "metadata-failed"
  | "ffmpeg-load-failed"
  | "frame-extract-failed"
  | "palette-failed"
  | "export-failed"
  | "cancelled"
  | "unknown";

export interface AppErrorOptions {
  detail?: string;
  hint?: string;
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly userMessage: string;
  readonly detail?: string;
  readonly hint?: string;

  constructor(code: ErrorCode, userMessage: string, options: AppErrorOptions = {}) {
    super(userMessage);
    this.name = "AppError";
    this.code = code;
    this.userMessage = userMessage;
    if (options.detail !== undefined) {
      this.detail = options.detail;
    }
    if (options.hint !== undefined) {
      this.hint = options.hint;
    }
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export function normalizeError(error: unknown, fallback = "Something went wrong."): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return new AppError("cancelled", "Processing was cancelled.", { cause: error });
  }

  if (error instanceof Error) {
    return new AppError("unknown", fallback, { detail: error.message, cause: error });
  }

  return new AppError("unknown", fallback, { detail: String(error) });
}
