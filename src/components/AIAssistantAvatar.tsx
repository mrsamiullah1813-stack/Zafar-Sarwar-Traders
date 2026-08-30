import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export type AIAssistantMood = 'idle' | 'error' | 'success' | 'listening' | 'authenticating';

interface AIAssistantAvatarProps {
  mood?: AIAssistantMood;
  size?: number;
  className?: string;
}

export const AIAssistantAvatar: React.FC<AIAssistantAvatarProps> = ({
  mood = 'idle',
  size = 56,
  className = ''
}) => {
  const [isBlinking, setIsBlinking] = useState(false);

  // Periodic natural digital blink when in idle or listening mood
  useEffect(() => {
    if (mood !== 'idle' && mood !== 'listening') return;

    const scheduleBlink = () => {
      const interval = 3000 + Math.random() * 4000;
      return setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          timer = scheduleBlink();
        }, 180);
      }, interval);
    };

    let timer = scheduleBlink();
    return () => clearTimeout(timer);
  }, [mood]);

  // Derived styling and glow based on assistant emotional state
  const isError = mood === 'error';
  const isSuccess = mood === 'success';
  const isAuthenticating = mood === 'authenticating';

  // Glow color scheme
  const glowGradient = isError
    ? 'from-rose-500/40 via-amber-500/20 to-rose-600/30'
    : isSuccess
    ? 'from-emerald-400/50 via-cyan-400/40 to-teal-500/30'
    : isAuthenticating
    ? 'from-cyan-400/50 via-blue-500/40 to-indigo-500/30'
    : 'from-blue-600/40 via-cyan-400/30 to-indigo-500/30';

  const visorColor = isError
    ? '#fb7185' // rose-400
    : isSuccess
    ? '#34d399' // emerald-400
    : isAuthenticating
    ? '#38bdf8' // sky-400
    : '#22d3ee'; // cyan-400

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      aria-label={`AI Assistant state: ${mood}`}
    >
      {/* Outer ambient holographic halo glow */}
      <motion.div
        animate={{
          scale: isSuccess ? [1, 1.25, 1.15] : isError ? [1, 1.1, 1] : [1, 1.08, 1],
          opacity: isSuccess ? 0.8 : isError ? 0.6 : [0.35, 0.6, 0.35]
        }}
        transition={{
          duration: isSuccess ? 0.8 : isError ? 0.4 : 3.5,
          repeat: isSuccess || isError ? 0 : Infinity,
          ease: 'easeInOut'
        }}
        className={`absolute -inset-2 rounded-full bg-gradient-to-r ${glowGradient} blur-md pointer-events-none`}
      />

      {/* Orbiting futuristic cyber ring */}
      <motion.div
        animate={{
          rotate: isAuthenticating ? 360 : 360,
          scale: isSuccess ? [1, 1.1, 1] : 1
        }}
        transition={{
          rotate: {
            duration: isAuthenticating ? 3 : 18,
            repeat: Infinity,
            ease: 'linear'
          },
          scale: { duration: 0.6 }
        }}
        className="absolute inset-[-4px] rounded-full border border-dashed border-cyan-500/25 pointer-events-none"
      />

      {/* Main Avatar Head Chassis */}
      <motion.div
        animate={
          isError
            ? {
                x: [-4, 4, -3, 3, -1, 1, 0],
                y: [0, 2, 0],
                rotate: [-2, 2, -1, 1, 0]
              }
            : isSuccess
            ? {
                y: [-4, 0, -2, 0],
                scale: [1, 1.06, 1],
                rotate: [0, -1, 1, 0]
              }
            : {
                y: [-2, 2, -2]
              }
        }
        transition={{
          duration: isError ? 0.5 : isSuccess ? 0.6 : 4,
          repeat: isError || isSuccess ? 0 : Infinity,
          ease: 'easeInOut'
        }}
        className="relative w-full h-full rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 p-[1.5px] shadow-xl shadow-black/60 flex items-center justify-center overflow-hidden border border-slate-700/60 backdrop-blur-md"
      >
        {/* Inner glass reflection highlight */}
        <div className="absolute top-0 left-0 right-0 h-[45%] bg-gradient-to-b from-white/15 to-transparent rounded-t-2xl pointer-events-none" />

        {/* Futuristic visor screen */}
        <div className="relative w-[82%] h-[68%] rounded-xl bg-slate-950/90 border border-slate-800/90 flex items-center justify-center p-1.5 shadow-inner overflow-hidden">
          {/* Scanning line sweep when authenticating */}
          {isAuthenticating && (
            <motion.div
              animate={{ y: [-20, 30] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-[0.5px] opacity-70 pointer-events-none"
            />
          )}

          {/* Faceless Expressive Visor Optical Elements */}
          <svg
            viewBox="0 0 40 24"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="ai-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Expressions State Rendering */}
            {isSuccess ? (
              // Happy / Smile Expression (Upward curved friendly eyes)
              <motion.g
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                filter="url(#ai-glow)"
              >
                {/* Left Eye: Curved happy arch */}
                <path
                  d="M 9 14 C 11 8, 15 8, 17 14"
                  stroke={visorColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Right Eye: Curved happy arch */}
                <path
                  d="M 23 14 C 25 8, 29 8, 31 14"
                  stroke={visorColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Subtle digital cheek accents */}
                <circle cx="7" cy="15" r="1" fill={visorColor} opacity="0.6" />
                <circle cx="33" cy="15" r="1" fill={visorColor} opacity="0.6" />
              </motion.g>
            ) : isError ? (
              // Disappointed / Wrong Expression (Downward slanted worried slits)
              <motion.g
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                filter="url(#ai-glow)"
              >
                {/* Left Eye: Downward slanted slit */}
                <path
                  d="M 9 10 L 17 14"
                  stroke={visorColor}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                {/* Right Eye: Downward slanted slit */}
                <path
                  d="M 31 10 L 23 14"
                  stroke={visorColor}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </motion.g>
            ) : isBlinking ? (
              // Blinking state (flat thin line)
              <g filter="url(#ai-glow)">
                <line
                  x1="9"
                  y1="12"
                  x2="17"
                  y2="12"
                  stroke={visorColor}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                <line
                  x1="23"
                  y1="12"
                  x2="31"
                  y2="12"
                  stroke={visorColor}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              </g>
            ) : (
              // Idle / Calm Breathing Visor (Twin pill eyes with gentle micro-pulse)
              <motion.g
                animate={{
                  scaleY: isAuthenticating ? [1, 0.4, 1] : [1, 1.1, 1],
                  opacity: [0.9, 1, 0.9]
                }}
                transition={{
                  duration: isAuthenticating ? 0.8 : 3,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                filter="url(#ai-glow)"
              >
                {/* Left Visor Light */}
                <rect
                  x="10"
                  y="8.5"
                  width="7"
                  height="7"
                  rx="3.5"
                  fill={visorColor}
                />
                {/* Right Visor Light */}
                <rect
                  x="23"
                  y="8.5"
                  width="7"
                  height="7"
                  rx="3.5"
                  fill={visorColor}
                />
                {/* Subtle core pupil dot */}
                <circle cx="13.5" cy="12" r="1.2" fill="#ffffff" opacity="0.9" />
                <circle cx="26.5" cy="12" r="1.2" fill="#ffffff" opacity="0.9" />
              </motion.g>
            )}
          </svg>
        </div>

        {/* Bottom subtle chin LED indicator */}
        <div className="absolute bottom-1 w-2.5 h-[2px] rounded-full bg-cyan-400/60" />
      </motion.div>
    </div>
  );
};
