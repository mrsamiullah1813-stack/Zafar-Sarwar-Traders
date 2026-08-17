import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Package, 
  Building2, 
  Award, 
  Users, 
  Clock, 
  ShieldCheck, 
  TrendingUp,
  Sparkles,
  CheckCircle2,
  PhoneCall,
  Star,
  Layers,
  Wrench
} from 'lucide-react';
import { StatCounter } from '../types';
import { defaultStatCounters } from '../data/storeData';
import { CinematicSection } from './cinematic/CinematicSection';
import { Tilt3DCard } from './cinematic/Tilt3DCard';

interface StatsSectionProps {
  stats: StatCounter[];
}

const getIconComponent = (iconName: string) => {
  const map: Record<string, any> = {
    Package,
    Building2,
    Award,
    Users,
    Clock,
    ShieldCheck,
    TrendingUp,
    Sparkles,
    CheckCircle2,
    PhoneCall,
    Star,
    Layers,
    Wrench
  };
  return map[iconName] || Sparkles;
};

const CountUpNumber: React.FC<{ target: number | string; duration?: number; enableAnimation?: boolean }> = ({
  target,
  duration = 1800,
  enableAnimation = true
}) => {
  const parseNum = (val: any) => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'string') {
      const cleaned = parseFloat(val.replace(/[^0-9.]/g, ''));
      return isNaN(cleaned) ? 0 : cleaned;
    }
    return 0;
  };

  const safeTarget = parseNum(target);
  // Initialize with safeTarget so server-side or immediate render shows real values without 0 flicker
  const [count, setCount] = useState<number>(safeTarget);
  const ref = useRef<HTMLSpanElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!enableAnimation) {
      setCount(safeTarget);
      return;
    }

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setCount(safeTarget);
      return;
    }

    let frameId: number;
    let startTime: number | null = null;

    const startAnimation = () => {
      if (animatedRef.current) return;
      animatedRef.current = true;
      setCount(0);

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setCount(Math.floor(easeProgress * safeTarget));

        if (progress < 1) {
          frameId = requestAnimationFrame(step);
        } else {
          setCount(safeTarget);
        }
      };

      frameId = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startAnimation();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    // Safety fallback: if intersection observer fails to fire within 800ms, ensure safeTarget is shown
    const fallbackTimer = setTimeout(() => {
      if (!animatedRef.current) {
        setCount(safeTarget);
      }
    }, 800);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
      clearTimeout(fallbackTimer);
    };
  }, [safeTarget, duration, enableAnimation]);

  const displayCount = typeof count === 'number' && !isNaN(count) ? count : safeTarget;

  return <span ref={ref}>{displayCount.toLocaleString()}</span>;
};

export const StatsSection: React.FC<StatsSectionProps> = ({ stats }) => {
  const rawStats = Array.isArray(stats) && stats.length > 0 ? stats : defaultStatCounters;
  
  // Cleanly map stats, providing default milestone numbers if values are empty or undefined
  const safeStats = rawStats.map(s => {
    const def = defaultStatCounters.find(d => d.id === s.id || (d.title && s.title && d.title.toLowerCase() === s.title.toLowerCase()));
    const validNum = (typeof s.numberValue === 'number' && s.numberValue > 0)
      ? s.numberValue
      : (def ? def.numberValue : (Number(s.numberValue) || 100));
    return {
      ...s,
      numberValue: validNum,
      suffix: s.suffix !== undefined ? s.suffix : (def?.suffix || '+')
    };
  });

  const visibleStats = safeStats
    .filter(s => s && !s.isHidden)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  if (visibleStats.length === 0) return null;

  return (
    <CinematicSection id="statistics" variant="scale" className="py-16 sm:py-24 relative overflow-hidden bg-slate-950/80 border-t border-b border-slate-800/80">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-300 text-xs font-semibold uppercase tracking-wider shadow-xl">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Proven Excellence & Scale</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white font-serif tracking-tight">
            Trusted Hardware <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300">Milestones</span>
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm font-light">
            Empowering contractors, plumbers, commercial developments & residential homeowners with authentic building hardware.
          </p>
        </div>

        {/* Stats Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.15 }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.08 }
            }
          }}
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(visibleStats.length, 4)} gap-6 sm:gap-8`}
        >
          {visibleStats.map((stat) => {
            const IconComp = getIconComponent(stat.iconName);

            return (
              <motion.div
                key={stat.id}
                variants={{
                  hidden: { opacity: 0, scale: 0.9, y: 20 },
                  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5 } }
                }}
              >
                <Tilt3DCard maxTilt={8} scaleOnHover={1.03}>
                  <div
                    className="group relative rounded-3xl glass-card p-6 sm:p-8 border border-slate-800/80 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-950/40 flex flex-col justify-between overflow-hidden h-full"
                  >
                    {/* Ambient Soft Glow inside card */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />

                    <div className="space-y-4 relative z-10">
                      {/* Icon Header */}
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-blue-950/80 border border-blue-500/40 p-3 text-blue-400 group-hover:text-cyan-300 group-hover:border-cyan-400/60 group-hover:scale-110 transition-all shadow-lg flex items-center justify-center">
                          <IconComp className="w-6 h-6" />
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>

                      {/* Animated Number */}
                      <div className="pt-2">
                        <div className="text-4xl sm:text-5xl font-black text-white font-serif tracking-tight flex items-baseline gap-0.5">
                          {stat.prefix && <span className="text-blue-400 text-3xl sm:text-4xl">{stat.prefix}</span>}
                          <CountUpNumber
                            target={stat.numberValue}
                            enableAnimation={stat.enableAnimation !== false}
                          />
                          {stat.suffix && <span className="text-blue-400 text-3xl sm:text-4xl font-sans">{stat.suffix}</span>}
                        </div>
                        <h3 className="mt-1 text-base sm:text-lg font-bold text-slate-200 font-serif group-hover:text-white transition-colors">
                          {stat.title}
                        </h3>
                      </div>

                      {/* Description */}
                      {stat.description && (
                        <p className="text-slate-400 text-xs font-light leading-relaxed border-t border-slate-800/60 pt-3">
                          {stat.description}
                        </p>
                      )}
                    </div>

                    {/* Subtle bottom highlight bar */}
                    <div className="mt-6 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 w-0 group-hover:w-full transition-all duration-700" />
                    </div>
                  </div>
                </Tilt3DCard>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </CinematicSection>
  );
};
