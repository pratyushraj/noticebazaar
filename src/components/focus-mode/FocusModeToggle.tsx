"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Focus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FocusModeToggleProps {
  onToggle: (enabled: boolean) => void;
}

const FocusModeToggle: React.FC<FocusModeToggleProps> = ({ onToggle }) => {
  const [isEnabled, setIsEnabled] = useState(() => {
    return localStorage.getItem('focus_mode_enabled') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('focus_mode_enabled', isEnabled.toString());
    onToggle(isEnabled);
  }, [isEnabled, onToggle]);

  return (
    <Button
      onClick={() => setIsEnabled(!isEnabled)}
      variant="outline"
      size="sm"
      className={cn(
        "bg-white/5 border-white/10 text-white hover:bg-white/10",
        isEnabled && "bg-blue-500/20 border-blue-500/30 text-blue-400"
      )}
      aria-label={isEnabled ? "Disable focus mode" : "Enable focus mode"}
    >
      {isEnabled ? (
        <>
          <X className="w-4 h-4 mr-2" />
          Exit Focus
        </>
      ) : (
        <>
          <Focus className="w-4 h-4 mr-2" />
          Focus Mode
        </>
      )}
    </Button>
  );
};

export default FocusModeToggle;

