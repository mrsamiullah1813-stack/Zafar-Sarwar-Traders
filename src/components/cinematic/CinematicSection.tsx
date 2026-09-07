import React from 'react';
import { motion, Variants } from 'motion/react';

export type SectionRevealVariant = 'blur' | 'scale' | 'clip' | 'fadeUp' | 'parallax';

interface CinematicSectionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  variant?: SectionRevealVariant;
  delay?: number;
  duration?: number;
}

export const CinematicSection: React.FC<CinematicSectionProps> = ({
  children,
  id,
  className = '',
  variant = 'blur',
  delay = 0,
  duration = 0.9
}) => {

  const getVariants = (): Variants => {
    switch (variant) {
      case 'blur':
        return {
          hidden: { opacity: 0, y: 28, scale: 0.98 },
          visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              duration,
              delay,
              ease: [0.16, 1, 0.3, 1] // Custom luxury ease-out cubic
            }
          }
        };
      case 'scale':
        return {
          hidden: { opacity: 0, scale: 0.94, y: 20 },
          visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
              duration,
              delay,
              ease: [0.16, 1, 0.3, 1]
            }
          }
        };
      case 'clip':
        return {
          hidden: { opacity: 0, clipPath: 'inset(6% 0% 6% 0% round 24px)', y: 20 },
          visible: {
            opacity: 1,
            clipPath: 'inset(0% 0% 0% 0% round 0px)',
            y: 0,
            transition: {
              duration: duration * 1.05,
              delay,
              ease: [0.16, 1, 0.3, 1]
            }
          }
        };
      case 'fadeUp':
      default:
        return {
          hidden: { opacity: 0, y: 28 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration,
              delay,
              ease: [0.16, 1, 0.3, 1]
            }
          }
        };
    }
  };

  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.08 }}
      variants={getVariants()}
      className={className}
    >
      {children}
    </motion.section>
  );
};
