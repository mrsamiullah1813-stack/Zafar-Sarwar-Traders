import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Droplets, Layers, Paintbrush, Wrench, ShieldCheck } from 'lucide-react';

interface CinematicIntroProps {
  onComplete: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Accessibility: instantly complete if user prefers reduced motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onComplete();
      return;
    }

    // Sequence timer: 2.3s total presentation, then smooth 0.4s fade-out into main site
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2300);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2700);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="cinematic-intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => {
            setIsExiting(true);
            setTimeout(onComplete, 100);
          }}
          className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center overflow-hidden select-none cursor-pointer"
        >
          {/* Skip / Enter Showroom Button in top right */}
          <div className="absolute top-6 right-6 z-20">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExiting(true);
                setTimeout(onComplete, 50);
              }}
              className="px-4 py-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-bold tracking-wider uppercase transition-all backdrop-blur-md shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <span>Skip Intro</span>
              <span>&rarr;</span>
            </button>
          </div>
          {/* Ambient Showroom Radial Lighting */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Subtle overhead showroom spotlight beam */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.7, 0.5], scale: [0.8, 1.2, 1] }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[360px] sm:w-[900px] sm:h-[450px] bg-gradient-to-tr from-amber-500/20 via-blue-600/15 to-amber-300/15 rounded-full blur-[110px]"
            />
            
            {/* Elegant light sweep bar */}
            <motion.div
              initial={{ x: '-120%', opacity: 0 }}
              animate={{ x: '120%', opacity: [0, 0.4, 0] }}
              transition={{ duration: 1.8, delay: 0.3, ease: 'easeInOut' }}
              className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-amber-200/10 to-transparent skew-x-12"
            />
          </div>

          {/* Core Visual Content Container */}
          <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-2xl">
            
            {/* Brand Monogram Seal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.82, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6 relative"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-amber-500/40 p-0.5 shadow-[0_0_35px_rgba(245,158,11,0.25)] flex items-center justify-center relative group">
                {/* Subtle Inner Glow */}
                <div className="w-full h-full rounded-[14px] bg-slate-950/90 flex flex-col items-center justify-center">
                  <span className="font-serif font-black text-2xl sm:text-3xl tracking-wider bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-300 bg-clip-text text-transparent">
                    ZT
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Main Brand Typography */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-3"
            >
              <h1 className="text-3xl sm:text-5xl font-black font-serif tracking-tight text-white uppercase">
                Zafar Sarwar{' '}
                <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  Traders
                </span>
              </h1>

              {/* Tagline / Main Business Categories */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.6 }}
                className="flex items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-xs tracking-[0.2em] uppercase font-medium text-slate-300"
              >
                <span className="text-amber-400/90">Sanitaryware</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400/90">Building Materials</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400/90">Paints</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400/90">Plumbing</span>
              </motion.div>
            </motion.div>

            {/* Quick Category Icons Reveal (0.8s - 2.0s) */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.85 }}
              className="mt-8 flex items-center justify-center gap-4 sm:gap-6 text-slate-400"
            >
              <div className="flex items-center gap-1.5 text-[11px] tracking-wider text-slate-400">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline text-slate-400">Luxury Bath</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-700" />
              <div className="flex items-center gap-1.5 text-[11px] tracking-wider text-slate-400">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline text-slate-400">Master Grade</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-700" />
              <div className="flex items-center gap-1.5 text-[11px] tracking-wider text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline text-slate-400">Original Brands</span>
              </div>
            </motion.div>

            {/* Subtle Minimal Line Indicator */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1.4, delay: 0.5, ease: 'easeInOut' }}
              className="w-36 sm:w-48 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent mt-8"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
