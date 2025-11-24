import confetti from 'canvas-confetti';

/**
 * Trigger confetti burst on key actions
 */
export function triggerConfetti(options?: {
  type?: 'success' | 'celebration' | 'burst';
  colors?: string[];
}) {
  const { type = 'success', colors } = options || {};

  const defaultColors = {
    success: ['#10b981', '#34d399', '#6ee7b7'],
    celebration: ['#a855f7', '#c084fc', '#e879f9', '#f472b6'],
    burst: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'],
  };

  const confettiColors = colors || defaultColors[type];

  if (type === 'burst') {
    // Multiple bursts
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: confettiColors,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  } else {
    // Single burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: confettiColors,
    });
  }
}

