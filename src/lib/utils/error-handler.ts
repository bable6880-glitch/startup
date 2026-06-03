/**
 * Centralized error message extraction.
 * Use this in every catch block that shows user-facing messages.
 */
export function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;

    if (err instanceof Response) {
        if (err.status === 429) return 'Too many requests. Please wait.';
        if (err.status === 401) return 'Session expired. Please log in.';
        if (err.status === 403) return 'You do not have permission.';
        if (err.status === 404) return 'Not found.';
        if (err.status >= 500) return 'Server error. Try again shortly.';
    }

    if (typeof err === 'string') return err;

    return 'Something went wrong. Please try again.';
}
