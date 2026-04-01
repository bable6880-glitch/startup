/**
 * Structured JSON logger for production tracing.
 * Outputs structured logs that can be parsed by log aggregation services.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

type LogContext = Record<string, unknown> & {
    error?: Error | unknown;
    requestId?: string;
    userId?: string | null;
    route?: string;
    latencyMs?: number;
    statusCode?: number;
};

function formatLog(
    level: LogLevel,
    message: string,
    context?: LogContext
): string {
    const logObj: any = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...context,
    };

    if (context?.error instanceof Error) {
        logObj.error = {
            message: context.error.message,
            stack: context.error.stack,
            name: context.error.name,
        };
    }

    if (process.env.NODE_ENV === "production") {
        return JSON.stringify(logObj);
    }

    // Development formatting
    const { timestamp, level: l, message: m, error, ...rest } = logObj;
    let devFormat = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    if (Object.keys(rest).length > 0) {
        devFormat += ` ${JSON.stringify(rest)}`;
    }
    if (error) {
        devFormat += `\n${error.stack || error.message || JSON.stringify(error)}`;
    }
    return devFormat;
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
