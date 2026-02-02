import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWorker } from "@/lib/workerAuth";

type Params = {
  id: string;
};

export async function POST(
  req: NextRequest,
  context: { params: Promise<Params> }
) {
  if (!verifyWorker(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id: jobId } = await context.params;
  const body = await req.json().catch(() => null);
  if (!body || !body.status) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }

  const { status, result, error } = body;

  if (status === "FAILED") {
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
      await prisma.job.update({
        where: { id: jobId },
        data: {
          attempts: { increment: 1 },
          status: "PENDING",
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
        status: "DEAD",
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

  await prisma.job.update({
    where: { id: jobId },
    data: {
      status,
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
