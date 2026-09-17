import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Droplets, Layers, ShieldCheck } from 'lucide-react';

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

    // Sequence timer: 5.0s full presentation, then smooth 0.6s fade-out into main site (5.6s total)
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 5000);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 5600);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const handleSkip = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsExiting(true);
    setTimeout(onComplete, 350);
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="cinematic-intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, filter: 'blur(6px)' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center overflow-hidden select-none"
        >
          {/* Subtle Top-Right Skip Option */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="absolute top-5 right-5 sm:top-6 sm:right-6 z-20"
          >
            <button
              type="button"
              onClick={handleSkip}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-slate-900/70 hover:bg-slate-800/90 text-amber-300/80 hover:text-amber-200 border border-amber-500/20 hover:border-amber-500/40 text-[10px] sm:text-xs font-semibold tracking-widest uppercase transition-all backdrop-blur-md flex items-center gap-1.5 cursor-pointer shadow-sm"
              aria-label="Skip Intro"
            >
              <span>Skip</span>
              <span className="text-amber-400">&rarr;</span>
            </button>
          </motion.div>

          {/* Ambient Luxury Showroom Lighting */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Center radial warm ambient glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: [0, 0.6, 0.45], scale: [0.7, 1.15, 1.0] }}
              transition={{ duration: 3.5, ease: 'easeOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[320px] sm:w-[800px] sm:h-[480px] bg-gradient-to-tr from-amber-500/15 via-blue-600/10 to-amber-300/15 rounded-full blur-[120px]"
            />
            
            {/* Delicate cinematic light beam sweep */}
            <motion.div
              initial={{ x: '-150%', opacity: 0 }}
              animate={{ x: '150%', opacity: [0, 0.35, 0] }}
              transition={{ duration: 2.6, delay: 0.6, ease: 'easeInOut' }}
              className="absolute top-0 bottom-0 w-48 bg-gradient-to-r from-transparent via-amber-200/10 to-transparent skew-x-12"
            />
          </div>

          {/* Core Visual Presentation Container */}
          <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 max-w-2xl w-full">
            
            {/* Official ZST Brand Architectural Emblem Seal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6 relative"
            >
              <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-amber-500/40 p-1 shadow-[0_0_40px_rgba(245,158,11,0.22)] flex items-center justify-center relative">
                <div className="w-full h-full rounded-[14px] bg-[#030712] border border-amber-500/20 flex items-center justify-center p-2.5">
                  <svg
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]"
                    aria-hidden="true"
                  >
                    {/* Architectural Apex / Pediment */}
                    <path
                      d="M24 3.5L42 14.5V17L24 5.8L6 17V14.5L24 3.5Z"
                      fill="currentColor"
                    />
                    {/* Sanitary Water Droplet / Fixture Emblem */}
                    <path
                      d="M24 7.5C24 7.5 20.8 11.2 20.8 13.5C20.8 15.3 22.2 16.8 24 16.8C25.8 16.8 27.2 15.3 27.2 13.5C27.2 11.2 24 7.5 24 7.5Z"
                      fill="currentColor"
                      opacity="0.9"
                    />
                    {/* Architectural Side Pillars */}
                    <rect
                      x="6"
                      y="18.5"
                      width="3.5"
                      height="14"
                      rx="1"
                      fill="currentColor"
                      opacity="0.35"
                    />
                    <rect
                      x="38.5"
                      y="18.5"
                      width="3.5"
                      height="14"
                      rx="1"
                      fill="currentColor"
                      opacity="0.35"
                    />
                    {/* Prominent Large ZST Monogram */}
                    <text
                      x="24.5"
                      y="30.5"
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="13.5"
                      fontWeight="900"
                      letterSpacing="1.2px"
                      fontFamily="'Arial Black', 'Montserrat', 'Impact', 'Segoe UI Black', -apple-system, sans-serif"
                    >
                      ZST
                    </text>
                    {/* Structural Foundation Beam */}
                    <path
                      d="M5.5 36H42.5"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    {/* Sanitary Wave Flow Accent */}
                    <path
                      d="M12 40.5C16 39.2 20 41.8 24 40.5C28 39.2 32 41.8 36 40.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      opacity="0.75"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Main Brand Name */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-2.5"
            >
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-serif tracking-tight text-white uppercase">
                Zafar Sarwar{' '}
                <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  Traders
                </span>
              </h1>

              {/* Tagline / Business Categories */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.95 }}
                className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 text-[10px] sm:text-xs tracking-[0.2em] uppercase font-medium text-slate-300"
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

            {/* Subtle Brand Value Pills */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.3 }}
              className="mt-6 sm:mt-8 flex items-center justify-center gap-3 sm:gap-6 text-slate-400 text-[11px]"
            >
              <div className="flex items-center gap-1.5 text-slate-400">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span className="tracking-wide">Luxury Bath</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-700" />
              <div className="flex items-center gap-1.5 text-slate-400">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span className="tracking-wide">Master Grade</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-700" />
              <div className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="tracking-wide">Original Brands</span>
              </div>
            </motion.div>

            {/* Subtle Golden Accent Divider */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.8, ease: 'easeInOut' }}
              className="w-32 sm:w-44 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent mt-6 sm:mt-8"
            />
          </div>

          {/* Subtle "Built by Sami Ullah" Signature Credit at Bottom */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 1.9, ease: 'easeOut' }}
            className="absolute bottom-6 sm:bottom-8 inset-x-0 flex items-center justify-center z-20 pointer-events-none"
          >
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/60 border border-slate-800/60 backdrop-blur-sm shadow-sm">
              <span className="text-[10px] sm:text-[11px] font-sans font-medium uppercase tracking-[0.22em] text-slate-400">
                Built by
              </span>
              <span 
                className="text-base sm:text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 tracking-wide px-0.5"
                style={{ fontFamily: "'Great Vibes', 'Alex Brush', 'Dancing Script', cursive, sans-serif" }}
              >
                Sami Ullah
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
