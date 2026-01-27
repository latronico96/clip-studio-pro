"use client";

import { useRef } from "react";
import { Scissors } from "lucide-react";

interface TimelineProps {
    duration: number;
    startTime: number;
    endTime: number;
    onChange: (start: number, end: number) => void;
}

const WAVEFORM_DATA = [40, 60, 30, 80, 50, 40, 70, 45, 90, 35, 65, 85, 20, 55, 75, 40, 60, 30, 80, 50, 40, 70, 45, 90, 35, 65, 85, 20, 55, 75, 44, 55, 66, 77, 88, 99, 33, 22, 11, 45];

export function Timeline({ duration, startTime, endTime, onChange }: TimelineProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startPercentage = (startTime / (duration || 1)) * 100;
    const endPercentage = (endTime / (duration || 1)) * 100;

    return (
        <div className="space-y-6 bg-white/5 p-8 rounded-[32px] border border-white/10">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <Scissors size={18} className="text-primary" />
                    <span className="font-bold text-lg">Ajustar Clip</span>
                </div>
                <div className="text-sm font-mono bg-white/10 px-3 py-1 rounded-lg">
                    Duración: <span className="text-primary font-bold">{(endTime - startTime).toFixed(1)}s</span>
                </div>
            </div>

            <div
                ref={containerRef}
                className="relative h-20 bg-white/5 rounded-2xl overflow-hidden cursor-pointer group"
            >
                {/* Visual Waveform */}
                <div className="absolute inset-0 flex items-center justify-around px-4 opacity-20 group-hover:opacity-30 transition-opacity">
                    {WAVEFORM_DATA.map((h, i) => (
                        <div
                            key={i}
                            className="w-1 bg-white rounded-full"
                            style={{ height: `${h}%` }}
                        />
                    ))}
                </div>

                {/* Selected Range Overlay */}
                <div
                    className="absolute h-full bg-primary/20 border-x-4 border-primary z-10"
                    style={{
                        left: `${startPercentage}%`,
                        width: `${endPercentage - startPercentage}%`
                    }}
                >
                    <div className="absolute inset-0 bg-primary/10 animate-pulse" />
                </div>

                {/* Drag Handles */}
                <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={startTime}
                    onChange={(e) => onChange(parseFloat(e.target.value), endTime)}
                    className="absolute top-0 w-full h-1/2 opacity-0 cursor-ew-resize z-20"
                />
                <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={endTime}
                    onChange={(e) => onChange(startTime, parseFloat(e.target.value))}
                    className="absolute bottom-0 w-full h-1/2 opacity-0 cursor-ew-resize z-20"
                />
            </div>

            <div className="flex justify-between text-[11px] text-description font-mono tracking-tighter opacity-80">
                <span>00:00</span>
                <span className="text-primary font-bold">{formatTime(startTime)}</span>
                <span className="text-secondary-foreground font-bold">{formatTime(endTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>
    );
}
