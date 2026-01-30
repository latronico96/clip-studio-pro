import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { listUserVideos } from "@/lib/google/youtube";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { google } from "googleapis";

type TokenUpdateData = {
  access_token: string;
  expires_at: number;
  refresh_token?: string;
};

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        console.log("Videos API: No session found");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tokens from database
    const account = await prisma.account.findFirst({
        where: { userId: session.user.id, provider: "google" },
    });

    if (!account) {
        return NextResponse.json({ error: "No YouTube account connected" }, { status: 400 });
    }

    let accessToken = account.access_token;

    // Check if token is expired (or expires in less than 5 minutes)
    // expires_at is usually in seconds (Unix timestamp)
    const expiresAt = account.expires_at ? account.expires_at * 1000 : 0;
    const isExpired = Date.now() >= (expiresAt - 5 * 60 * 1000);

    if (isExpired && account.refresh_token) {
        try {
            console.log("Videos API: Token expired, refreshing...");

            const auth = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET
            );

            auth.setCredentials({
                refresh_token: account.refresh_token
            });

            const { credentials } = await auth.refreshAccessToken();

            if (!credentials.access_token) {
                throw new Error("No access token returned from refresh");
            }

            // Update the tokens in the database
            // Note: Google might return a new refresh_token, or just a new access_token
            const updateData: TokenUpdateData = {
                access_token: credentials.access_token,
                expires_at: Math.floor((credentials.expiry_date || Date.now() + 3600 * 1000) / 1000),
            };

            if (credentials.refresh_token) {
                updateData.refresh_token = credentials.refresh_token;
            }

            await prisma.account.update({
                where: { id: account.id },
                data: updateData,
            });

            accessToken = credentials.access_token;
            console.log("Videos API: Token refreshed successfully");

        } catch (refreshError) {
            console.error("Videos API: Failed to refresh token", refreshError);
            // If refresh fails, we might as well return 401 so the user is forced to re-login
            return NextResponse.json({
                error: "Session expired",
                details: "No se pudo renovar tu sesión. Por favor, vuelve a conectar tu cuenta."
            }, { status: 401 });
        }
    }

    if (!accessToken) {
        return NextResponse.json({ error: "No access token available" }, { status: 401 });
    }

    try {
        console.log("Videos API: Fetching videos for user", session.user.id);
        const videos = await listUserVideos(accessToken);
        return NextResponse.json(videos);
    } catch (err: unknown) {
        console.error("YouTube API Error Details:", err);

        if (err instanceof Error) {
            // Si vos mismo lanzaste errores con status/code
            const anyErr = err as Error & { status?: number; code?: number };

            if (anyErr.status === 401 || anyErr.code === 401) {
                return NextResponse.json(
                    {
                        error: "Auth token expired",
                        details: "Tu sesión de Google ha caducado o los permisos fueron revocados.",
                    },
                    { status: 401 }
                );
            }
        }

        return NextResponse.json(
            { error: "Failed to fetch videos" },
            { status: 500 }
        );
    }

}
