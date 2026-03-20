/**
 * Swipeable Page Wrapper
 * Adds swipe-right to go back and swipe-up to close gestures
 */

import { ReactNode } from 'react';
import { useSwipeGesture, useSwipeBack } from '@/lib/utils/navigation-gestures';
import { useNavigate } from 'react-router-dom';

interface SwipeablePageProps {
  children: ReactNode;
  onSwipeUp?: () => void;
  enableSwipeBack?: boolean;
}

export const SwipeablePage: React.FC<SwipeablePageProps> = ({
  children,
  onSwipeUp,
  enableSwipeBack = true,
}) => {
  const navigate = useNavigate();
  const swipeBack = useSwipeBack(enableSwipeBack);
  
  const swipeGestures = useSwipeGesture({
    onSwipeRight: () => {
      if (enableSwipeBack) {
        navigate(-1);
      }
    },
    onSwipeUp: onSwipeUp,
  });

  return (
    <div
      {...swipeGestures}
      className="min-h-full w-full"
      style={{
        touchAction: 'pan-y pan-x',
      }}
    >
      {children}
    </div>
  );
};

