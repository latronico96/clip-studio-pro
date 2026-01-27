"use client";

import { signIn } from "next-auth/react";
import { Youtube, Mail } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-primary/20 blur-[100px] rounded-full opacity-30" />

            <div className="glass w-full max-w-md p-10 rounded-[32px] relative z-10 text-center border-white/5">
                <h2 className="text-3xl font-bold mb-2">Bienvenido</h2>
                <p className="text-muted-foreground mb-10">Conecta tu cuenta para empezar a crear clips</p>

                <div className="space-y-4">
                    <button
                        onClick={() => signIn("google", { callbackUrl: "/videos" })}
                        className="w-full flex items-center justify-center space-x-3 bg-[#EE3F3E] hover:bg-[#D43736] text-white p-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg shadow-red-500/20"
                    >
                        <Youtube size={24} />
                        <span>Continuar con YouTube</span>
                    </button>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-black/50 px-2 text-muted-foreground backdrop-blur-md">O</span>
                        </div>
                    </div>

                    <button
                        onClick={() => signIn("google")}
                        className="w-full flex items-center justify-center space-x-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white p-4 rounded-2xl font-semibold transition-all duration-300"
                    >
                        <Mail size={20} />
                        <span>Usar Correo Electrónico</span>
                    </button>
                </div>

                <p className="mt-10 text-xs text-muted-foreground leading-relaxed">
                    Al continuar, aceptas nuestros
                    <a href="#" className="underline mx-1 hover:text-white">Términos de Servicio</a> y
                    <a href="#" className="underline mx-1 hover:text-white">Política de Privacidad</a>.
                </p>
            </div>
        </div>
    );
}
