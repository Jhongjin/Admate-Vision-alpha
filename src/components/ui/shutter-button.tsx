"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ShutterButtonProps {
    onClick: () => void;
    disabled?: boolean;
    isProcessing?: boolean;
    className?: string;
}

export function ShutterButton({ onClick, disabled, isProcessing, className }: ShutterButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || isProcessing}
            className={cn(
                "relative rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100",
                "w-20 h-20 sm:w-24 sm:h-24", // Responsive sizing
                className
            )}
            aria-label="Take photo"
        >
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full border-[4px] border-white" />

            {/* Inner Circle (The actual button) */}
            <div
                className={cn(
                    "w-[66px] h-[66px] sm:w-[80px] sm:h-[80px] bg-white rounded-full shadow-lg transition-transform",
                    isProcessing ? "scale-90 opacity-80" : "scale-100"
                )}
            >
                {isProcessing && (
                    <Loader2 className="w-8 h-8 text-slate-400 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
            </div>
        </button>
    );
}
