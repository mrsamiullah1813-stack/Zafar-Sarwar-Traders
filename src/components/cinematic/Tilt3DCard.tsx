import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';

interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  scaleOnHover?: number;
  glowColor?: string;
  onClick?: () => void;
}

export const Tilt3DCard: React.FC<Tilt3DCardProps> = ({
  children,
  className = '',
  maxTilt = 8,
  scaleOnHover = 1.025,
  glowColor = 'rgba(56, 189, 248, 0.25)',
  onClick
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [shinePos, setShinePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rY = ((x - centerX) / centerX) * maxTilt;
    const rX = -((y - centerY) / centerY) * maxTilt;

    setRotX(rX);
    setRotY(rY);
    setShinePos({
      x: Math.round((x / rect.width) * 100),
      y: Math.round((y / rect.height) * 100)
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotX(0);
    setRotY(0);
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`perspective-1000 transform-gpu cursor-pointer relative transition-transform duration-200 ease-out ${className}`}
      style={{
        perspective: '1000px',
        willChange: 'transform'
      }}
    >
      <motion.div
        animate={{
          rotateX: isHovered ? rotX : 0,
          rotateY: isHovered ? rotY : 0,
          scale: isHovered ? scaleOnHover : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
          mass: 0.5
        }}
        className="relative w-full h-full rounded-3xl overflow-hidden transform-gpu"
        style={{
          transformStyle: 'preserve-3d',
          boxShadow: isHovered
            ? `0 25px 50px -12px rgba(37, 99, 235, 0.25), 0 0 30px ${glowColor}`
            : undefined
        }}
      >
        {/* Children content */}
        {children}

        {/* Specular Glass Sweep Shimmer Effect */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500 z-30"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(circle at ${shinePos.x}% ${shinePos.y}%, rgba(255, 255, 255, 0.15) 0%, rgba(56, 189, 248, 0.08) 35%, transparent 70%)`
          }}
        />

        {/* Subtle Edge Shimmer Line */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none border transition-colors duration-500 z-40"
          style={{
            borderColor: isHovered ? 'rgba(56, 189, 248, 0.5)' : 'rgba(255, 255, 255, 0.08)'
          }}
        />
      </motion.div>
    </div>
  );
};
