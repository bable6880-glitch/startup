// src/config/free-mode.ts
// Single source of truth for the time-boxed free promotion.
// To end the promotion early, change FREE_MODE_END_DATE and redeploy.
// No other manual steps required — everything downstream reads this.

export const FREE_MODE_END_DATE = new Date("2027-04-22T00:00:00Z");

export function isFreeModeActive(now: Date = new Date()): boolean {
    return now.getTime() < FREE_MODE_END_DATE.getTime();
}

export function freeModeEndDateLabel(): string {
    // Human-readable, e.g. "April 22, 2027" — used by the banner only.
    return FREE_MODE_END_DATE.toLocaleDateString("en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}
