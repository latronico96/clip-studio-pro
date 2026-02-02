import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.WORKER_JWT_SECRET!
);

export async function verifyWorker(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  const token = auth.slice(7);

  try {
    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== "worker") return null;

    return {
      workerId: payload.sub as string,
      type: payload.type as string
    };
  } catch (err) {
    console.error("[WORKER AUTH ERROR]", err);
    return null;
  }
}
