"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DataFreshnessIndicatorProps {
  lastUpdated?: Date;
  onRefresh?: () => void;
  autoRefreshInterval?: number; // in milliseconds
  className?: string;
}

export function DataFreshnessIndicator({
  lastUpdated,
  onRefresh,
  autoRefreshInterval = 30000, // 30 seconds
  className,
}: DataFreshnessIndicatorProps) {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      if (!lastUpdated) return;

      const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      if (seconds < 30) {
        setTimeSinceUpdate("Just now");
      } else if (seconds < 60) {
        setTimeSinceUpdate(`${seconds}s ago`);
      } else {
        const minutes = Math.floor(seconds / 60);
        setTimeSinceUpdate(`${minutes}m ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 5000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  const isStale = lastUpdated
    ? Date.now() - lastUpdated.getTime() > 60000 // 1 minute
    : false;

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {isStale ? (
          <motion.button
            key="refresh"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-[11px] text-white/60 hover:text-white/80"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh</span>
          </motion.button>
        ) : (
          <motion.div
            key="fresh"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-white/40"
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>{timeSinceUpdate || "Live"}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

