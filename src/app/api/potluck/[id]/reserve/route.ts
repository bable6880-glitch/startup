import { NextResponse } from "next/server";

export async function POST() {
    return NextResponse.json(
        {
            success: false,
            error: "This endpoint is deprecated. Potluck orders now flow through the standard cart and /api/orders endpoint.",
        },
        { status: 410 }
    );
}
