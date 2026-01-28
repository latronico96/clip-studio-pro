// app/api/tiktok/callback/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";


export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.redirect("/login");
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect("/dashboard?error=tiktok_oauth");
  }

  // 🔁 intercambiar code por tokens
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.TIKTOK_REDIRECT_URI,
    }),
  });

  const data = await res.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.redirect("/login");
  }

  // ⬇️ upsert TikTokAccount
  await prisma.tikTokAccount.upsert({
    where: { userId: user.id },
    update: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      tiktokUserId: data.open_id,
    },
    create: {
      userId: user.id,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      tiktokUserId: data.open_id,
    },
  });

  return NextResponse.redirect("/dashboard?connected=tiktok");
}
