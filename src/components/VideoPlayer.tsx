import React, { useState } from 'react';
import { Play, Video } from 'lucide-react';
import { ProductVideo } from '../types';

interface VideoPlayerProps {
  video: ProductVideo;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, className = '' }) => {
  const [isActivated, setIsActivated] = useState(false);

  if (!video || !video.url) {
    return (
      <div className={`bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 flex flex-col items-center justify-center ${className}`}>
        <Video className="w-10 h-10 mb-2 opacity-50" />
        <p className="text-xs">No video source provided</p>
      </div>
    );
  }

  const { url, type } = video;

  const extractYouTubeId = (rawUrl: string): string => {
    try {
      if (rawUrl.includes('embed/')) {
        return rawUrl.split('embed/')[1]?.split(/[?&]/)[0] || '';
      }
      if (rawUrl.includes('v=')) {
        return rawUrl.split('v=')[1]?.split('&')[0] || '';
      }
      if (rawUrl.includes('youtu.be/')) {
        return rawUrl.split('youtu.be/')[1]?.split('?')[0] || '';
      }
    } catch {}
    return '';
  };

  // Helper to extract YouTube embed URL
  const getYouTubeEmbedUrl = (rawUrl: string): string => {
    try {
      if (rawUrl.includes('embed/')) {
        return rawUrl.includes('autoplay=') ? rawUrl : `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}autoplay=1&rel=0`;
      }
      const videoId = extractYouTubeId(rawUrl);
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : rawUrl;
    } catch {
      return rawUrl;
    }
  };

  // Helper to extract Vimeo embed URL
  const getVimeoEmbedUrl = (rawUrl: string): string => {
    try {
      if (rawUrl.includes('player.vimeo.com')) {
        return rawUrl.includes('autoplay=') ? rawUrl : `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}autoplay=1`;
      }
      const parts = rawUrl.split('/');
      const id = parts[parts.length - 1];
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : rawUrl;
    } catch {
      return rawUrl;
    }
  };

  const isYouTube = type === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be');
  const isVimeo = type === 'vimeo' || url.includes('vimeo.com');
  const isDirectVideo =
    type === 'mp4' ||
    url.startsWith('data:video') ||
    url.startsWith('blob:') ||
    /\.(mp4|mov|avi|webm|mkv)(\?.*)?$/i.test(url);

  if (isYouTube) {
    const embedUrl = getYouTubeEmbedUrl(url);
    const ytId = extractYouTubeId(url);
    if (!embedUrl) return null;

    if (!isActivated) {
      return (
        <button
          type="button"
          onClick={() => setIsActivated(true)}
          aria-label={`Play ${video.title || 'Product Video'}`}
          className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800 group cursor-pointer flex items-center justify-center ${className}`}
        >
          {ytId && (
            <img
              src={`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`}
              alt={video.title || 'Video Thumbnail'}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/20" />
          <span className="relative z-10 w-16 h-16 rounded-full bg-red-600/95 group-hover:bg-red-500 text-white flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
            <Play className="w-7 h-7 fill-current ml-1" />
          </span>
          {video.title && (
            <span className="absolute bottom-3 left-4 right-4 z-10 text-left text-xs font-semibold text-white/95 truncate">
              {video.title}
            </span>
          )}
        </button>
      );
    }

    return (
      <div className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 ${className}`}>
        <iframe
          src={embedUrl}
          title={video.title || "Product Video"}
          loading="lazy"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  if (isVimeo) {
    const embedUrl = getVimeoEmbedUrl(url);
    if (!embedUrl) return null;

    if (!isActivated) {
      return (
        <button
          type="button"
          onClick={() => setIsActivated(true)}
          aria-label={`Play ${video.title || 'Product Video'}`}
          className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800 group cursor-pointer flex flex-col items-center justify-center gap-2 ${className}`}
        >
          <span className="w-16 h-16 rounded-full bg-blue-600/95 group-hover:bg-blue-500 text-white flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
            <Play className="w-7 h-7 fill-current ml-1" />
          </span>
          <span className="text-xs font-semibold text-slate-200">
            {video.title || 'Watch Product Video'}
          </span>
        </button>
      );
    }

    return (
      <div className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 ${className}`}>
        <iframe
          src={embedUrl}
          title={video.title || "Product Video"}
          loading="lazy"
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isDirectVideo) {
    if (!url) return null;
    return (
      <div className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 ${className}`}>
        <video
          src={url}
          controls
          controlsList="nodownload"
          preload="none"
          className="w-full h-full object-contain"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Fallback for embed iframe strings or raw links
  if (url.startsWith('<iframe')) {
    return (
      <div
        className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 ${className}`}
        dangerouslySetInnerHTML={{ __html: url }}
      />
    );
  }

  if (!url) return null;

  return (
    <div className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 ${className}`}>
      <iframe
        src={url}
        title={video.title || "Product Video"}
        loading="lazy"
        className="w-full h-full"
        allow="fullscreen"
        allowFullScreen
      />
    </div>
  );
};
