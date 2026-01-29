export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const session = await getServerSession(authOptions);
  const userId = searchParams.get("state");

  if (!session?.user?.id || !userId || session.user.id !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get("tiktok_pkce")?.value;

  console.log("ALL COOKIES:", cookieStore.getAll());

  if (!codeVerifier) {
    return NextResponse.json(
      { error: "PKCE verifier not found" },
      { status: 400 }
    );
  }

  const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
      code_verifier: codeVerifier,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    return NextResponse.json(tokenData, { status: 400 });
  }

  await prisma.tikTokAccount.upsert({
    where: { userId: session.user.id },
    update: {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      tiktokUserId: tokenData.open_id,
    },
    create: {
      userId: session.user.id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      tiktokUserId: tokenData.open_id,
    },
  });

  // 🧹 borrar PKCE
  const origin = new URL(req.url).origin; 
  const res = NextResponse.redirect(`${origin}/dashboard`);
  res.cookies.delete("tiktok_pkce");

  return res;
}
