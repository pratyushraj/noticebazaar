import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/ui/error-boundary";

const RouteFallback = () => (
  <div className="min-h-[100dvh] flex items-center justify-center">
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <span className="text-[11px] font-black text-white/20 tracking-[0.3em] uppercase"></span>
    </div>
  </div>
);

export const LazyRoute = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary variant="inline">
    <Suspense fallback={<RouteFallback />}>{children}</Suspense>
  </ErrorBoundary>
);
