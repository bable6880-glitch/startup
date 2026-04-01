import { logger } from "@/lib/utils/logger";

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        process.on('unhandledRejection', (reason) => {
            logger.error('Unhandled Promise Rejection', {
                error: reason,
                context: 'Global error boundary'
            });
        });

        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception', {
                error,
                context: 'Global error boundary'
            });
            // Give time for logs to flush before potential crash
        });
    }
}
