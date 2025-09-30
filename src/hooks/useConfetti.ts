import { useState, useRef } from 'react';

interface Confetti {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

export const useConfetti = () => {
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const animationRef = useRef<number>(0);

  const createConfetti = () => {
    const newConfetti: Confetti[] = [];
    for (let i = 0; i < 50; i++) {
      newConfetti.push({
        id: `confetti-${i}`,
        x: Math.random() * window.innerWidth,
        y: -10,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2 + 2,
        color: Math.random() > 0.5 ? '#ec4899' : '#d946ef',
        size: Math.random() * 8 + 4
      });
    }
    setConfetti(newConfetti);
    
    const animate = () => {
      setConfetti(prev => prev.map(c => ({
        ...c,
        x: c.x + c.vx,
        y: c.y + c.vy,
        vy: c.vy + 0.1
      })).filter(c => c.y < window.innerHeight));
      
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  const stopConfetti = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setConfetti([]);
  };

  return {
    confetti,
    createConfetti,
    stopConfetti
  };
};