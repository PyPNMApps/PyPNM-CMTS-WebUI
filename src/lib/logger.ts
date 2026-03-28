import type { PypnmLogLevel } from "@/types/config";

type LogLevel = Exclude<PypnmLogLevel, "OFF">;

interface LogPayload {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

const levelWeight: Record<PypnmLogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  OFF: 100,
};

let currentLevel: PypnmLogLevel = "INFO";

function shouldLog(level: LogLevel): boolean {
  return levelWeight[level] >= levelWeight[currentLevel];
}

function serialize(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

async function shipToDevLog(payload: LogPayload): Promise<void> {
  if (!import.meta.env.DEV) {
    return;
  }

  try {
    await fetch("/__client-log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Keep browser logging non-blocking if the sink is unavailable.
  }
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (!shouldLog(level)) {
    return;
  }

  const payload: LogPayload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };

  switch (level) {
    case "DEBUG":
      console.debug(message, context ?? "");
      break;
    case "INFO":
      console.info(message, context ?? "");
      break;
    case "WARN":
      console.warn(message, context ?? "");
      break;
    case "ERROR":
      console.error(message, context ?? "");
      break;
  }

  void shipToDevLog(payload);
}

export function setRuntimeLogLevel(level: PypnmLogLevel | string | undefined): void {
  const normalized = typeof level === "string" ? level.trim().toUpperCase() : "";
  currentLevel = normalized in levelWeight ? (normalized as PypnmLogLevel) : "INFO";
}

export function logDebug(message: string, context?: Record<string, unknown>): void {
  emit("DEBUG", message, context);
}

export function logInfo(message: string, context?: Record<string, unknown>): void {
  emit("INFO", message, context);
}

export function logWarn(message: string, context?: Record<string, unknown>): void {
  emit("WARN", message, context);
}

export function logError(message: string, context?: Record<string, unknown>): void {
  emit("ERROR", message, context);
}

export function installGlobalLoggingHandlers(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.addEventListener("error", (event) => {
    logError("Unhandled window error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: serialize(event.error),
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logError("Unhandled promise rejection", {
      reason: serialize(event.reason),
    });
  });
}
