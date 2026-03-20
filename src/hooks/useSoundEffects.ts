import { useState, useEffect, useRef } from 'react';

interface SoundEffect {
  id: string;
  url: string;
}

const soundEffects: Record<string, string> = {
  'cha-ching': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77+efTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBlou+/nn00QDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC', // Placeholder - you'd use actual audio files
  'whoosh': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77+efTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBlou+/nn00QDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC',
};

export const useSoundEffects = () => {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem('sound_effects_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('sound_effects_volume');
    return saved ? parseFloat(saved) : 0.3;
  });
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    localStorage.setItem('sound_effects_enabled', enabled.toString());
  }, [enabled]);

  useEffect(() => {
    localStorage.setItem('sound_effects_volume', volume.toString());
  }, [volume]);

  const playSound = (soundId: string) => {
    if (!enabled) return;

    const soundUrl = soundEffects[soundId];
    if (!soundUrl) return;

    // Create audio element if it doesn't exist
    if (!audioRefs.current[soundId]) {
      const audio = new Audio(soundUrl);
      audio.volume = volume;
      audioRefs.current[soundId] = audio;
    }

    const audio = audioRefs.current[soundId];
    audio.volume = volume;
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Silently fail if audio can't play (e.g., user interaction required)
    });
  };

  return {
    enabled,
    setEnabled,
    volume,
    setVolume,
    playSound,
  };
};

