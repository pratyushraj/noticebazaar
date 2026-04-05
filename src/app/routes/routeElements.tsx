import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/ui/error-boundary";

const RouteFallback = () => (
  <div className="min-h-[45vh] flex items-center justify-center px-4">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      Loading page...
    </div>
  </div>
);

export const LazyRoute = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary variant="inline">
    <Suspense fallback={<RouteFallback />}>{children}</Suspense>
  </ErrorBoundary>
);
