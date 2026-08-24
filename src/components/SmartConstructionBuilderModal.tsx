import React, { useEffect, useState } from 'react';
import { FittingBuilderConfig, BusinessConfig, Product } from '../types';
import { SmartConstructionBuilder } from './SmartConstructionBuilder';

interface SmartConstructionBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FittingBuilderConfig;
  businessConfig: BusinessConfig;
  products?: Product[];
  onAddToCart?: (product: Product, quantity?: number, selectedVariant?: string) => void;
  onAddPackageToCart?: (items: { product: Product; quantity: number; selectedVariantName?: string; price: number }[]) => void;
  onViewProduct?: (product: Product) => void;
}

export const SmartConstructionBuilderModal: React.FC<SmartConstructionBuilderModalProps> = ({
  isOpen,
  onClose,
  config,
  businessConfig,
  products = [],
  onAddToCart,
  onAddPackageToCart,
  onViewProduct
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Close on Escape key press and prevent background scrolling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isFullscreen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center transition-all duration-200 ${
        isFullscreen ? 'p-0' : 'p-0 sm:p-3 md:p-5'
      }`}
    >
      {/* Modal Container */}
      <div 
        className={`w-full flex flex-col bg-slate-950 shadow-2xl relative z-10 overflow-hidden transition-all duration-200 ${
          isFullscreen 
            ? 'h-full w-full rounded-none border-0' 
            : 'h-[100dvh] sm:h-[94vh] max-w-7xl rounded-none sm:rounded-3xl border sm:border-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <SmartConstructionBuilder
          config={config}
          products={products}
          businessConfig={businessConfig}
          onAddToCart={onAddToCart}
          onAddPackageToCart={onAddPackageToCart}
          onViewProduct={onViewProduct}
          onClose={onClose}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(prev => !prev)}
        />
      </div>
    </div>
  );
};
