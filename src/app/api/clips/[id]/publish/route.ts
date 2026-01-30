import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { uploadYouTubeShort } from "@/lib/google/youtube";
import fs from "fs";
import path from "path";
import { uploadTikTokVideo } from "@/lib/tiktok/publish";

interface PublishRequestBody {
    youTube?: string | null | undefined;
    tiktok?: string | null | undefined;
    platform: 'youtube' | 'tiktok' | 'both';
}


export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    const { id: clipId } = await params;

    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const { platform } = body; // 'youtube', 'tiktok', o 'both'

        const clip = await prisma.clip.findUnique({
            where: { id: clipId },
        });

        if (!clip || clip.status !== "success") {
            return NextResponse.json({ error: "Clip not ready" }, { status: 400 });
        }

        const videoPath = path.join(process.cwd(), 'public', 'renders', `${clip.id}.mp4`);
        if (!fs.existsSync(videoPath)) {
            return NextResponse.json({ error: "Archivo de video no encontrado" }, { status: 404 });
        }
        console.log(videoPath);
        const videoBuffer = await fs.promises.readFile(videoPath);

        const results: PublishRequestBody = { platform: platform };

        if (platform === "youtube" || platform === "both") {
            const googleAcc = await prisma.account.findFirst({
                where: { userId: session.user.id, provider: "google" }
            });
            if (googleAcc?.access_token) {
                const yt = await uploadYouTubeShort(googleAcc.access_token, videoBuffer, {
                    title: clip.title,
                    description: "Publicado vía ClipStudio Pro"
                });
                results.youTube = yt.id;
            }
        }

        if (platform === "tiktok" || platform === "both") {
            const tiktokAcc = await prisma.tikTokAccount.findUnique({
                where: { userId: session.user.id }
            });

            // Nota: Aquí deberías verificar si el token expiró y refrescarlo antes de subir
            if (tiktokAcc?.accessToken) {
                const tt = await uploadTikTokVideo(tiktokAcc.accessToken, videoBuffer, clip.title);
                results.tiktok = tt.publish_id;
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: unknown) {
        console.error("Error publicando:", error);
        const message =
            error instanceof Error ? error.message : "Error inesperado";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
