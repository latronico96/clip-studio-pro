export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { generatePKCE } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET() {
  
  const { codeVerifier, codeChallenge } = generatePKCE();
  const session = await getServerSession(authOptions);

  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    response_type: "code",
    scope: "user.info.profile",
    redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
    state: "test",
    code_challenge: codeChallenge, // 👈 typo corregido
    code_challenge_method: "S256",
  });

  const response = NextResponse.redirect(
    `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`
  );

  // 🔐 Guardamos el code_verifier SOLO en cookie (no DB)
  response.cookies.set("tiktok_pkce", codeVerifier, {
    httpOnly: true,
    secure: false,
    path: "/",
    maxAge: 60 * 5,
    sameSite: "lax",
  });

  return response;
}
