import React, { useEffect, useRef } from 'react';

interface CinematicParticlesProps {
  density?: number;
  speed?: number;
  className?: string;
}

export const CinematicParticles: React.FC<CinematicParticlesProps> = ({
  density = 40,
  speed = 0.5,
  className = "absolute inset-0 pointer-events-none overflow-hidden"
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    const isMobile = window.innerWidth < 768;
    const effectiveDensity = isMobile ? Math.min(density, 16) : density;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Pause rendering when canvas is scrolled off-screen to save mobile CPU/GPU
    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(render);
          }
        },
        { threshold: 0.05 }
      );
      observer.observe(canvas);
    }

    // Particle array setup
    const particles = Array.from({ length: effectiveDensity }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.8,
      speedX: (Math.random() - 0.5) * speed,
      speedY: -Math.random() * speed - 0.2,
      opacity: Math.random() * 0.5 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.005,
      hue: Math.random() > 0.5 ? 210 : 190 // Deep blue to cyan
    }));

    const render = () => {
      if (!isVisible) return;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity += Math.sin(Date.now() * p.pulseSpeed) * 0.005;

        // Wrap around edges
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const alpha = Math.max(0.1, Math.min(0.7, p.opacity));

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${alpha})`;
        if (!isMobile) {
          ctx.shadowBlur = p.size * 4;
          ctx.shadowColor = `hsla(${p.hue}, 90%, 60%, 0.8)`;
        }
        ctx.fill();
        if (!isMobile) {
          ctx.shadowBlur = 0; // Reset for performance
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [density, speed]);

  return (
    <div className={className}>
      <canvas ref={canvasRef} className="w-full h-full block opacity-70" />
    </div>
  );
};
