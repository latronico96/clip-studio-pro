"use client";

import { useRef, useEffect, useMemo } from "react";
import { RotateCcw, AlertTriangle, ExternalLink } from "lucide-react";

interface VideoPlayerProps {
    url: string;
    onProgress?: (state: { playedSeconds: number }) => void;
    onDuration?: (duration: number) => void;
    startTime?: number;
    endTime?: number;
    layoutMode?: 'landscape' | 'portrait-crop' | 'portrait-fit';
}

export function VideoPlayer({ url, startTime = 0, endTime, layoutMode = 'landscape' }: VideoPlayerProps) {
    const isClient = typeof window !== "undefined";
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const videoId = useMemo(() => {
        if (!url) return null;

        const regExp =
            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);

        return match && match[2].length === 11 ? match[2] : null;
    }, [url]);

    // Seek to start whenever startTime is adjusted WITHOUT reloading the whole iframe
    useEffect(() => {
        if (isClient && iframeRef.current && videoId) {
            // We use postMessage to tell YouTube to seek
            // This is much smoother than reloading the iframe
            iframeRef.current.contentWindow?.postMessage(
                JSON.stringify({
                    event: "command",
                    func: "seekTo",
                    args: [startTime, true]
                }),
                "*"
            );
        }
    }, [startTime, isClient, videoId]);

    if (!isClient) return <div className="aspect-video w-full bg-zinc-900 rounded-[32px] animate-pulse" />;

    if (!videoId) {
        return (
            <div className={`w-full bg-zinc-900 rounded-[32px] flex flex-col items-center justify-center border border-white/5 ${layoutMode !== 'landscape' ? 'h-full' : 'aspect-video'}`}>
                <AlertTriangle className="text-yellow-500/50 mb-4" size={48} />
                <span className="text-gray-500 font-bold">Selecciona un video</span>
            </div>
        );
    }

    // enablejsapi=1 is required for postMessage to work
    const embedUrl = `https://www.youtube.com/embed/${videoId}?start=${Math.floor(startTime)}&rel=0&modestbranding=1&autoplay=1&enablejsapi=1`;

    const getIframeStyles = () => {
        switch (layoutMode) {
            case 'portrait-crop':
                // Zoom in to fill height, crop sides
                return "h-full w-auto max-w-none aspect-[16/9] absolute left-1/2 -translate-x-1/2 object-cover";
            case 'portrait-fit':
                // Fit width, center vertically (Letterbox)
                return "w-full h-auto aspect-[16/9] absolute top-1/2 -translate-y-1/2";
            case 'landscape':
            default:
                return "w-full h-full border-0 shadow-2xl";
        }
    };

    const getModeLabel = () => {
        switch (layoutMode) {
            case 'portrait-crop': return 'Zoom Centrado (9:16)';
            case 'portrait-fit': return 'Completo (Fit)';
            default: return 'Original (16:9)';
        }
    };

    return (
        <div className={`relative rounded-[32px] overflow-hidden bg-black border border-white/10 shadow-2xl group ${layoutMode !== 'landscape' ? 'h-full w-full' : 'w-full'}`}>
            <div className={`relative bg-black overflow-hidden ${layoutMode !== 'landscape' ? 'h-full w-full' : 'aspect-video w-full'}`}>
                <div className={layoutMode !== 'landscape' ? "absolute inset-0 flex items-center justify-center pointer-events-none" : ""}>
                    <iframe
                        ref={iframeRef}
                        src={embedUrl}
                        className={getIframeStyles()}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>

                <div className="absolute top-4 left-4 z-20 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">
                            {getModeLabel()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-6 flex items-center justify-between bg-zinc-900 border-t border-white/5">
                <button
                    onClick={() => {
                        iframeRef.current?.contentWindow?.postMessage(
                            JSON.stringify({ event: "command", func: "seekTo", args: [startTime, true] }), "*"
                        );
                        iframeRef.current?.contentWindow?.postMessage(
                            JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*"
                        );
                    }}
                    className="flex items-center space-x-2 bg-primary/10 text-primary px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all border border-primary/20"
                >
                    <RotateCcw size={14} />
                    <span>Ver Vista Previa</span>
                </button>

                <div className="flex items-center space-x-3">
                    <span className="text-[10px] font-bold text-description uppercase tracking-tighter">
                        Inicio: {startTime.toFixed(1)}s | Fin: {endTime?.toFixed(1)}s
                    </span>
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors"
                    >
                        <ExternalLink size={16} />
                    </a>
                </div>
            </div>
        </div>
    );
}
