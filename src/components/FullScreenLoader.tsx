"use client";

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MadeWithDyad } from '@/components/made-with-dyad';

interface FullScreenLoaderProps {
  message?: string;
  secondaryMessage?: string;
}

export const FullScreenLoader = ({
  message = 'Loading your workspace...',
  secondaryMessage,
}: FullScreenLoaderProps) => {
  return (
    <div className="nb-screen-height flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 px-4">
      <Loader2 className={cn('h-12 w-12 animate-spin text-purple-400')} />
      <p className="mt-4 text-lg text-white/90 text-center">
        {message}
      </p>
      {secondaryMessage && (
        <p className="mt-2 text-sm text-white/70 text-center max-w-md">
          {secondaryMessage}
        </p>
      )}
      <div className="mt-8">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default FullScreenLoader;


