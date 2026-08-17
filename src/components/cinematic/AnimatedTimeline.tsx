import React from 'react';
import { motion } from 'motion/react';

export const AnimatedTimelineStroke: React.FC = () => {
  return (
    <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-1 pointer-events-none hidden lg:block">
      <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <motion.line
          x1="50%"
          y1="0%"
          x2="50%"
          y2="100%"
          stroke="url(#timelineGlowGradient)"
          strokeWidth="3"
          strokeDasharray="6 6"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
        <defs>
          <linearGradient id="timelineGlowGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
