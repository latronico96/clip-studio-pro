import { useState } from "react";
import { CheckCircle2, Clock, Share2, Youtube, AlertCircle, Smartphone, Monitor, Download, Loader2 } from "lucide-react";
import { Clip } from "@/types/clip";

interface ClipCardProps {
    clip: Clip & { verticalMode?: boolean };
}

export function ClipCard({ clip }: ClipCardProps) {
    const [isPublishing, setIsPublishing] = useState<string | null>(null); // 'youtube', 'tiktok', 'both' o null
    const [publishedPlatforms, setPublishedPlatforms] = useState<string[]>([]);

    const statusColors = {
        PENDING: "bg-blue-500/10 text-blue-500",
        PROCESSING: "bg-purple-500/10 text-purple-500",
        UPLOADING: "bg-yellow-500/10 text-yellow-500",
        SUCCESS: "bg-green-500/10 text-green-500",
        ERROR: "bg-red-500/10 text-red-500",
    };

    const statusIcons = {
        PENDING: <Clock size={14} />,
        PROCESSING: <div className="w-3 h-3 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />,
        UPLOADING: <div className="w-3 h-3 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />,
        SUCCESS: <CheckCircle2 size={14} />,
        ERROR: <AlertCircle size={14} />,
    };

    const handlePublish = async (platform: string) => {
        setIsPublishing(platform);
        try {
            const res = await fetch(`/api/clips/${clip.id}/publish`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ platform })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al publicar");

            if (platform === 'both') {
                setPublishedPlatforms(prev => [...new Set([...prev, ...clip.platforms])]);
                alert("¡Publicado en todas las plataformas!");
            } else {
                setPublishedPlatforms(prev => [...prev, platform]);
                alert(`¡Publicado con éxito en ${platform.toUpperCase()}!`);
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Error inesperado";
            alert("Error: " + message);
        } finally {
            setIsPublishing(null);
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = `/renders/${clip.id}.mp4`;
        link.download = `${clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="glass rounded-[28px] p-6 border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden">
            {clip.status === 'SUCCESS' && (
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <CheckCircle2 size={120} className="text-green-500" />
                </div>
            )}

            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="space-y-1">
                    <h4 className="font-bold text-xl text-white group-hover:text-primary transition-colors tracking-tight line-clamp-1">{clip.title}</h4>
                    <p className="text-[11px] text-description flex items-center space-x-2 font-mono uppercase tracking-wider opacity-70 font-semibold">
                        <span>Original: {clip.videoId}</span>
                        <span className="opacity-30">•</span>
                        <span>{clip.startTime.toFixed(1)}s - {clip.endTime.toFixed(1)}s</span>
                        <span className="opacity-30">•</span>
                        <span className="flex items-center space-x-1">
                            {clip.verticalMode ? <Smartphone size={10} className="text-primary" /> : <Monitor size={10} />}
                            <span>{clip.verticalMode ? 'Vertical' : 'Original'}</span>
                        </span>
                    </p>
                </div>
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-white/5 ${statusColors[clip.status]}`}>
                    {statusIcons[clip.status]}
                    <span>{clip.status === 'SUCCESS' ? 'Listo' : clip.status}</span>
                </div>
            </div>

            <div className="flex flex-col space-y-4 mt-8 relative z-10">
                {clip.status === 'PROCESSING' && (
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full w-2/3 animate-pulse" />
                    </div>
                )}

                <div className="flex items-center justify-between pt-5 border-t border-white/5">
                    <div className="flex space-x-2">
                        {clip.platforms.map(platform => {
                            const isThisPublishing = isPublishing === platform || isPublishing === 'both';
                            const isAlreadyPublished = publishedPlatforms.includes(platform);

                            return (
                                <button
                                    key={platform}
                                    disabled={!!isPublishing || isAlreadyPublished || clip.status !== 'SUCCESS'}
                                    onClick={() => handlePublish(platform)}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all relative
                    ${isAlreadyPublished
                                            ? 'bg-green-500/20 border-green-500/30 cursor-default'
                                            : 'bg-white/5 border-white/5 hover:border-primary/50 hover:bg-white/10 active:scale-90 cursor-pointer'}
                    ${isThisPublishing ? 'opacity-50 cursor-wait' : ''}
                `}
                                    title={isAlreadyPublished ? `Publicado en ${platform}` : `Publicar en ${platform}`}
                                >
                                    {isThisPublishing ? (
                                        <Loader2 size={16} className="animate-spin text-white" />
                                    ) : platform === 'youtube' ? (
                                        <Youtube size={18} className={isAlreadyPublished ? 'text-green-500' : 'text-[#FF0000]'} />
                                    ) : (
                                        <svg viewBox="0 0 24 24" className={`w-4 h-4 ${isAlreadyPublished ? 'fill-green-500' : 'fill-white'}`}>
                                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .8.11V9.42a7.27 7.27 0 0 0-10.23 6.51 7.28 7.28 0 0 0 14.15 1.6V7.06a8.29 8.29 0 0 0 5.39 1.61V5.2a4.27 4.27 0 0 1-3.77-2.76z" />
                                        </svg>
                                    )}
                                    {isAlreadyPublished && (
                                        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                                            <CheckCircle2 size={8} className="text-white" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center space-x-2">
                        {clip.status === 'SUCCESS' ? (
                            <>
                                <button
                                    onClick={handleDownload}
                                    className="p-2.5 bg-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all"
                                    title="Descargar MP4"
                                >
                                    <Download size={18} />
                                </button>
                                <button
                                    disabled={isPublishing !== null}
                                    onClick={() => handlePublish('both')}
                                    className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${isPublishing ? 'bg-zinc-800 text-gray-500' : 'bg-primary text-white hover:shadow-lg hover:shadow-primary/30 active:scale-95'}`}
                                >
                                    {isPublishing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                                    <span>{isPublishing ? 'Publicando...' : 'Publicar'}</span>
                                </button>
                            </>
                        ) : (
                            <span className="text-[10px] font-bold text-gray-600 uppercase italic">Procesando Video...</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
