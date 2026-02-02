import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { processVideoClip } from "@/lib/video/processor";
import fs from 'fs';
import path from 'path';


export const LAYOUT_MODES = ['landscape', 'portrait-crop', 'portrait-fit'] as const;
export type LayoutMode = typeof LAYOUT_MODES[number];

export function isLayoutMode(value: string): value is LayoutMode {
  return LAYOUT_MODES.includes(value as LayoutMode);
}

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const clips = await prisma.clip.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                videoMetadata: true
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Format to match UI interface
        const formattedClips = clips.map(clip => ({
            id: clip.id,
            videoId: clip.videoMetadata.vId,
            startTime: clip.startTime,
            endTime: clip.endTime,
            title: clip.title,
            status: clip.status,
            platforms: clip.platforms.split(",").filter(p => p),
            createdAt: clip.createdAt.toISOString(),
            thumbnail: clip.videoMetadata.thumbnail
        }));

        return NextResponse.json(formattedClips);
    } catch (error) {
        console.error("Clips fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            videoId,
            title,
            startTime,
            endTime,
            thumbnail,
            duration,
            layoutMode = 'landscape'
        } = body;

        // Ensure VideoMetadata exists
        let video = await prisma.videoMetadata.findUnique({
            where: { vId: videoId }
        });

        if (!video) {
            video = await prisma.videoMetadata.create({
                data: {
                    vId: videoId,
                    title: title || "Video Original",
                    thumbnail: thumbnail || "",
                    duration: duration || 0,
                    source: "youtube"
                }
            });
        }

        const newClip = await prisma.clip.create({
            data: {
                userId: session.user.id,
                videoMetadataId: video.id,
                startTime,
                endTime,
                title: title || "Sin título",
                platforms: "youtube,tiktok", // Default targets
                status: "PENDING",
                layoutMode: layoutMode
            }
        });

        // "REAL" BACKGROUND PROCESSING SIMULATION
        // In a real server this would be a BullMQ/Redis job
        processClipInBackground(newClip.id);

        return NextResponse.json(newClip);
    } catch (error) {
        console.error("Clip creation error:", error);
        return NextResponse.json({ error: "Failed to create clip" }, { status: 500 });
    }
}

// Backend Render Engine (REAL IMPLEMENTATION)
async function processClipInBackground(clipId: string) {
    console.log(`[RENDER ENGINE] Iniciando procesamiento REAL del Clip ID: ${clipId}`);

    try {
        const clip = await prisma.clip.findUnique({
            where: { id: clipId },
            include: { videoMetadata: true }
        });

        if (!clip) return;

        // Step 1: Processing
        await prisma.clip.update({
            where: { id: clipId },
            data: { status: "PROCESSING" }
        });
        console.log(`[RENDER ENGINE] El Clip ${clipId} está siendo procesado por FFmpeg con modo: ${clip.layoutMode}...`);

        const videoUrl = `https://www.youtube.com/watch?v=${clip.videoMetadata.vId}`;

        // Step 2: Render
        const result = await processVideoClip({
            url: videoUrl,
            startTime: clip.startTime,
            endTime: clip.endTime,
            layoutMode: isLayoutMode(clip.layoutMode)
                ? clip.layoutMode
                : "landscape",
            clipId: clip.id
        });

        // Step 3: Save to public directory for serving
        const publicRendersDir = path.join(process.cwd(), 'public', 'renders');
        if (!fs.existsSync(publicRendersDir)) {
            fs.mkdirSync(publicRendersDir, { recursive: true });
        }

        const outputPath = path.join(publicRendersDir, `${clip.id}.mp4`);
        await fs.promises.writeFile(outputPath, result.buffer);

        // Step 4: Success
        await prisma.clip.update({
            where: { id: clipId },
            data: { status: "success" }
        });
        console.log(`[RENDER ENGINE] ¡Éxito! Clip ${clipId} renderizado correctamente.`);

    } catch (error) {
        console.error(`[RENDER ENGINE] Error al procesar clip ${clipId}:`, error);
        await prisma.clip.update({
            where: { id: clipId },
            data: { status: "error" }
        });
    }
}
