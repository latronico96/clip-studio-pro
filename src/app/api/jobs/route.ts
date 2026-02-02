import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const body = await req.json();
    const { youtubeVideoId, start, end, platform } = body;

    if (!youtubeVideoId || start == null || end == null) {
        return NextResponse.json(
            { error: "Invalid payload" },
            { status: 400 }
        );
    }

    const job = await prisma.job.create({
        data: {
            userId: session.user.id,
            status: "PENDING",
            type: "VIDEO_CLIP",
            payload: {
                youtubeVideoId,
                start,
                end,
                platform,
            },
        },
    });

    return NextResponse.json({ jobId: job.id });
}
