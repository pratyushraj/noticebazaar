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
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem('sound_effects_enabled', enabled.toString());
  }, [enabled]);

  useEffect(() => {
    localStorage.setItem('sound_effects_volume', volume.toString());
  }, [volume]);

  const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!Ctx) return null;
    if (!audioContextRef.current) audioContextRef.current = new Ctx();
    return audioContextRef.current;
  };

  // CSP-safe fallback: generate a quick tone using WebAudio (no media/data: URL fetch).
  const playTone = (soundId: string) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(Math.max(0.0001, Math.min(0.8, volume)), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      gain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(soundId === 'whoosh' ? 220 : 660, now);
      if (soundId === 'whoosh') {
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);
      }
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // no-op
    }
  };

  const playSound = (soundId: string) => {
    if (!enabled) return;

    const soundUrl = soundEffects[soundId];
    if (!soundUrl) return;

    // Avoid CSP violations from `data:` media URLs (common in strict CSP builds).
    if (soundUrl.startsWith('data:audio/')) {
      playTone(soundId);
      return;
    }

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
