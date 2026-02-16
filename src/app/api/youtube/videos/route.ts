import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { listUserVideos } from "@/lib/google/youtube";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { google } from "googleapis";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "google",
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "NO_GOOGLE_ACCOUNT" },
        { status: 400 }
      );
    }

    let accessToken = account.access_token;

    const expiresAt = account.expires_at
      ? account.expires_at * 1000
      : 0;

    const isExpired =
      !accessToken ||
      Date.now() >= expiresAt - 5 * 60 * 1000;

    if (isExpired && account.refresh_token) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.NEXTAUTH_URL
      );

      oauth2Client.setCredentials({
        refresh_token: account.refresh_token,
      });
      console.log('refresh token:', oauth2Client.credentials.refresh_token);
      const { credentials } = await oauth2Client.refreshAccessToken();
      const token = credentials.access_token;

      if (!token) {
        return NextResponse.json(
          { error: "TOKEN_REFRESH_FAILED" },
          { status: 401 }
        );
      }

      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: token,
          expires_at: credentials.expiry_date
            ? Math.floor(credentials.expiry_date / 1000)
            : Math.floor((Date.now() + 3600_000) / 1000),
          refresh_token: credentials.refresh_token ?? account.refresh_token,
        },
      });
      accessToken = token;
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "NO_ACCESS_TOKEN" },
        { status: 401 }
      );
    }
    const videos = await listUserVideos(accessToken);
    return NextResponse.json(
      { videos },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message:
          err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
