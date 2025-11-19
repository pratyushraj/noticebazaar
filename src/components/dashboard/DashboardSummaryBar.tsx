"use client";

import { IndianRupee, Calendar, AlertTriangle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DashboardSummaryBarProps {
  earnings?: number;
  deadlines?: number;
  urgent?: number;
  earningsChange?: number;
  className?: string;
}

export function DashboardSummaryBar({
  earnings,
  deadlines,
  urgent,
  earningsChange,
  className,
}: DashboardSummaryBarProps) {
  const stats = [
    {
      icon: IndianRupee,
      label: "Earned",
      value: earnings !== undefined ? `₹${(earnings / 1000).toFixed(1)}K` : "—",
      change: earningsChange,
      color: "text-emerald-400",
    },
    {
      icon: Calendar,
      label: "Deadlines",
      value: deadlines?.toString() || "0",
      color: "text-blue-400",
    },
    {
      icon: AlertTriangle,
      label: "Urgent",
      value: urgent?.toString() || "0",
      color: urgent && urgent > 0 ? "text-red-400" : "text-white/40",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative rounded-[14px] bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-xl border border-white/10 shadow-inner",
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent pointer-events-none opacity-50 rounded-[14px]" />
      
      <div className="relative z-10 flex items-center gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 overflow-x-auto scrollbar-hide">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0"
            >
              <div className={cn(
                "h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-sm border",
                stat.color === "text-emerald-400" && "bg-emerald-500/20 border-emerald-500/30",
                stat.color === "text-blue-400" && "bg-blue-500/20 border-blue-500/30",
                stat.color === "text-red-400" && "bg-red-500/20 border-red-500/30",
                stat.color === "text-white/40" && "bg-white/5 border-white/10"
              )}>
                <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", stat.color)} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
                  <span className="text-base sm:text-lg font-bold text-white tracking-tight whitespace-nowrap tabular-nums">
                    {stat.value}
                  </span>
                  {stat.change !== undefined && stat.change > 0 && (
                    <span className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold flex items-center gap-0.5 shrink-0 px-1 sm:px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 whitespace-nowrap">
                      <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      {Math.abs(stat.change)}%
                    </span>
                  )}
                </div>
                <span className="text-[10px] sm:text-[11px] text-white/60 font-medium uppercase tracking-wide whitespace-nowrap">{stat.label}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </motion.div>
  );
}

