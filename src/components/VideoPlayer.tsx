import React from 'react';
import { Play, Video } from 'lucide-react';
import { ProductVideo } from '../types';

interface VideoPlayerProps {
  video: ProductVideo;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, className = '' }) => {
  if (!video || !video.url) {
    return (
      <div className={`bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 flex flex-col items-center justify-center ${className}`}>
        <Video className="w-10 h-10 mb-2 opacity-50" />
        <p className="text-xs">No video source provided</p>
      </div>
    );
  }

  const { url, type } = video;

  // Helper to extract YouTube embed URL
  const getYouTubeEmbedUrl = (rawUrl: string): string => {
    try {
      if (rawUrl.includes('embed/')) return rawUrl;
      let videoId = '';
      if (rawUrl.includes('v=')) {
        videoId = rawUrl.split('v=')[1]?.split('&')[0] || '';
      } else if (rawUrl.includes('youtu.be/')) {
        videoId = rawUrl.split('youtu.be/')[1]?.split('?')[0] || '';
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : rawUrl;
    } catch {
      return rawUrl;
    }
  };

  // Helper to extract Vimeo embed URL
  const getVimeoEmbedUrl = (rawUrl: string): string => {
    try {
      if (rawUrl.includes('player.vimeo.com')) return rawUrl;
      const parts = rawUrl.split('/');
      const id = parts[parts.length - 1];
      return id ? `https://player.vimeo.com/video/${id}` : rawUrl;
    } catch {
      return rawUrl;
    }
  };

  // Check if URL is YouTube or Vimeo based on string matching if type isn't explicit
  const isYouTube = type === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be');
  const isVimeo = type === 'vimeo' || url.includes('vimeo.com');
  
  // Direct device video or video file link (MP4, MOV, AVI, WEBM, MKV)
  const isDirectVideo = 
    type === 'mp4' || 
    url.startsWith('data:video') || 
    url.startsWith('blob:') ||
    /\.(mp4|mov|avi|webm|mkv)(\?.*)?$/i.test(url);

  if (isYouTube) {
    const embedUrl = getYouTubeEmbedUrl(url);
    return (
      <div className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 ${className}`}>
        <iframe
          src={embedUrl}
          title={video.title || "Product Video"}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  if (isVimeo) {
    const embedUrl = getVimeoEmbedUrl(url);
    return (
      <div className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 ${className}`}>
        <iframe
          src={embedUrl}
          title={video.title || "Product Video"}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isDirectVideo) {
    return (
      <div className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 ${className}`}>
        <video
          src={url}
          controls
          controlsList="nodownload"
          preload="metadata"
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

  return (
    <div className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 ${className}`}>
      <iframe
        src={url}
        title={video.title || "Product Video"}
        className="w-full h-full"
        allow="fullscreen"
        allowFullScreen
      />
    </div>
  );
};
