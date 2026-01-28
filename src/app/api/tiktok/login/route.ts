// app/api/tiktok/login/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    response_type: "code",
    scope: "user.info.basic,video.publish",
    redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
    state: crypto.randomUUID(),
  });

  return NextResponse.redirect(
    `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`
  );
}
