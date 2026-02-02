import { SignJWT } from "jose";
import { writeFileSync } from "fs";

const secret = new TextEncoder().encode(
  process.env.WORKER_JWT_SECRET || "super-ultra-secret-worker-key"
);

async function main() {
  const token = await new SignJWT({
    role: "worker",
    type: "video-processor"
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("worker-1")
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(secret);

  console.log("\nWORKER TOKEN:\n");
  console.log(token);

  writeFileSync("worker.token.txt", token);
}

main();
