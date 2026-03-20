"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Send, Copy, Share2, DollarSign } from 'lucide-react';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { useNativeShare } from '@/hooks/useNativeShare';
import { toast } from 'sonner';

interface LongPressMenuItem {
  label: string;
  icon: React.ElementType;
  action: () => void;
  color?: string;
}

interface LongPressMenuProps {
  children: React.ReactNode;
  items: LongPressMenuItem[];
  onLongPress?: () => void;
}

const LongPressMenu: React.FC<LongPressMenuProps> = ({
  children,
  items,
  onLongPress,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const { share } = useNativeShare();

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      triggerHaptic(HapticPatterns.heavy);
      setMenuPosition({ x: touch.clientX, y: touch.clientY });
      setShowMenu(true);
      onLongPress?.();
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    longPressTimer.current = setTimeout(() => {
      triggerHaptic(HapticPatterns.heavy);
      setMenuPosition({ x: e.clientX, y: e.clientY });
      setShowMenu(true);
      onLongPress?.();
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const handleItemClick = (item: LongPressMenuItem) => {
    triggerHaptic(HapticPatterns.medium);
    item.action();
    setShowMenu(false);
  };

  return (
    <>
      <div
        ref={elementRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {children}
      </div>

      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: menuPosition.y - 20 }}
              animate={{ opacity: 1, scale: 1, y: menuPosition.y - 20 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed z-[201] bg-[#0B0F1A] backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-2 min-w-[200px]"
              style={{ left: menuPosition.x - 100, top: menuPosition.y - 20 }}
            >
              {items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleItemClick(item)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                  >
                    <Icon className={`w-5 h-5 ${item.color || 'text-white/70'}`} />
                    <span className="text-sm font-medium text-white">{item.label}</span>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default LongPressMenu;

