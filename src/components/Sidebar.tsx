"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Video,
    Scissors,
    Layers,
    Share2,
    Settings,
    LogOut,
    LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/videos" },
    { icon: Scissors, label: "Editor", href: "/editor" },
    { icon: Layers, label: "Clips", href: "/clips" },
    { icon: Share2, label: "Publicaciones", href: "/publicaciones" },
    { icon: Settings, label: "Conectar TikTok", href: "/api/tiktok/login" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 h-screen glass border-r border-white/10 flex flex-col p-6 fixed left-0 top-0">
            <div className="mb-10">
                <h1 className="text-2xl font-bold gradient-text">ClipStudio Pro</h1>
            </div>

            <nav className="flex-1 space-y-3">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center space-x-3 p-4 rounded-2xl transition-all duration-300 group",
                                isActive
                                    ? "bg-primary text-white shadow-[0_10px_25px_-5px_rgba(124,58,237,0.4)]"
                                    : "text-description hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon size={22} className={cn("transition-transform duration-300", !isActive && "group-hover:scale-110")} />
                            <span className="font-bold tracking-tight">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto pt-6 border-t border-white/5">
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center space-x-3 p-4 w-full rounded-2xl text-description hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group"
                >
                    <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold tracking-tight">Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
}
