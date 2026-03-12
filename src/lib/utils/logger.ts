/**
 * Structured JSON logger for production tracing.
 * Outputs structured logs that can be parsed by log aggregation services.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

type LogContext = Record<string, unknown>;

function formatLog(
    level: LogLevel,
    message: string,
    context?: LogContext
): string {
    return JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...context,
    });
}

export const logger = {
    info(message: string, context?: LogContext) {
        console.log(formatLog("info", message, context));
    },

    warn(message: string, context?: LogContext) {
        console.warn(formatLog("warn", message, context));
    },

    error(message: string, context?: LogContext) {
        console.error(formatLog("error", message, context));
    },

    debug(message: string, context?: LogContext) {
        if (process.env.NODE_ENV === "development") {
            console.debug(formatLog("debug", message, context));
        }
    },
};

export function createLogger(baseContext: LogContext) {
    return {
        info: (message: string, context?: LogContext) => logger.info(message, { ...baseContext, ...context }),
        warn: (message: string, context?: LogContext) => logger.warn(message, { ...baseContext, ...context }),
        error: (message: string, context?: LogContext) => logger.error(message, { ...baseContext, ...context }),
        debug: (message: string, context?: LogContext) => logger.debug(message, { ...baseContext, ...context }),
    };
}
