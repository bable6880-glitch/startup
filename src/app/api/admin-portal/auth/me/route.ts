import { NextRequest, NextResponse } from "next/server";
import { guardAdminPortal } from "@/lib/admin-auth/guard";

export async function GET(req: NextRequest) {
    const result = await guardAdminPortal(req);
    if (!result.ok) return result.response;

    return NextResponse.json({ admin: result.admin });
}
