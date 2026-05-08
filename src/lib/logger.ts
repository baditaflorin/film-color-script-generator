const isDev = import.meta.env.DEV;

export const logger = {
  debug(message: string, context?: unknown): void {
    if (isDev) {
      console.debug(message, context ?? "");
    }
  },
  warn(message: string, context?: unknown): void {
    if (isDev) {
      console.warn(message, context ?? "");
    }
  }
};
