export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { generatePKCE } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET() {
  
  const { codeVerifier, codeChallenge } = generatePKCE();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Debes estar logueado" }, { status: 401 });
  }

  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    response_type: "code",
    scope: "user.info.basic,video.publish,video.upload",
    redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
    state: session.user.id,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const response = NextResponse.redirect(
    `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`
  );

  response.cookies.set("tiktok_pkce", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || process.env.NEXTAUTH_URL?.startsWith("https"),
    path: "/",
    maxAge: 60 * 5,
    sameSite: "lax",
  });

  return response;
}
