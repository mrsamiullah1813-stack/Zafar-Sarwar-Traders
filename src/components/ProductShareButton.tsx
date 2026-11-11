import React, { useState, useRef, useEffect } from 'react';
import { 
  Share2, 
  Check, 
  Copy, 
  MessageCircle, 
  X, 
  ExternalLink,
  Facebook,
  Twitter,
  Send
} from 'lucide-react';
import { Product } from '../types';
import { getProductSlug } from '../utils/slugUtils';
import { normalizeProductImage } from '../utils/imageUtils';

export interface ProductShareButtonProps {
  product: Product;
  variant?: 'card-floating' | 'card-badge' | 'detail' | 'icon' | 'button-pill';
  className?: string;
  showLabel?: boolean;
}

const PRODUCTION_DOMAIN = 'https://zafarsarwartraders.shop';

export const ProductShareButton: React.FC<ProductShareButtonProps> = ({
  product,
  variant = 'card-floating',
  className = '',
  showLabel = true
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const slug = getProductSlug(product);
  const directUrl = `${PRODUCTION_DOMAIN}/product/${slug}`;
  const productName = product.name || 'Product';
  const categoryName = product.category || 'Sanitaryware & Building Materials';
  const primaryImage = normalizeProductImage(product.image, categoryName, productName);
  const shortDesc = product.shortDescription || (product.description ? product.description.slice(0, 140) : '');

  // Close modal when clicking outside
  useEffect(() => {
    if (!isModalOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsModalOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isModalOpen]);

  // Copy direct product link with notification
  const handleCopyLink = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(directUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = directUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Failed to copy product link:', err);
    }
  };

  // Main Share Trigger handler
  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // 1. Try Native Web Share API first if supported
    if (typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function') {
      try {
        const shareData: ShareData = {
          title: `${productName} | Zafar Sarwar Traders`,
          text: `Check out ${productName} (${categoryName}) at Zafar Sarwar Traders in Chiniot:`,
          url: directUrl
        };
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        // User aborted/cancelled native share dialog (AbortError) - ignore silently
        if (err?.name === 'AbortError') return;
        // If native share failed for another reason, fallback to custom modal below
      }
    }

    // 2. Fallback to platform share menu modal
    setIsModalOpen(true);
  };

  // Formatted WhatsApp Share
  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = `Check out *${productName}* at Zafar Sarwar Traders Chiniot (Sanitaryware, Paints & Building Materials):\n\n${directUrl}\n\nDelivery available across Pakistan. Call/WhatsApp: +92 310 8002863`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Facebook Share
  const handleFacebookShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(directUrl)}`;
    window.open(fbUrl, '_blank', 'width=600,height=500,noopener,noreferrer');
  };

  // X / Twitter Share
  const handleTwitterShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Check out ${productName} at Zafar Sarwar Traders Chiniot:`;
    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(directUrl)}&hashtags=ZafarSarwarTraders,Sanitaryware,Pakistan`;
    window.open(twUrl, '_blank', 'width=600,height=500,noopener,noreferrer');
  };

  // Telegram Share
  const handleTelegramShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Check out ${productName} at Zafar Sarwar Traders Chiniot:`;
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(directUrl)}&text=${encodeURIComponent(text)}`;
    window.open(tgUrl, '_blank', 'width=600,height=500,noopener,noreferrer');
  };

  // Render Trigger Button based on Variant
  const renderTriggerButton = () => {
    // 1. DETAIL VARIANT (Product Detail Page Header / Action Bar)
    if (variant === 'detail') {
      return (
        <button
          type="button"
          onClick={handleShareClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer text-xs font-semibold shrink-0 active:scale-95 shadow-2xs ${className}`}
          title="Share product via WhatsApp, Facebook, X, or copy link"
          aria-label={`Share ${productName}`}
        >
          <Share2 className="w-3.5 h-3.5 text-slate-600" />
          {showLabel && <span>Share</span>}
        </button>
      );
    }

    // 2. CARD FLOATING VARIANT (Top of product image on cards)
    if (variant === 'card-floating') {
      return (
        <button
          type="button"
          onClick={handleShareClick}
          title={`Share ${productName}`}
          aria-label={`Share ${productName}`}
          className={`inline-flex items-center justify-center w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 border border-slate-200/90 shadow-xs backdrop-blur-md transition-all active:scale-90 cursor-pointer ${className}`}
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      );
    }

    // 3. CARD BADGE VARIANT (Inline with rating/likes)
    if (variant === 'card-badge') {
      return (
        <button
          type="button"
          onClick={handleShareClick}
          title={`Share ${productName}`}
          aria-label={`Share ${productName}`}
          className={`inline-flex items-center gap-1 text-[9.5px] sm:text-[10.5px] font-medium text-slate-500 hover:text-blue-600 transition-colors cursor-pointer py-0.5 px-1.5 rounded-md hover:bg-blue-50/70 ${className}`}
        >
          <Share2 className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
          {showLabel && <span>Share</span>}
        </button>
      );
    }

    // 4. BUTTON PILL VARIANT
    if (variant === 'button-pill') {
      return (
        <button
          type="button"
          onClick={handleShareClick}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition-colors cursor-pointer active:scale-95 ${className}`}
          title={`Share ${productName}`}
        >
          <Share2 className="w-3 h-3 text-slate-600" />
          {showLabel && <span>Share</span>}
        </button>
      );
    }

    // Default icon only
    return (
      <button
        type="button"
        onClick={handleShareClick}
        title={`Share ${productName}`}
        aria-label={`Share ${productName}`}
        className={`p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer ${className}`}
      >
        <Share2 className="w-4 h-4" />
      </button>
    );
  };

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      {renderTriggerButton()}

      {/* Share Popover / Modal Menu */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            ref={modalRef}
            className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 z-10 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="share-modal-title" className="text-sm font-bold text-slate-900 leading-tight">
                    Share Product
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Zafar Sarwar Traders — Chiniot
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close share menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Snapshot */}
            <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-3">
              <img
                src={primaryImage}
                alt={productName}
                className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">
                  {categoryName}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                  {productName}
                </h4>
                {shortDesc && (
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {shortDesc}
                  </p>
                )}
              </div>
            </div>

            {/* Social Share Buttons Grid */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 transition-all active:scale-95 cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <MessageCircle className="w-5 h-5 fill-white" />
                  </div>
                  <span className="text-xs font-bold">WhatsApp</span>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  onClick={handleFacebookShare}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 transition-all active:scale-95 cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Facebook className="w-5 h-5 fill-white" />
                  </div>
                  <span className="text-xs font-bold">Facebook</span>
                </button>

                {/* X / Twitter */}
                <button
                  type="button"
                  onClick={handleTwitterShare}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 transition-all active:scale-95 cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Twitter className="w-4 h-4 fill-white" />
                  </div>
                  <span className="text-xs font-bold">X (Twitter)</span>
                </button>

                {/* Telegram */}
                <button
                  type="button"
                  onClick={handleTelegramShare}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 transition-all active:scale-95 cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Send className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold">Telegram</span>
                </button>
              </div>

              {/* Direct Canonical URL Copy Box */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Product Link (Canonical URL)
                </label>
                <div className="flex items-center gap-1.5 p-1.5 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                  <input
                    type="text"
                    readOnly
                    value={directUrl}
                    className="flex-1 px-2.5 py-1 text-xs text-slate-700 bg-transparent outline-none truncate font-mono select-all"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0 ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
                {copied && (
                  <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 animate-in fade-in duration-100">
                    <Check className="w-3 h-3" />
                    <span>Exact product link copied to clipboard.</span>
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Delivery available across Pakistan</span>
              <a
                href={directUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline"
              >
                <span>Open Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
