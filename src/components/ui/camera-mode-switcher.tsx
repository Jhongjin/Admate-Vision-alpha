"use client";

import React from "react";
import { cn } from "@/lib/utils";


interface CameraModeSwitcherProps {
    currentMode: "location" | "ad";
    onChangeMode: (mode: "location" | "ad") => void;
    className?: string;
}

export function CameraModeSwitcher({
    currentMode,
    onChangeMode,
    className,
}: CameraModeSwitcherProps) {
    return (
        <div className={cn("relative flex items-center justify-center h-10", className)}>
            <div className="flex items-center gap-6">
                <button
                    onClick={() => onChangeMode("location")}
                    className={cn(
                        "text-sm font-medium transition-colors duration-200 z-10 px-2 py-1",
                        currentMode === "location" ? "text-yellow-400 font-bold drop-shadow-md" : "text-white/60 hover:text-white/90"
                    )}
                >
                    위치(역명)
                </button>
                <button
                    onClick={() => onChangeMode("ad")}
                    className={cn(
                        "text-sm font-medium transition-colors duration-200 z-10 px-2 py-1",
                        currentMode === "ad" ? "text-yellow-400 font-bold drop-shadow-md" : "text-white/60 hover:text-white/90"
                    )}
                >
                    광고 촬영
                </button>
            </div>

            {/* Active Indicator (Optional - simplistic text highlight used above instead for better visibility on camera overlay) */}
            {/* If you want a sliding pill background, uncomment below:
      <motion.div
        className="absolute h-full bg-white/10 rounded-full -z-0"
        layoutId="camera-mode-pill"
        initial={false}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          width: currentMode === 'location' ? '80px' : '70px',
          left: currentMode === 'location' ? '0' : '90px' 
        }}
      /> 
      */}
        </div>
    );
}
