import React, { useEffect, useState, useRef } from 'react';

export const LuxuryCursorEffect: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);

  useEffect(() => {
    // Strictly disable on mobile/touch devices
    if (
      typeof window === 'undefined' ||
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(hover: none)').matches ||
      ('ontouchstart' in window && window.innerWidth < 1024)
    ) {
      return;
    }

    let rafId: number | null = null;
    let latestX = -100;
    let latestY = -100;

    const handleMouseMove = (e: MouseEvent) => {
      latestX = e.clientX;
      latestY = e.clientY;

      if (!visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }

      if (rafId === null) {
        rafId = window.requestAnimationFrame(() => {
          setPos({ x: latestX, y: latestY });
          rafId = null;
        });
      }
    };

    const handleMouseLeave = () => {
      visibleRef.current = false;
      setVisible(false);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {/* Soft Ambient Spotlight Halo */}
      <div
        className="absolute w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-blue-500/10 via-amber-400/5 to-cyan-400/10 blur-[100px] transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${pos.x - 225}px, ${pos.y - 225}px, 0)`,
        }}
      />

      {/* Micro Cursor Ring */}
      <div
        className="absolute w-8 h-8 rounded-full border border-blue-400/40 transition-transform duration-75 ease-out shadow-[0_0_15px_rgba(59,130,246,0.3)]"
        style={{
          transform: `translate3d(${pos.x - 16}px, ${pos.y - 16}px, 0)`,
        }}
      />
    </div>
  );
};
