import { useMemo } from "react";
import { motion } from "framer-motion";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export function Sparkline({
  data,
  width = 60,
  height = 20,
  color = "rgb(34, 197, 94)",
  strokeWidth = 1.5,
  className,
}: SparklineProps) {
  const path = useMemo(() => {
    if (!data || data.length === 0) return "";

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1 || 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  }, [data, width, height]);

  if (!data || data.length === 0) {
    return (
      <div
        className={`h-[${height}px] w-[${width}px] bg-white/5 rounded`}
        style={{ width, height }}
      />
    );
  }

  return (
    <div className={className} style={{ width, height }}>
      <svg width={width} height={height} className="overflow-visible">
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}

