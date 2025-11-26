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
        "relative inline-flex items-center gap-1 p-1 bg-white/[0.08] backdrop-blur-[30px] saturate-[150%] rounded-[20px] border border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.15)]",
        className
      )}
      role="tablist"
    >
      {/* Animated background indicator */}
      <div
        className="absolute top-1 bottom-1 bg-white/[0.15] backdrop-blur-[20px] rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300 ease-out"
        style={{
          left: `${(activeIndex * 100) / options.length + 2}%`,
          width: `${100 / options.length - 4}%`,
        }}
      />

      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative z-10 flex-1 px-4 py-2.5 rounded-[16px] text-sm font-semibold transition-all duration-200 min-w-0",
              isActive
                ? "text-white"
                : "text-white/70 hover:text-white/90"
            )}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${option.id}`}
          >
            <span className="flex items-center justify-center gap-1.5 whitespace-nowrap">
              {option.label}
              {option.count !== undefined && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center",
                    isActive
                      ? "bg-white/20 text-white"
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

