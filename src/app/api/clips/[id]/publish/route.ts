import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { uploadYouTubeShort } from "@/lib/google/youtube";
import fs from "fs";
import path from "path";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const { id: clipId } = await params;

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { platform } = body;

        const clip = await prisma.clip.findUnique({
            where: { id: clipId },
            include: { videoMetadata: true }
        });

        if (!clip) {
            return NextResponse.json({ error: "Clip not found" }, { status: 404 });
        }

        if (clip.status !== "success") {
            return NextResponse.json({ error: "Clip is not ready for publishing" }, { status: 400 });
        }

        // Get Google Tokens
        const account = await prisma.account.findFirst({
            where: { userId: session.user.id, provider: "google" }
        });

        if (!account || !account.access_token) {
            return NextResponse.json({ error: "YouTube account not connected" }, { status: 400 });
        }

        if (platform === "youtube") {
            const publicDir = path.join(process.cwd(), 'public', 'renders');
            const videoPath = path.join(publicDir, `${clip.id}.mp4`);

            if (!fs.existsSync(videoPath)) {
                return NextResponse.json({ error: "El video aún no ha terminado de renderizarse." }, { status: 400 });
            }

            const videoBuffer = await fs.promises.readFile(videoPath);

            try {
                const result = await uploadYouTubeShort(account.access_token, videoBuffer, {
                    title: clip.title,
                    description: `Clip creado con ClipStudio Pro de forma automática.`
                });

                return NextResponse.json({ success: true, youtubeId: result.id });
            } catch (err: any) {
                return NextResponse.json({
                    error: "YouTube API Error: " + err.message
                }, { status: 500 });
            }
        }

        return NextResponse.json({ error: "Platform not supported yet" }, { status: 400 });

    } catch (error) {
        console.error("Publishing error:", error);
        return NextResponse.json({ error: "Failed to publish" }, { status: 500 });
    }
}
