import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWorker } from "@/lib/workerAuth";
import { JobStatus } from "@prisma/client";

type Params = {
  id: string;
};

export async function POST(
  req: NextRequest,
  context: { params: Promise<Params> }
) {
  console.log("=== [COMPLETE JOB] Start ===");
  console.log("[COMPLETE JOB] Request URL:", req.url);
  console.log("[COMPLETE JOB] Request headers:", Object.fromEntries(req.headers));
  if (!verifyWorker(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const workerId = req.headers.get("x-worker-id");
  const { id: jobId } = await context.params;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { lockedBy: true, status: true }
  });

  if (!job || job.lockedBy !== workerId) {
    return NextResponse.json({ error: "not job owner" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.status) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }

  const { status, result, error } = body;

  if (status === "FAILED") {
    const jobStatus = JobStatus.FAILED;
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        attempts: true,
        maxAttempts: true
      }
    });

    if (!job) throw new Error("job not found");

    if (job.attempts + 1 < job.maxAttempts) {
      const jobStatus = JobStatus.PENDING;
      await prisma.job.update({
        where: { id: jobId },
        data: {
          attempts: { increment: 1 },
          status: jobStatus,
          lockedBy: null,
          lockedAt: null,
          lastHeartbeat: null
        }
      });

      return NextResponse.json({ retried: true });
    }

    await prisma.job.update({
      where: { id: jobId },
      data: {
        attempts: { increment: 1 },
        status: JobStatus.DEAD,
        finishedAt: new Date(),
        error
      }
    });

    return NextResponse.json({ dead: true });
  }

  if (!["COMPLETED", "FAILED"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid status" },
      { status: 400 }
    );
  }
  const jobStatus = status === "COMPLETED" ? JobStatus.DONE : JobStatus.FAILED;
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: jobStatus,
      finishedAt: new Date(),
      lockedBy: null,
      lockedAt: null,
      lastHeartbeat: null,
      result: result ?? undefined,
      error: error ?? undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
