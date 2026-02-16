import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { Clip } from "@prisma/client";

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
    console.log("Creating clip for user:", session.user.id);

    try {
        const body = await request.json();
        console.log("videoId, videoUrl", body.videoId, body.videoUrl);
        const {
            thumbnail,
            platforms,
            render,
            source,
            clip,
        } = body;

        const videoId = source.videoId
        const title = clip.title || `Clip from ${videoId}`;
        const startTime = clip.startTime || 0;
        const endTime = clip.endTime || 0;
        const duration = clip.duration || 0;

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
                startTime: startTime,
                endTime: endTime,
                title: title || "Sin título",
                platforms: Object.keys(platforms).join(","), // youtube,tiktok
                status: "PENDING",
                layoutMode: clip.layoutMode
            }
        });

        createJob(newClip.id, newClip, videoId);

        return NextResponse.json(newClip);
    } catch (error) {
        console.error("Clip creation error:", error);
        return NextResponse.json({ error: "Failed to create clip" }, { status: 500 });
    }
}

// Backend Render Engine (REAL IMPLEMENTATION)
async function createJob(clipId: string, newClip: Clip, videoId: string) {
    await prisma.job.create({
        data: {
            title: newClip.title,
            description: `Clip from video ${videoId} (${newClip.startTime}s to ${newClip.endTime}s)`,
            categoryID: "22",
            privacystatus: "public",
            userId: newClip.userId,
            type: "VIDEO_CLIP" as const,
            status: "PENDING",
            payload: {
                clipId: newClip.id,
                source: {
                    youtubeVideoId: videoId
                },

                start: newClip.startTime,
                end: newClip.endTime,

                layoutMode: newClip.layoutMode,
                aspectRatio: newClip.layoutMode === "landscape" ? "16:9" : "9:16",
                resolution: "1080x1920",

                platforms: ["youtube"],
                youtube: {
                    title: newClip.title,
                    description: "",
                    tags: [],
                    visibility: "public",
                    isShort: true
                }
            },
        },
    });
}
