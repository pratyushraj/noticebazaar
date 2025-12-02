"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SegmentedControlProps {
  options: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  className,
}) => {
  const activeIndex = options.findIndex((opt) => opt.id === value);

  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-0.5 md:gap-1 p-0.5 md:p-1 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.45)] before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/10 before:to-transparent before:rounded-2xl before:pointer-events-none after:absolute after:-inset-1 after:bg-white/5 after:blur-xl after:rounded-3xl after:pointer-events-none",
        className
      )}
      role="tablist"
    >
      {/* Animated background indicator */}
      <div
        className="absolute top-0.5 bottom-0.5 md:top-1 md:bottom-1 bg-white/20 backdrop-blur-xl rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] transition-transform duration-300 ease-out"
        style={{
          left: `${(activeIndex * 100) / options.length + 1}%`,
          width: `${100 / options.length - 2}%`,
        }}
      />

      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative z-10 flex-1 px-1.5 py-1.5 md:px-3 md:py-2 rounded-xl transition-all duration-150 min-w-0 text-center",
              isActive
                ? "text-white"
                : "text-white/70 hover:text-white/90"
            )}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${option.id}`}
          >
            <span className="flex flex-row items-center gap-1.5 md:gap-2 w-full min-w-0 justify-center">
              <span className="leading-tight text-[10px] md:text-[12px] font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
                {option.label}
              </span>
              {option.count !== undefined && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[9px] md:text-[11px] font-semibold leading-none min-w-[18px] md:min-w-[22px] text-center flex-shrink-0",
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-white/10 text-white/60"
                  )}
                >
                  {option.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

