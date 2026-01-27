import Link from "next/link";
import { Scissors, Youtube, Share, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/20 blur-[120px] rounded-full opacity-20" />

        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-8">
            <Zap size={16} className="text-primary fill-primary" />
            <span className="text-sm font-medium">Revoluciona tu contenido</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8">
            De Video Largo a <br />
            <span className="gradient-text tracking-tighter">Engagement Infinito</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            La herramienta definitiva para creadores. Extrae los mejores momentos de tus videos de YouTube y conviértelos en Shorts y TikToks listos para viralizar.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-8 py-4 bg-primary text-white rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 transform hover:-translate-y-1 w-full md:w-auto"
            >
              Comenzar gratis
            </Link>
            <Link
              href="#demo"
              className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all duration-300 w-full md:w-auto"
            >
              Ver demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 border-t border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Youtube}
              title="Importación Directa"
              description="Conecta tu canal de YouTube y selecciona cualquier video de tu biblioteca instantáneamente."
            />
            <FeatureCard
              icon={Scissors}
              title="Editor de Clips Pro"
              description="Selecciona los mejores momentos con precisión de milisegundo y formato 9:16 automático."
            />
            <FeatureCard
              icon={Share}
              title="Multi-Posting"
              description="Sube a YouTube Shorts y TikTok simultáneamente desde una sola interfaz."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <div className="glass p-8 rounded-3xl hover:border-primary/50 transition-colors duration-300 group">
      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        <Icon className="text-primary" size={24} />
      </div>
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
