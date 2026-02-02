import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWorker } from "@/lib/workerAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyWorker(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const workerId = req.headers.get("x-worker-id");
  const job = await prisma.job.findUnique({
    where: { id },
    select: { status: true, lockedBy: true }
  });

  if (!job || job.status !== "PROCESSING") {
    return NextResponse.json({ error: "job not active" }, { status: 409 });
  }

  if (job.lockedBy !== workerId) {
    return NextResponse.json({ error: "not job owner" }, { status: 403 });
  }


  await prisma.job.update({
    where: { id },
    data: {
      lastHeartbeat: new Date()
    }
  });

  return NextResponse.json({ ok: true });
}
