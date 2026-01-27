import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from 'ffmpeg-static';
import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Setup FFmpeg path for serverless environments and local dev
let ffmpegPath = ffmpegInstaller;

if (ffmpegPath) {
    // Fix for Next.js/Webpack injecting \ROOT\ or /ROOT/ into the path
    if (ffmpegPath.includes('/ROOT') || ffmpegPath.includes('\\ROOT')) {
        ffmpegPath = ffmpegPath.replace(/^.*[\\/]node_modules/, path.join(process.cwd(), 'node_modules'));
        // Sometimes it keeps the leading slash/backslash
        if (ffmpegPath.startsWith('\\') || ffmpegPath.startsWith('/')) {
            ffmpegPath = path.join(process.cwd(), ffmpegPath.substring(1));
        }
    }

    // Explicit check for local development fallback
    if (!fs.existsSync(ffmpegPath)) {
        const localPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
        if (fs.existsSync(localPath)) {
            ffmpegPath = localPath;
        }
    }

    console.log(`[PROCESSOR] Using FFmpeg path: ${ffmpegPath}`);
    ffmpeg.setFfmpegPath(ffmpegPath);
}

export interface RenderOptions {
    url: string;
    startTime: number;
    endTime: number;
    layoutMode: 'landscape' | 'portrait-crop' | 'portrait-fit';
    clipId: string;
}

export async function processVideoClip(options: RenderOptions) {
    const { url, startTime, endTime, layoutMode, clipId } = options;

    // Use OS temp directory for processing (essential for Vercel /tmp)
    const tempDir = os.tmpdir();
    const downloadPath = path.join(tempDir, `raw_${clipId}.mp4`);
    const outputPath = path.join(tempDir, `render_${clipId}.mp4`);

    console.log(`[PROCESSOR] Starting download for ${clipId}...`);

    try {
        // 1. Download from YouTube
        await new Promise((resolve, reject) => {
            const stream = ytdl(url, {
                quality: 'highestvideo',
                filter: format => format.container === 'mp4',
                highWaterMark: 1 << 25, // 32MB buffer to prevent cutoffs
            });

            const fileStream = fs.createWriteStream(downloadPath);
            stream.pipe(fileStream);

            fileStream.on('finish', () => resolve(true));
            fileStream.on('error', reject);
            stream.on('error', reject);
        });

        console.log(`[PROCESSOR] Download complete. Starting FFmpeg render with mode: ${layoutMode}...`);

        // 2. Process with FFmpeg
        await new Promise((resolve, reject) => {
            let command = ffmpeg(downloadPath)
                .setStartTime(startTime)
                .setDuration(endTime - startTime);

            if (layoutMode === 'portrait-crop') {
                // Crop for 9:16 aspect ratio: center crop
                command = command.videoFilters([
                    'crop=ih*(9/16):ih'
                ]);
            } else if (layoutMode === 'portrait-fit') {
                // Fit 16:9 into 9:16 (letterbox)
                // We scale it to fit the 720x1280 frame and pad it
                command = command.videoFilters([
                    'scale=720:1280:force_original_aspect_ratio=decrease',
                    'pad=720:1280:(ow-iw)/2:(oh-ih)/2:black'
                ]);
            }

            command
                .outputOptions('-movflags frag_keyframe+empty_moov') // Needed for some players
                .output(outputPath)
                .on('start', (cmd) => console.log('[FFMPEG] Command:', cmd))
                .on('end', () => {
                    console.log(`[FFMPEG] Success! Output: ${outputPath}`);
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    console.error('[FFMPEG] Error:', err);
                    reject(err);
                })
                .run();
        });

        // 3. Return the buffer of the result
        const buffer = await fs.promises.readFile(outputPath);

        // Cleanup temp files
        try {
            await fs.promises.unlink(downloadPath);
            // We keep the output path if we want to serve it, 
            // but for this flow we just return the buffer.
        } catch (e) {
            console.error("[PROCESSOR] Cleanup error:", e);
        }

        return {
            buffer,
            path: outputPath
        };

    } catch (error) {
        console.error("[PROCESSOR] Fatal error:", error);
        throw error;
    }
}
