import { NextRequest, NextResponse } from "next/server";
import { guardAdminPortal } from "@/lib/admin-auth/guard";

// Mock data since crons might be handled via Vercel or GitHub Actions
const CRON_JOBS = [
    {
        id: "cron_potluck_reset",
        name: "Reset Potluck Limits",
        schedule: "0 0 1 * *",
        description: "Resets the monthly potluck usage count for all active subscriptions.",
        lastRunAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
        nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25).toISOString(), // 25 days from now
        status: "SUCCESS"
    },
    {
        id: "cron_expire_boosts",
        name: "Expire Kitchen Boosts",
        schedule: "0 * * * *",
        description: "Checks and expires boosts that have passed their end date.",
        lastRunAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        nextRunAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(), // 30 mins from now
        status: "SUCCESS"
    },
    {
        id: "cron_subscription_renew",
        name: "Process Renewals",
        schedule: "0 0 * * *",
        description: "Daily check to renew or expire subscriptions.",
        lastRunAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
        nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(), // 12 hours from now
        status: "FAILED"
    }
];

export async function GET(req: NextRequest) {
    const auth = await guardAdminPortal(req);
    if (!auth.ok) return auth.response;

    return NextResponse.json({ data: CRON_JOBS });
}

export async function POST(req: NextRequest) {
    const auth = await guardAdminPortal(req);
    if (!auth.ok) return auth.response;

    try {
        const { jobId } = await req.json();
        
        // In a real app, you would hit the cron endpoint directly here via a fetch call using a secret
        // e.g., fetch(`https://yourdomain.com/api/crons/${jobId}?secret=${process.env.CRON_SECRET}`)
        
        console.log(`[CRON] Admin triggered job: ${jobId}`);

        return NextResponse.json({ success: true, message: `Job ${jobId} triggered successfully.` });
    } catch (error) {
        return NextResponse.json({ error: "Failed to trigger job" }, { status: 500 });
    }
}
