"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { RotateCcw, AlertTriangle } from "lucide-react";

interface VideoPlayerProps {
    url: string;
    onProgress?: (state: { playedSeconds: number }) => void;
    onDuration?: (duration: number) => void;
    startTime?: number;
    endTime?: number;
    layoutMode?: 'landscape' | 'portrait-crop' | 'portrait-fit';
}

export default function VideoPlayer({ url, startTime = 0, endTime, layoutMode = 'landscape' }: VideoPlayerProps) {
    const isClient = typeof window !== "undefined";
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [currentTime, setCurrentTime] = useState(0);

    const videoId = useMemo(() => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
    }, [url]);

    // 1. Loop para monitorear el progreso del video
    useEffect(() => {
        if (!isClient || !videoId) return;

        const interval = setInterval(() => {
            if (iframeRef.current) {
                // Pedimos el tiempo actual a la API de YouTube
                iframeRef.current.contentWindow?.postMessage(
                    JSON.stringify({ event: "listening", id: 1 }), "*"
                );
                iframeRef.current.contentWindow?.postMessage(
                    JSON.stringify({ event: "command", func: "getCurrentTime", args: [] }), "*"
                );
            }
        }, 500); // Revisamos cada medio segundo

        // Handler para recibir la respuesta de YouTube
        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (data.event === "infoDelivery" && data.info && data.info.currentTime) {
                    const time = data.info.currentTime;
                    setCurrentTime(time);

                    // LOGICA DEL CORTE: Si se pasó del endTime, vuelve al inicio
                    if (endTime && time >= endTime) {
                        iframeRef.current?.contentWindow?.postMessage(
                            JSON.stringify({
                                event: "command",
                                func: "seekTo",
                                args: [startTime, true]
                            }), "*"
                        );
                    }
                }
            } catch (e) {
                console.error("Error processing YouTube message:", e);

                /* Errores de parseo silenciosos */
            }
        };

        window.addEventListener("message", handleMessage);
        return () => {
            clearInterval(interval);
            window.removeEventListener("message", handleMessage);
        };
    }, [videoId, startTime, endTime, isClient]);

    // 2. Sync manual cuando mueves el slider de inicio
    useEffect(() => {
        if (isClient && iframeRef.current && videoId) {
            iframeRef.current.contentWindow?.postMessage(
                JSON.stringify({ event: "command", func: "seekTo", args: [startTime, true] }), "*"
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

    // Añadimos widgetReferrer y origin para que la API sea más estable
    const embedUrl = `https://www.youtube.com/embed/${videoId}?start=${Math.floor(startTime)}&rel=0&modestbranding=1&autoplay=1&enablejsapi=1&origin=${isClient ? window.location.origin : ''}`;

    const getIframeStyles = () => {
        switch (layoutMode) {
            case 'portrait-crop':
                return {
                    height: '100%',
                    width: '177.77vh', // 16/9 = 1.7777. Esto asegura que el ancho sea suficiente para cubrir el alto
                    position: 'absolute' as const,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)', // Centra el video perfectamente
                    pointerEvents: 'none' as const,
                    maxWidth: 'none',
                };
            case 'portrait-fit':
                return {
                    width: '100%',
                    aspectRatio: '16/9',
                    position: 'absolute' as const,
                    top: '50%',
                    left: '0',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none' as const,
                };
            default:
                return {
                    width: '100%',
                    height: '100%',
                    border: '0',
                };
        }
    };

    return (
        <div className={`relative rounded-[32px] overflow-hidden bg-black border border-white/10 shadow-2xl group ${layoutMode !== 'landscape' ? 'aspect-[9/16] h-[600px] mx-auto' : 'w-full aspect-video'}`}>
            <div className="relative w-full h-full overflow-hidden">
                <iframe
                    ref={iframeRef}
                    src={embedUrl}
                    style={getIframeStyles()}
                    className="transition-all duration-500"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />

                {/* Overlay para bloquear interacciones directas con el iframe */}
                <div className="absolute inset-0 z-10" />
            </div>

            {/* Overlay para bloquear clics en el iframe y que el usuario use tus controles */}
            <div className="absolute inset-0 z-10 bg-transparent" />

            <div className="absolute top-4 left-4 z-20">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                        {layoutMode}
                    </span>
                </div>
            </div>

            <div className="absolute bottom-0 inset-x-0 p-4 z-30 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => {
                        iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [startTime, true] }), "*");
                        iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "playVideo" }), "*");
                    }}
                    className="p-2 bg-primary rounded-full text-white"
                >
                    <RotateCcw size={16} />
                </button>
                <span className="text-[10px] text-white font-mono">
                    {currentTime.toFixed(1)}s / {endTime?.toFixed(1)}s
                </span>
            </div>
        </div>
    );
}