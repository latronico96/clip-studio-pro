"use client";

import { useEffect, useState } from "react";
import { Upload, Youtube, Play, Plus, Loader2, PlusCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

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
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const res = await fetch("/api/youtube/videos");
                const data = await res.json();

                if (!res.ok) {
                    if (res.status === 401) {
                        throw new Error("Sesión caducada. Por favor, cierra sesión y vuelve a entrar.");
                    }
                    throw new Error(data.error || "Failed to fetch videos");
                }
                setVideos(data);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "No se pudieron cargar los videos. Asegúrate de tener una cuenta de YouTube conectada.");
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'youtube') {
            fetchVideos();
        }
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
            ) : error ? (
                <div className="text-center py-20 flex flex-col items-center">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle className="text-red-500" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Problema de Autenticación</h3>
                    <p className="text-gray-400 max-w-md mx-auto mb-8 whitespace-pre-wrap">{error}</p>

                    <div className="flex space-x-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
                        >
                            Reintentar
                        </button>
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
                        >
                            Cerrar Sesión ahora
                        </button>
                    </div>
                </div>
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
                                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                    <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-xl scale-90 group-hover:scale-100 transition-transform">
                                        <Play size={24} className="fill-white text-white ml-1" />
                                    </div>
                                </div>
                                <div className="absolute top-4 left-4">
                                    <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">YouTube</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="font-bold text-xl text-white line-clamp-2 mb-3 group-hover:text-primary transition-colors leading-tight">{video.title}</h3>

                                <div className="flex items-center justify-between mt-6">
                                    <span className="text-[11px] font-bold text-description uppercase tracking-wider opacity-60 italic">
                                        {new Date(video.publishedAt).toLocaleDateString()}
                                    </span>
                                    <button className="text-xs font-extrabold flex items-center space-x-1.5 text-primary uppercase tracking-widest hover:underline">
                                        <PlusCircle size={14} />
                                        <span>Crear Clip</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

            )}
        </div>
    );
}
