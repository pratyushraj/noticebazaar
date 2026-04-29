/**
 * Global query loading bar — shows a thin animated bar at the top
 * when any React Query is fetching.
 * 
 * Uses opacity transition instead of conditional rendering to avoid
 * "removeChild" errors during rapid unmount/remount cycles in React 18.
 */
import { useIsFetching } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export function GlobalLoadingBar() {
  // Only show the bar for queries that are NOT marked as silent
  const isFetching = useIsFetching({
    predicate: (query) => {
      // If query is fetching and not explicitly marked silent
      return query.state.fetchStatus === 'fetching' && !query.meta?.silent;
    }
  });

  return (
    <div 
      className={cn(
        "fixed top-0 left-0 right-0 z-[9999] h-[2px] overflow-hidden bg-primary/10 transition-opacity duration-300 pointer-events-none",
        isFetching > 0 ? "opacity-100" : "opacity-0"
      )}
    >
      <div
        className="h-full bg-primary animate-loading-bar"
        style={{
          width: '40%',
        }}
      />
    </div>
  );
}
