import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { getValidTikTokToken } from "@/lib/tiktok";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clipId } = await req.json();

    const clip = await prisma.clip.findFirst({
      where: {
        id: clipId,
        userId: session.user.id,
      },
      include: {
        videoMetadata: true,
      },
    });

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    // marcamos como uploading
    await prisma.clip.update({
      where: { id: clip.id },
      data: { status: "uploading" },
    });

    const accessToken = await getValidTikTokToken(session.user.id);

    // ⚠️ TikTok necesita una URL pública
    const videoUrl = buildPublicClipUrl(clip);

    const uploadRes = await fetch(
      "https://open.tiktokapis.com/v2/post/publish/video/init/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_info: {
            title: clip.title,
            privacy_level: "PUBLIC",
          },
          source_info: {
            source: "PULL_FROM_URL",
            video_url: videoUrl,
          },
        }),
      }
    );

    const result = await uploadRes.json();

    if (!uploadRes.ok) {
      throw new Error(result.error?.message || "TikTok upload failed");
    }

    await prisma.clip.update({
      where: { id: clip.id },
      data: { status: "success" },
    });

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    console.error(err);

    const error = err instanceof Error ? err : new Error(String(err));

    type ClipError = Error & { clipId: string };

    if (
      err instanceof Error &&
      "clipId" in err &&
      typeof (err as Record<string, unknown>).clipId === "string"
    ) {
      const clipErr = err as ClipError;

      await prisma.clip.update({
        where: { id: clipErr.clipId },
        data: { status: "error" },
      });
    }

    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}

/**
 * Construye una URL pública al clip renderizado
 * (S3, R2, Cloudinary, etc)
 */
function buildPublicClipUrl(clip: { id: string }): string {
  // placeholder — depende de dónde guardes los videos
  return `https://cdn.tusitio.com/clips/${clip.id}.mp4`;
}
