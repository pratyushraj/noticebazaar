/**
 * Global query loading bar — shows a thin animated bar at the top
 * when any React Query is fetching.
 */
import { useIsFetching } from '@tanstack/react-query';

export function GlobalLoadingBar() {
  const isFetching = useIsFetching();

  if (!isFetching) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px] overflow-hidden">
      <div
        className="h-full bg-emerald-500 animate-loading-bar"
        style={{
          width: '40%',
          animation: 'loading-slide 1.5s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes loading-slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
