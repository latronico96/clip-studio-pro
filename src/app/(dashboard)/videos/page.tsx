"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Upload, Youtube, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { signIn, signOut } from "next-auth/react";

interface ErrorCardProps {
    title: string;
    description: string;
    actions: Array<{
        label: string;
        onClick: () => void;
        primary?: boolean;
    }>;
}

function ErrorCard({ title, description, actions }: ErrorCardProps) {
    return (
        <div className="text-center py-20 flex flex-col items-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="text-red-500" size={40} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-400 max-w-md mx-auto mb-8">{description}</p>

            <div className="flex space-x-4">
                {actions.map((action, index) => (
                    <button
                        key={index}
                        onClick={action.onClick}
                        className={`px-6 py-3 rounded-xl font-bold transition-all ${action.primary
                            ? "bg-primary text-white hover:shadow-lg hover:shadow-primary/20"
                            : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                            }`}
                    >
                        {action.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

interface Video {
    id: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
    duration: number;
}

export default function VideosPage() {
    const [activeTab, setActiveTab] = useState<'youtube' | 'upload'>('youtube');
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<
        null | "GOOGLE_EXPIRED" | "NO_YOUTUBE_ACCOUNT" | "UNKNOWN"
    >(null);
    const router = useRouter();

    useEffect(() => {
        if (activeTab !== "youtube") return;

        setLoading(true);
        setError(null);

        const fetchVideos = async () => {
            try {
                const res = await fetch("/api/youtube/videos");
                const data = await res.json();

                if (!res.ok) {
                    if (res.status === 401) {
                        setError("GOOGLE_EXPIRED");
                        return;
                    }

                    if (res.status === 400) {
                        setError("NO_YOUTUBE_ACCOUNT");
                        return;
                    }
                    

                    throw new Error(data.error || "UNKNOWN");
                }
                setVideos(data.videos);
            } catch (err: unknown) {
                console.error(err);
                setError("UNKNOWN");
            } finally {
                setLoading(false);
            }
        };
        fetchVideos();
    }, [activeTab]);

    const handleCreateClip = (videoId: string, duration: number) => {
        const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;
        router.push(`/editor?url=${encodeURIComponent(fullUrl)}&duration=${duration}`);
    };

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-bold">Mis Videos</h2>
                    <p className="text-muted-foreground mt-2">Selecciona un video para empezar a crear clips.</p>
                </div>

                <button className="flex items-center space-x-2 bg-primary px-6 py-3 rounded-2xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
                    <Upload size={20} />
                    <span>Subir Nuevo</span>
                </button>
            </div>

            <div className="flex space-x-4 p-1 bg-white/5 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('youtube')}
                    className={`flex items-center space-x-2 px-6 py-2 rounded-xl transition-all ${activeTab === 'youtube' ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
                >
                    <Youtube size={18} />
                    <span>YouTube</span>
                </button>
                <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex items-center space-x-2 px-6 py-2 rounded-xl transition-all ${activeTab === 'upload' ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
                >
                    <Upload size={18} />
                    <span>Subidos</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-primary" size={48} />
                </div>
            ) : error === "GOOGLE_EXPIRED" ? (
                <ErrorCard
                    title="Tu sesión de Google expiró"
                    description="Necesitamos que vuelvas a conectar tu cuenta de YouTube."
                    actions={[
                        {
                            label: "Reconectar Google",
                            onClick: () => signIn("google", { callbackUrl: "/videos" }),
                            primary: true,
                        },
                        {
                            label: "Cerrar sesión",
                            onClick: () => signOut({ callbackUrl: "/login" }),
                        },
                    ]}
                />
            ) : error === "NO_YOUTUBE_ACCOUNT" ? (
                <ErrorCard
                    title="Conectá tu cuenta de YouTube"
                    description="Para ver tus videos necesitamos acceso a tu canal."
                    actions={[
                        {
                            label: "Conectar YouTube",
                            onClick: () => signIn("google", { callbackUrl: "/videos" }),
                            primary: true,
                        },
                    ]}
                />
            ) : error === "UNKNOWN" ? (
                <ErrorCard
                    title="No pudimos cargar tus videos"
                    description="Ocurrió un error inesperado. Intentalo de nuevo más tarde."
                    actions={[
                        {
                            label: "Reintentar",
                            onClick: () => setActiveTab("youtube"),
                            primary: true,
                        },
                    ]}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {videos.map((video, index) => (
                        <motion.div
                            key={video.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass rounded-[32px] overflow-hidden group hover:border-primary/50 transition-all cursor-pointer bg-white/[0.02]"
                            onClick={() => handleCreateClip(video.id, video.duration)}
                        >
                            <div className="relative aspect-video">
                                <Image
                                    src={video.thumbnail}
                                    alt={video.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>

                            <div className="p-6">
                                <h3 className="font-bold text-xl text-white line-clamp-2 mb-3 group-hover:text-primary transition-colors">
                                    {video.title}
                                </h3>

                                <div className="flex items-center justify-between mt-6">
                                    <span className="text-[11px] font-bold opacity-60 italic">
                                        {new Date(video.publishedAt).toLocaleDateString()}
                                    </span>
                                    <span className="text-xs font-extrabold text-primary uppercase tracking-widest">
                                        Crear Clip
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
