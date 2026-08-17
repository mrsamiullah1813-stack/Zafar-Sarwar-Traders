import React, { useState, useEffect } from 'react';
import { Truck, Flame, Gift, Package, Sparkles, Megaphone, Tag, AlertCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { AnnouncementBarSettings, AnnouncementItem } from '../types';

interface AnnouncementBarProps {
  settings?: AnnouncementBarSettings;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ settings }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  // Filter valid announcements based on isActive and optional date window
  const activeAnnouncements = (settings?.announcements || [])
    .filter(a => a.isActive)
    .filter(a => {
      const now = new Date();
      if (a.startDate && new Date(a.startDate) > now) return false;
      if (a.endDate && new Date(a.endDate) < now) return false;
      return true;
    })
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  useEffect(() => {
    if (!settings?.isEnabled || activeAnnouncements.length <= 1) return;

    const intervalMs = (settings.displayDurationSeconds || 4) * 1000;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeAnnouncements.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [settings?.isEnabled, settings?.displayDurationSeconds, activeAnnouncements.length]);

  if (!settings?.isEnabled || activeAnnouncements.length === 0 || isDismissed) {
    return null;
  }

  const currentAnnouncement: AnnouncementItem = activeAnnouncements[currentIndex] || activeAnnouncements[0];

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Truck': return <Truck className="w-3.5 h-3.5 shrink-0" />;
      case 'Flame': return <Flame className="w-3.5 h-3.5 shrink-0 text-amber-400" />;
      case 'Gift': return <Gift className="w-3.5 h-3.5 shrink-0 text-emerald-400" />;
      case 'Package': return <Package className="w-3.5 h-3.5 shrink-0 text-sky-400" />;
      case 'Sparkles': return <Sparkles className="w-3.5 h-3.5 shrink-0 text-yellow-300" />;
      case 'Megaphone': return <Megaphone className="w-3.5 h-3.5 shrink-0 text-pink-400" />;
      case 'Tag': return <Tag className="w-3.5 h-3.5 shrink-0 text-indigo-300" />;
      case 'AlertCircle': return <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />;
      default: return <Truck className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  return (
    <div 
      className="relative z-40 w-full text-xs font-semibold py-2 px-4 shadow-sm border-b transition-all duration-300 overflow-hidden"
      style={{
        backgroundColor: currentAnnouncement.bgColor || '#1e3a8a',
        color: currentAnnouncement.textColor || '#ffffff',
        borderColor: 'rgba(255,255,255,0.1)'
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Navigation Left (if multiple) */}
        {activeAnnouncements.length > 1 && (
          <button
            onClick={() => setCurrentIndex((currentIndex - 1 + activeAnnouncements.length) % activeAnnouncements.length)}
            className="p-1 rounded-full hover:bg-white/10 transition-colors opacity-75 hover:opacity-100 hidden sm:flex"
            title="Previous announcement"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Center Content */}
        <div className="flex-1 flex items-center justify-center gap-2 text-center truncate">
          {renderIcon(currentAnnouncement.iconName)}
          
          {currentAnnouncement.linkUrl ? (
            <a 
              href={currentAnnouncement.linkUrl}
              className="hover:underline flex items-center gap-1 truncate"
            >
              <span>{currentAnnouncement.text}</span>
            </a>
          ) : (
            <span className="truncate tracking-tight">{currentAnnouncement.text}</span>
          )}

          {/* Indicator Pills if multiple */}
          {activeAnnouncements.length > 1 && (
            <span className="ml-2 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono font-bold hidden md:inline-block">
              {currentIndex + 1}/{activeAnnouncements.length}
            </span>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {activeAnnouncements.length > 1 && (
            <button
              onClick={() => setCurrentIndex((currentIndex + 1) % activeAnnouncements.length)}
              className="p-1 rounded-full hover:bg-white/10 transition-colors opacity-75 hover:opacity-100 hidden sm:flex"
              title="Next announcement"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-full hover:bg-white/10 transition-colors opacity-60 hover:opacity-100 ml-1"
            title="Close announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
