import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWorker } from "@/lib/workerAuth";

export async function POST(req: NextRequest) {
  console.log("=== [CLAIM JOB] Start ===");
  console.log("[CLAIM JOB] Request URL:", req.url);
  console.log("[CLAIM JOB] Request headers:", Object.fromEntries(req.headers));

  const isValidWorker = verifyWorker(req);
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

  const job = await prisma.job.findFirst({
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

  console.log("[CLAIM JOB] Returning job:", job?.id ?? null);
  console.log("=== [CLAIM JOB] End ===");

  return NextResponse.json({ job });
}
