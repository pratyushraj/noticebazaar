"use client";

import clsx from 'clsx';
import { Calculator, Scale } from 'lucide-react';

type AdvisorModeSwitchProps = {
  mode: "ca" | "advisor";
  onToggle: () => void;
};

export const AdvisorModeSwitch = ({ mode, onToggle }: AdvisorModeSwitchProps) => {
  return (
    <div className="relative inline-flex items-center p-1 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
      {/* Sliding indicator */}
      <div
        className={clsx(
          "absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out",
          "bg-gradient-to-r border shadow-sm",
          mode === "ca" 
            ? "left-1 right-1/2 bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-blue-400/40 shadow-[0_0_8px_rgba(59,130,246,0.2)]"
            : "left-1/2 right-1 bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-400/40 shadow-[0_0_8px_rgba(168,85,247,0.2)]"
        )}
      />
      
      {/* CA Button */}
      <button
        onClick={mode !== "ca" ? onToggle : undefined}
        disabled={mode === "ca"}
        className={clsx(
          "relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-transparent",
          mode === "ca"
            ? "text-white cursor-default"
            : "text-white/60 hover:text-white/80 cursor-pointer active:scale-95"
        )}
        aria-label="Switch to Chartered Accountant"
      >
        <Calculator className="w-3.5 h-3.5" />
        <span>CA</span>
      </button>
      
      {/* Legal Advisor Button */}
      <button
        onClick={mode !== "advisor" ? onToggle : undefined}
        disabled={mode === "advisor"}
        className={clsx(
          "relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-transparent",
          mode === "advisor"
            ? "text-white cursor-default"
            : "text-white/60 hover:text-white/80 cursor-pointer active:scale-95"
        )}
        aria-label="Switch to Legal Advisor"
      >
        <Scale className="w-3.5 h-3.5" />
        <span>Legal</span>
      </button>
    </div>
  );
};

