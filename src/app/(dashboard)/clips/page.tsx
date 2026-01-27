"use client";

import { useEffect, useState } from "react";
import { ClipCard } from "@/components/ClipCard";
import { Clip } from "@/types/clip";
import { motion } from "framer-motion";
import { Loader2, PlusCircle, Video } from "lucide-react";
import Link from "next/link";

export default function ClipsPage() {
    const [clips, setClips] = useState<Clip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClips = async () => {
            try {
                const res = await fetch("/api/clips");
                if (!res.ok) throw new Error("Failed");
                const data = await res.json();
                setClips(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchClips();

        // Poll for updates if there are clips in progress
        const interval = setInterval(() => {
            const hasIncomplete = clips.some(c => c.status === "pending" || c.status === "processing");
            if (hasIncomplete || clips.length === 0) {
                fetchClips();
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [clips.length]); // Poll if length changes or logic decides


    return (
        <div className="space-y-10 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-extrabold text-white tracking-tight">Mis Clips</h2>
                    <p className="text-gray-400 mt-2">Gestiona tus mejores momentos y sigue el estado de tus publicaciones.</p>
                </div>

                <Link
                    href="/videos"
                    className="flex items-center space-x-2 bg-primary/10 text-primary border border-primary/20 px-6 py-3 rounded-2xl font-bold hover:bg-primary hover:text-white transition-all"
                >
                    <PlusCircle size={20} />
                    <span>Nuevo Clip</span>
                </Link>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="animate-spin text-primary mb-4" size={48} />
                    <p className="text-gray-500 font-medium">Buscando tus clips...</p>
                </div>
            ) : clips.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {clips.map((clip, index) => (
                        <motion.div
                            key={clip.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <ClipCard clip={clip} />
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="glass p-16 rounded-[40px] border-white/5 bg-white/[0.02] text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <Video size={32} className="text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No tienes clips todavía</h3>
                    <p className="text-gray-400 max-w-sm mb-8">
                        Empieza por seleccionar uno de tus videos de YouTube y elige los mejores momentos.
                    </p>
                    <Link
                        href="/videos"
                        className="bg-primary text-white px-10 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-primary/25"
                    >
                        Ver mis videos
                    </Link>
                </div>
            )}
        </div>
    );
}

