import { google } from "googleapis";

export const getYouTubeClient = (accessToken: string) => {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.youtube({ version: "v3", auth });
};

export const listUserVideos = async (accessToken: string) => {
    const youtube = getYouTubeClient(accessToken);
    const response = await youtube.channels.list({
        mine: true,
        part: ["contentDetails"],
    });

    const uploadPlaylistId = response.data.items?.[0].contentDetails?.relatedPlaylists?.uploads;

    if (!uploadPlaylistId) return [];

    const playlistItemsResponse = await youtube.playlistItems.list({
        playlistId: uploadPlaylistId,
        part: ["contentDetails", "snippet"],
        maxResults: 50,
    });

    const videoIds = playlistItemsResponse.data.items?.map(item => item.contentDetails?.videoId).filter(Boolean) as string[];

    if (!videoIds || videoIds.length === 0) return [];

    // Get detailed info (duration) for these videos
    const videosDetailResponse = await youtube.videos.list({
        id: videoIds,
        part: ["contentDetails", "snippet"],
    });

    return videosDetailResponse.data.items?.map(item => ({
        id: item.id,
        title: item.snippet?.title,
        thumbnail: item.snippet?.thumbnails?.high?.url,
        publishedAt: item.snippet?.publishedAt,
        duration: parseISO8601Duration(item.contentDetails?.duration || "PT0S"),
    })) || [];
};

function parseISO8601Duration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    return hours * 3600 + minutes * 60 + seconds;
}


import { Readable } from "stream";

export const uploadYouTubeShort = async (
    accessToken: string,
    videoBuffer: Buffer,
    metadata: { title: string, description: string }
) => {
    const youtube = getYouTubeClient(accessToken);

    try {
        const response = await youtube.videos.insert({
            part: ["snippet", "status"],
            requestBody: {
                snippet: {
                    title: metadata.title,
                    description: metadata.description,
                    categoryId: "22", // People & Blogs
                },
                status: {
                    privacyStatus: "public",
                    selfDeclaredMadeForKids: false,
                },
            },
            media: {
                body: Readable.from(videoBuffer),
            },
        });

        return { id: response.data.id };
    } catch (error) {
        console.error("YouTube Upload Error:", error);
        throw error;
    }
};

