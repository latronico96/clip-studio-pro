import { prisma } from "@/lib/db";

export async function getValidTikTokToken(userId: string) {
  const account = await prisma.tikTokAccount.findUnique({
    where: { userId },
  });

  if (!account) {
    throw new Error("TikTok not connected");
  }

  // token todavía válido
  if (account.expiresAt > new Date()) {
    return account.accessToken;
  }

  // refresh token
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: account.refreshToken,
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
    }),
  });

  const data = await res.json();

  const updated = await prisma.tikTokAccount.update({
    where: { userId },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? account.refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  });

  return updated.accessToken;
}
