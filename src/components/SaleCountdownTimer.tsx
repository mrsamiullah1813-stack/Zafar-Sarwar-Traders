import React, { useState, useEffect } from 'react';
import { Timer, Clock } from 'lucide-react';
import { getSaleTimeRemaining } from '../utils/pricingUtils';

interface SaleCountdownTimerProps {
  endDate?: string;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light' | 'compact';
  compact?: boolean;
  label?: string;
}

export const SaleCountdownTimer: React.FC<SaleCountdownTimerProps> = ({
  endDate,
  size = 'sm',
  theme = 'dark',
  compact = false,
  label = 'Sale Ends In:'
}) => {
  const effectiveTheme = compact ? 'compact' : theme;
  const [timeLeft, setTimeLeft] = useState(() => getSaleTimeRemaining(endDate));

  useEffect(() => {
    if (!endDate) return;

    // Initial update
    setTimeLeft(getSaleTimeRemaining(endDate));

    const interval = setInterval(() => {
      const remaining = getSaleTimeRemaining(endDate);
      setTimeLeft(remaining);
      if (remaining.isOver) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (!endDate || timeLeft.isOver) {
    return null;
  }

  if (effectiveTheme === 'compact') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/90 border border-rose-500/40 text-rose-300 text-[10px] font-bold font-mono shadow-sm">
        <Clock className="w-3 h-3 text-rose-400 animate-pulse shrink-0" />
        <span>
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {String(timeLeft.hours).padStart(2, '0')}:
          {String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
    );
  }

  if (effectiveTheme === 'light') {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 shadow-sm">
        <div className="p-1 rounded-lg bg-rose-500 text-white shrink-0">
          <Timer className="w-3.5 h-3.5 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block leading-tight">
            {label}
          </span>
          <div className="flex items-center gap-1.5 font-mono font-black text-xs text-rose-950 mt-0.5">
            {timeLeft.days > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-white border border-rose-200">
                {timeLeft.days}d
              </span>
            )}
            <span className="px-1.5 py-0.5 rounded bg-white border border-rose-200">
              {String(timeLeft.hours).padStart(2, '0')}h
            </span>
            <span>:</span>
            <span className="px-1.5 py-0.5 rounded bg-white border border-rose-200">
              {String(timeLeft.minutes).padStart(2, '0')}m
            </span>
            <span>:</span>
            <span className="px-1.5 py-0.5 rounded bg-white border border-rose-200 text-rose-600">
              {String(timeLeft.seconds).padStart(2, '0')}s
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 p-2.5 sm:p-3 rounded-2xl bg-slate-950/90 border border-rose-500/30 text-rose-200 shadow-lg ${
      size === 'lg' ? 'text-sm' : 'text-xs'
    }`}>
      <div className="p-1.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
        <Timer className="w-4 h-4 animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
            {label}
          </span>
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        </div>
        <div className="flex items-center gap-1.5 font-mono font-bold text-xs sm:text-sm text-white mt-0.5">
          {timeLeft.days > 0 && (
            <div className="flex items-baseline gap-0.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="font-extrabold text-amber-400">{timeLeft.days}</span>
              <span className="text-[9px] text-slate-400 font-sans">d</span>
            </div>
          )}
          <div className="flex items-baseline gap-0.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="font-extrabold text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-[9px] text-slate-400 font-sans">h</span>
          </div>
          <span className="text-slate-500">:</span>
          <div className="flex items-baseline gap-0.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="font-extrabold text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="text-[9px] text-slate-400 font-sans">m</span>
          </div>
          <span className="text-slate-500">:</span>
          <div className="flex items-baseline gap-0.5 px-2 py-0.5 rounded-lg bg-rose-950/60 border border-rose-500/40">
            <span className="font-extrabold text-rose-400">{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className="text-[9px] text-rose-300 font-sans">s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
