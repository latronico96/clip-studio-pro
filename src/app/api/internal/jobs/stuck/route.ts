import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    const STALE_MS: number = parseInt(process.env.STALE_MS ?? "60000");
    const jobs = await prisma.job.findMany({
        where: {
            status: "PROCESSING",
            lastHeartbeat: {
                lt: new Date(Date.now() - STALE_MS)
            }
        }
    });

    return NextResponse.json({ jobs });
}
