import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, ShieldCheck, AlertCircle, Sparkles, Hash } from 'lucide-react';

export interface PatternLockProps {
  onComplete: (pattern: number[]) => void;
  status?: 'idle' | 'drawing' | 'error' | 'success' | 'verifying';
  errorMessage?: string;
  successMessage?: string;
  disabled?: boolean;
  minDots?: number;
  size?: number;
  onReset?: () => void;
  title?: string;
  subtitle?: string;
  showKeyboardHint?: boolean;
}

interface DotPoint {
  id: number;
  row: number;
  col: number;
  cx: number;
  cy: number;
}

// 3x3 Grid Dots (0-8) in standard 300x300 viewBox
const GRID_SIZE = 300;
const PADDING = 50;
const STEP = (GRID_SIZE - 2 * PADDING) / 2; // 100px

const DOTS: DotPoint[] = Array.from({ length: 9 }, (_, i) => {
  const row = Math.floor(i / 3);
  const col = i % 3;
  return {
    id: i,
    row,
    col,
    cx: PADDING + col * STEP,
    cy: PADDING + row * STEP,
  };
});

const HIT_RADIUS = 36; // Hit detection radius around each dot

export const PatternLock: React.FC<PatternLockProps> = ({
  onComplete,
  status = 'idle',
  errorMessage = '',
  successMessage = '',
  disabled = false,
  minDots = 4,
  onReset,
  title,
  subtitle,
  showKeyboardHint = true
}) => {
  const [selectedDots, setSelectedDots] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [localError, setLocalError] = useState<string>('');
  const [shake, setShake] = useState(0);
  const containerRef = useRef<SVGSVGElement | null>(null);

  // Clear local state when parent resets or on error
  useEffect(() => {
    if (status === 'error') {
      setShake(prev => prev + 1);
      // Automatically clear after a short delay so user can retry
      const timer = setTimeout(() => {
        setSelectedDots([]);
        setIsDrawing(false);
        setPointerPos(null);
      }, 1100);
      return () => clearTimeout(timer);
    } else if (status === 'idle' && selectedDots.length > 0 && !isDrawing) {
      setSelectedDots([]);
      setPointerPos(null);
    }
  }, [status]);

  // Convert pointer event coordinates to SVG 300x300 space
  const getSvgCoordinates = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * GRID_SIZE;
    const y = ((e.clientY - rect.top) / rect.height) * GRID_SIZE;
    return { x, y };
  }, []);

  // Find if pointer is over any unselected dot
  const getDotAtPosition = useCallback((x: number, y: number, currentPattern: number[]): number | null => {
    for (const dot of DOTS) {
      if (currentPattern.includes(dot.id)) continue;
      const dist = Math.hypot(x - dot.cx, y - dot.cy);
      if (dist <= HIT_RADIUS) {
        return dot.id;
      }
    }
    return null;
  }, []);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled || status === 'verifying') return;
    
    // Prevent default scrolling on touch
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const coords = getSvgCoordinates(e);
    if (!coords) return;

    setLocalError('');
    const dotId = getDotAtPosition(coords.x, coords.y, []);
    if (dotId !== null) {
      setIsDrawing(true);
      setSelectedDots([dotId]);
      setPointerPos(coords);
      try {
        if ('vibrate' in navigator) navigator.vibrate?.(20);
      } catch {}
    } else {
      setIsDrawing(true);
      setSelectedDots([]);
      setPointerPos(coords);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing || disabled || status === 'verifying') return;
    e.preventDefault();

    const coords = getSvgCoordinates(e);
    if (!coords) return;
    setPointerPos(coords);

    const hitDot = getDotAtPosition(coords.x, coords.y, selectedDots);
    if (hitDot !== null) {
      setSelectedDots(prev => {
        if (prev.includes(hitDot)) return prev;
        try {
          if ('vibrate' in navigator) navigator.vibrate?.(25);
        } catch {}
        return [...prev, hitDot];
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    setIsDrawing(false);
    setPointerPos(null);

    if (selectedDots.length === 0) return;

    if (selectedDots.length < minDots) {
      setLocalError(`Pattern must connect at least ${minDots} dots.`);
      setShake(prev => prev + 1);
      try {
        if ('vibrate' in navigator) navigator.vibrate?.([40, 50, 40]);
      } catch {}
      setTimeout(() => {
        setSelectedDots([]);
        setLocalError('');
      }, 900);
      return;
    }

    // Pattern submitted
    onComplete([...selectedDots]);
  };

  const handleReset = () => {
    setSelectedDots([]);
    setIsDrawing(false);
    setPointerPos(null);
    setLocalError('');
    if (onReset) onReset();
  };

  // Keyboard accessibility (number keys 1-9 to connect dots)
  useEffect(() => {
    if (disabled || status === 'verifying') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Check digits 1-9
      const key = e.key;
      if (/^[1-9]$/.test(key)) {
        const dotId = parseInt(key, 10) - 1; // Map 1-9 to 0-8
        if (!selectedDots.includes(dotId)) {
          setSelectedDots(prev => [...prev, dotId]);
          setLocalError('');
        }
      } else if (e.key === 'Backspace' || e.key === 'Escape') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'Enter') {
        if (selectedDots.length >= minDots) {
          e.preventDefault();
          onComplete([...selectedDots]);
        } else if (selectedDots.length > 0) {
          e.preventDefault();
          setLocalError(`Connect at least ${minDots} dots.`);
          setShake(prev => prev + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, status, selectedDots, minDots, onComplete]);

  // Color dynamics based on state
  const isError = status === 'error' || Boolean(localError);
  const isSuccess = status === 'success';

  const strokeColor = isError 
    ? '#f43f5e' // Rose-500
    : isSuccess 
    ? '#10b981' // Emerald-500
    : '#38bdf8'; // Cyan-400

  const glowColor = isError
    ? 'rgba(244,63,94,0.45)'
    : isSuccess
    ? 'rgba(16,185,129,0.45)'
    : 'rgba(56,189,248,0.45)';

  const activeMsg = errorMessage || localError;

  return (
    <div className="flex flex-col items-center select-none w-full max-w-sm mx-auto">
      {/* Header Info */}
      {title && (
        <div className="text-center mb-2">
          <h3 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>{title}</span>
          </h3>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}

      {/* Interactive 3x3 Canvas */}
      <motion.div
        animate={shake > 0 ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="relative p-2.5 sm:p-3 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl shadow-blue-950/40 backdrop-blur-xl flex items-center justify-center touch-none shrink-0 mx-auto"
      >
        <svg
          ref={containerRef}
          viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
          className="w-[210px] h-[210px] xs:w-[230px] xs:h-[230px] sm:w-[250px] sm:h-[250px] aspect-square cursor-crosshair touch-none select-none block shrink-0"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: 'none' }}
        >
          <defs>
            {/* Ambient drop shadow & neon glow filter */}
            <filter id="pattern-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={glowColor} />
            </filter>
            <filter id="dot-active-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={glowColor} />
            </filter>
          </defs>

          {/* Connected Path Lines */}
          {selectedDots.length > 1 && (
            <g filter="url(#pattern-glow)">
              {selectedDots.slice(0, -1).map((dotId, idx) => {
                const startDot = DOTS[dotId];
                const endDot = DOTS[selectedDots[idx + 1]];
                return (
                  <line
                    key={`line-${idx}`}
                    x1={startDot.cx}
                    y1={startDot.cy}
                    x2={endDot.cx}
                    y2={endDot.cy}
                    stroke={strokeColor}
                    strokeWidth="5.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-colors duration-200"
                  />
                );
              })}
            </g>
          )}

          {/* Active trailing line from last dot to current pointer */}
          {isDrawing && selectedDots.length > 0 && pointerPos && (
            <line
              x1={DOTS[selectedDots[selectedDots.length - 1]].cx}
              y1={DOTS[selectedDots[selectedDots.length - 1]].cy}
              x2={pointerPos.x}
              y2={pointerPos.y}
              stroke={strokeColor}
              strokeWidth="4"
              strokeLinecap="round"
              opacity={0.85}
              className="pointer-events-none"
            />
          )}

          {/* 9 Dots Grid */}
          {DOTS.map(dot => {
            const isSelected = selectedDots.includes(dot.id);
            const selectionIndex = selectedDots.indexOf(dot.id);
            const isLast = isSelected && selectionIndex === selectedDots.length - 1;

            return (
              <g key={`dot-${dot.id}`} className="transition-transform duration-200">
                {/* Outer touch target zone */}
                <circle
                  cx={dot.cx}
                  cy={dot.cy}
                  r={HIT_RADIUS}
                  fill="transparent"
                  className="cursor-pointer"
                />

                {/* Subtle base background circle */}
                <circle
                  cx={dot.cx}
                  cy={dot.cy}
                  r={22}
                  fill={isSelected ? (isError ? 'rgba(244,63,94,0.18)' : isSuccess ? 'rgba(16,185,129,0.18)' : 'rgba(56,189,248,0.18)') : '#0f172a'}
                  stroke={isSelected ? strokeColor : '#334155'}
                  strokeWidth={isSelected ? '2' : '1.5'}
                  className="transition-all duration-300"
                />

                {/* Selected Outer Glowing Ring */}
                {isSelected && (
                  <circle
                    cx={dot.cx}
                    cy={dot.cy}
                    r={26}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="1.5"
                    strokeDasharray={isLast && isDrawing ? "3 3" : "none"}
                    opacity={0.8}
                    filter="url(#dot-active-glow)"
                    className={isLast && isDrawing ? "animate-spin origin-center" : ""}
                    style={{ transformOrigin: `${dot.cx}px ${dot.cy}px` }}
                  />
                )}

                {/* Center Solid Core Dot */}
                <circle
                  cx={dot.cx}
                  cy={dot.cy}
                  r={isSelected ? 8 : 5.5}
                  fill={isSelected ? strokeColor : '#94a3b8'}
                  className="transition-all duration-200"
                />

                {/* Subtle order number indicator inside selected dots */}
                {isSelected && (
                  <text
                    x={dot.cx}
                    y={dot.cy + 3.5}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill={isError || isSuccess ? '#ffffff' : '#020617'}
                    className="font-mono pointer-events-none select-none"
                  >
                    {selectionIndex + 1}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </motion.div>

      {/* Feedback Messages & Controls */}
      <div className="w-full mt-3 space-y-2">
        {/* Error Notification */}
        {activeMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-center gap-2 backdrop-blur-md shadow-lg shadow-rose-950/40"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="font-medium">{activeMsg}</span>
          </motion.div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-center gap-2 backdrop-blur-md shadow-lg shadow-emerald-950/40"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </motion.div>
        )}

        {/* Action Controls & Hint */}
        <div className="flex items-center justify-between text-xs px-1 text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] text-slate-500">
              {selectedDots.length > 0 ? `${selectedDots.length} dots connected` : 'Draw to unlock'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={disabled || selectedDots.length === 0}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-cyan-300 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer"
            title="Clear Pattern"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Pattern</span>
          </button>
        </div>

        {/* Accessibility fallback info */}
        {showKeyboardHint && (
          <div className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1">
            <Hash className="w-3 h-3 text-slate-600" />
            <span>Tip: Drag with mouse/finger, or press keys 1-9 to connect dots</span>
          </div>
        )}
      </div>
    </div>
  );
};
