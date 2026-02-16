"use client";

import { useState, useEffect, Suspense } from "react";
import { Timeline } from "@/components/Timeline";
import { Save, Youtube, Smartphone, Check, Scissors } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const VideoPlayer = dynamic(
    () => import("@/components/VideoPlayer"),
    { ssr: false }
);

function EditorContent() {
    const searchParams = useSearchParams();
    const videoUrl = searchParams.get("url") || "";
    const urlDuration = parseFloat(searchParams.get("duration") || "0");
    const hasUrl = !!videoUrl;
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(urlDuration > 30 ? 30 : urlDuration || 30);
    const [title, setTitle] = useState("Mi primer clip viral");
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [duration, setDuration] = useState(urlDuration || 600);
    const [layoutMode, setLayoutMode] = useState<'landscape' | 'portrait-crop' | 'portrait-fit'>('portrait-crop');
    const [platforms,] = useState({
        youtube: true,
        tiktok: true,
    });
    const [youtubeConfig,] = useState({
        title,
        description: "",
        visibility: "public", // public | unlisted | private
        madeForKids: false,
    });
    const [tiktokConfig,] = useState({ caption: title });
    const workflowConfig = {
        autoPublish: true,
        generateThumbnail: true,
        thumbnailFrame: 3,
    };

    useEffect(() => {
        if (showSuccess) {
            console.log("Simulating background processing for clip...");
        }
    }, [showSuccess]);

    useEffect(() => {
        if (urlDuration > 0) {
            setDuration(urlDuration);
            setEndTime(urlDuration > 30 ? 30 : urlDuration);
        }
    }, [urlDuration]);

    const handleSave = async () => {
        if (!hasUrl) return;
        setIsSaving(true);
        try {
            const urlObj = new URL(videoUrl);
            const videoId =
                urlObj.searchParams.get("v") ||
                videoUrl.split("/").pop() ||
                "";
            const renderConfig = {
                fps: 30,
                resolution:
                    layoutMode === "landscape" ? "1920x1080" : "1080x1920",
                audio: {
                    normalize: true,
                },
            };
            const res = await fetch("/api/clips", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    source: {
                        videoId,
                        videoUrl,
                    },
                    clip: {
                        title,
                        startTime,
                        endTime,
                        duration: endTime - startTime,
                        layoutMode,
                    },
                    platforms: {
                        youtube: platforms.youtube
                            ? {
                                metadata: {
                                    title: youtubeConfig.title,
                                    description: youtubeConfig.description,
                                    visibility: youtubeConfig.visibility,
                                    madeForKids: youtubeConfig.madeForKids,
                                },
                            }
                            : null,
                        tiktok: platforms.tiktok
                            ? {
                                metadata: {
                                    caption: tiktokConfig.caption,
                                },
                            }
                            : null,
                    },
                    render: renderConfig,
                    workflow: workflowConfig,
                }),
            });

            if (!res.ok) throw new Error("Save failed");

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 5000);
        } catch (err) {
            console.error(err);
            alert("No se pudo guardar el clip.");
        } finally {
            setIsSaving(false);
        }
    };


    const clipDuration = endTime - startTime;
    const isTooLong = clipDuration > 60;

    const cycleLayoutMode = () => {
        const modes: ('landscape' | 'portrait-crop' | 'portrait-fit')[] = ['landscape', 'portrait-crop', 'portrait-fit'];
        const currentIndex = modes.indexOf(layoutMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        setLayoutMode(modes[nextIndex]);
    };

    const getLayoutLabel = () => {
        switch (layoutMode) {
            case 'landscape': return 'Horizontal';
            case 'portrait-crop': return 'Vertical Zoom';
            case 'portrait-fit': return 'Vertical Fit';
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-white">Editor de Clips</h2>
                    <p className="text-gray-400 mt-2">Ajusta el tiempo y el encuadre para tus Shorts y TikToks.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={cycleLayoutMode}
                        className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold transition-all border bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                        <Smartphone size={18} className={layoutMode !== 'landscape' ? 'text-primary' : ''} />
                        <span>Formato: {getLayoutLabel()}</span>
                    </button>
                    <button
                        disabled={isSaving || isTooLong || !hasUrl}
                        onClick={handleSave}
                        className={`flex items-center space-x-2 px-8 py-3 rounded-2xl font-bold transition-all ${isTooLong || !hasUrl ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10' : 'bg-primary text-white hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] active:scale-95'}`}
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={20} />
                        )}
                        <span>{isSaving ? 'Guardando...' : 'Crear Short'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="relative group flex justify-center">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-[34px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                        <div className={`transition-all duration-500 ease-in-out shadow-2xl ${layoutMode !== 'landscape' ? 'aspect-[9/16] w-[320px]' : 'aspect-video w-full max-w-[720px]'}`}>
                            <VideoPlayer
                                url={videoUrl}
                                startTime={startTime}
                                endTime={endTime}
                                onDuration={setDuration}
                                layoutMode={layoutMode}
                            />
                        </div>
                    </div>

                    <div className="glass p-6 rounded-[32px] border-white/10 bg-black/40">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <Scissors size={20} className="text-primary" />
                                </div>
                                <span className="font-bold text-xl text-white">Ajuste de Tiempo</span>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-sm font-bold font-mono border ${isTooLong ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                {clipDuration.toFixed(1)}s / 60s
                            </div>
                        </div>

                        <Timeline
                            duration={duration}
                            startTime={startTime}
                            endTime={endTime}
                            onChange={(s, e) => {
                                setStartTime(s);
                                setEndTime(e);
                            }}
                        />

                        <div className="grid grid-cols-3 gap-4 mt-8">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Punto de Inicio</span>
                                <span className="text-lg font-mono font-bold text-white">{new Date(startTime * 1000).toISOString().substr(14, 5)}</span>
                            </div>
                            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                                <span className="text-[10px] uppercase tracking-wider text-primary/60 block mb-1">Duración Total</span>
                                <span className="text-lg font-mono font-bold text-primary">{clipDuration.toFixed(1)}s</span>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Punto Final</span>
                                <span className="text-lg font-mono font-bold text-white">{new Date(endTime * 1000).toISOString().substr(14, 5)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass p-8 rounded-[32px] space-y-8 sticky top-8">
                        <div>
                            <label className="text-sm font-bold text-high-contrast block mb-3 uppercase tracking-widest">Información del Clip</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white placeholder:text-gray-600 text-lg font-medium"
                                placeholder="Título llamativo..."
                            />
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-description opacity-60">Destinos de Publicación</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#FF0000]/20 flex items-center justify-center">
                                            <Youtube size={20} className="text-[#FF0000]" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-white block">YouTube Shorts</span>
                                            <span className="text-[10px] text-description uppercase tracking-wider">9:16 Optimizado</span>
                                        </div>
                                    </div>
                                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <Check size={14} className="text-green-500" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .8.11V9.42a7.27 7.27 0 0 0-10.23 6.51 7.28 7.28 0 0 0 14.15 1.6V7.06a8.29 8.29 0 0 0 5.39 1.61V5.2a4.27 4.27 0 0 1-3.77-2.76z" /></svg>
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-white block">TikTok</span>
                                            <span className="text-[10px] text-description uppercase tracking-wider">Full Screen</span>
                                        </div>
                                    </div>
                                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <Check size={14} className="text-green-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-gradient-to-br from-primary/15 to-purple-600/5 rounded-[24px] border border-primary/20">
                            <h4 className="font-bold flex items-center space-x-2 mb-2 text-primary text-sm tracking-wide">
                                <Smartphone size={16} />
                                <span>Edición Inteligente</span>
                            </h4>
                            <p className="text-xs text-description leading-relaxed italic">
                                &quot;Estamos analizando el encuadre para que el sujeto siempre esté en el centro.&quot;
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-10 right-10 bg-green-500 text-white p-6 rounded-[24px] shadow-[0_20px_50px_rgba(34,197,94,0.3)] z-50 flex items-center space-x-4 border border-white/20"
                    >
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <Check size={28} />
                        </div>
                        <div>
                            <p className="font-extrabold text-lg">¡Clip Procesando!</p>
                            <p className="text-sm opacity-90">Te notificaremos cuando esté listo para publicar.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function EditorPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div></div>}>
            <EditorContent />
        </Suspense>
    );
}

