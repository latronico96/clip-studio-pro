import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Job } from "@prisma/client";
import { verifyWorker } from "@/lib/workerAuth";
import { google } from "googleapis";

type TokenUpdateData = {
  access_token: string;
  expires_at: number;
  refresh_token?: string;
};

export async function POST(req: NextRequest) {
  console.log("=== [CLAIM JOB] Start ===");
  console.log("[CLAIM JOB] Request URL:", req.url);
  console.log("[CLAIM JOB] Request headers:", Object.fromEntries(req.headers));

  const isValidWorker = await verifyWorker(req);
  if (!isValidWorker) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const workerId = req.headers.get("x-worker-id") ?? "unknown";
  const STALE_MS: number = parseInt(process.env.STALE_MS ?? "60000");

  await prisma.job.updateMany({
    where: {
      status: "PROCESSING",
      lastHeartbeat: {
        lt: new Date(Date.now() - STALE_MS)
      }
    },
    data: {
      status: "PENDING",
      lockedBy: null,
      lockedAt: null,
      lastHeartbeat: null
    }
  });

  const job: Job | null = await prisma.job.findFirst({
    where: {
      status: "PENDING",
      lockedAt: null,
    },
    orderBy: { createdAt: "asc" },
  });

  if (!job) {
    return NextResponse.json({ job: null });
  }

  const updated = await prisma.job.updateMany({
    where: {
      id: job.id,
      lockedAt: null,
    },
    data: {
      lockedAt: new Date(),
      lockedBy: workerId,
      status: "PROCESSING",
      lastHeartbeat: new Date(),
    },
  });

  if (updated.count === 0) {
    return NextResponse.json({ job: null });
  }

  const youtubeAccessToken = job.userId
    ? await getYouTubeAccessToken(job.userId)
    : null;

  const payload = {
    ...(job.payload as Record<string, unknown>),
    youtubeAccessToken,
  };

  console.log("[CLAIM JOB] Returning job:", job?.id ?? null);
  console.log("=== [CLAIM JOB] End ===");

  return NextResponse.json({
    job: {
      ...job,
      payload,
    },
  });
}

async function getYouTubeAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });

  if (!account?.access_token) {
    return null;
  }

  let accessToken = account.access_token;
  const expiresAt = account.expires_at ? account.expires_at * 1000 : 0;
  const isExpired = Date.now() >= expiresAt - 5 * 60 * 1000;

  if (isExpired && account.refresh_token) {
    try {
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      auth.setCredentials({
        refresh_token: account.refresh_token,
      });

      const { credentials } = await auth.refreshAccessToken();

      if (!credentials.access_token) {
        return null;
      }

      const updateData: TokenUpdateData = {
        access_token: credentials.access_token,
        expires_at: Math.floor(
          (credentials.expiry_date || Date.now() + 3600 * 1000) / 1000
        ),
      };

      if (credentials.refresh_token) {
        updateData.refresh_token = credentials.refresh_token;
      }

      await prisma.account.update({
        where: { id: account.id },
        data: updateData,
      });

      accessToken = credentials.access_token;
    } catch (refreshError) {
      console.error("Claim job: Failed to refresh token", refreshError);
      return null;
    }
  }

  return accessToken;
}
