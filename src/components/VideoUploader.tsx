import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Video, 
  Trash2, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  FileVideo, 
  Plus, 
  AlertCircle,
  Film,
  Link as LinkIcon,
  X
} from 'lucide-react';
import { ProductVideo } from '../types';

interface VideoUploaderProps {
  videos: ProductVideo[];
  onChange: (updatedVideos: ProductVideo[]) => void;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ videos = [], onChange }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState<string>('');
  const [videoTitle, setVideoTitle] = useState('');
  
  // URL Tab state
  const [urlTitle, setUrlTitle] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlType, setUrlType] = useState<'youtube' | 'vimeo' | 'mp4' | 'embed'>('youtube');

  // Preview state before adding
  const [previewVideo, setPreviewVideo] = useState<{ url: string; title: string; name: string } | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replacingVideoId, setReplacingVideoId] = useState<string | null>(null);

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const processVideoFile = (file: File, isReplaceId?: string) => {
    if (!file) return;

    // Allowed video extensions/types
    const validFormats = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska', 'video/mkv', 'video/avi'];
    const isVideo = file.type.startsWith('video/') || validFormats.some(f => file.name.toLowerCase().endsWith(f.replace('video/', '.')));

    if (!isVideo) {
      alert('Please select a valid video file (MP4, MOV, AVI, WEBM, MKV).');
      return;
    }

    setUploadingFileName(file.name);
    setUploadProgress(10);

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 90);
        setUploadProgress(percent);
      }
    };

    reader.onload = (e) => {
      setUploadProgress(100);
      const dataUrl = e.target?.result as string;

      setTimeout(() => {
        if (isReplaceId) {
          // Replace existing video
          const updated = videos.map(v => v.id === isReplaceId ? { ...v, url: dataUrl, title: v.title || file.name } : v);
          onChange(updated);
          setReplacingVideoId(null);
        } else {
          // Set preview for new upload
          setPreviewVideo({
            url: dataUrl,
            title: videoTitle || file.name.replace(/\.[^/.]+$/, ""),
            name: file.name
          });
        }
        setUploadProgress(null);
        setUploadingFileName('');
      }, 400);
    };

    reader.onerror = () => {
      alert('Error reading video file. Please try a smaller video clip.');
      setUploadProgress(null);
      setUploadingFileName('');
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processVideoFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processVideoFile(e.target.files[0]);
    }
  };

  const handleReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && replacingVideoId) {
      processVideoFile(e.target.files[0], replacingVideoId);
    }
  };

  const handleConfirmAddUploadedVideo = () => {
    if (!previewVideo) return;

    const newVideo: ProductVideo = {
      id: `vid-${Date.now()}`,
      title: videoTitle.trim() || previewVideo.title || 'Product Demonstration Video',
      type: 'mp4',
      url: previewVideo.url
    };

    onChange([...videos, newVideo]);
    setPreviewVideo(null);
    setVideoTitle('');
  };

  const handleAddUrlVideo = () => {
    if (!urlInput.trim()) return;

    const newVideo: ProductVideo = {
      id: `vid-${Date.now()}`,
      title: urlTitle.trim() || 'Product Video Link',
      type: urlType,
      url: urlInput.trim()
    };

    onChange([...videos, newVideo]);
    setUrlTitle('');
    setUrlInput('');
  };

  const handleRemoveVideo = (id: string) => {
    onChange(videos.filter(v => v.id !== id));
  };

  const triggerReplace = (id: string) => {
    setReplacingVideoId(id);
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska,video/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska,video/*"
        onChange={handleReplaceFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
          <Film className="w-4 h-4" />
          <span>Product Demonstration Videos ({videos.length})</span>
        </label>
        <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono">
          Admin Device Upload Enabled
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'upload'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Video from Device</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'url'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Paste Video Link (YouTube / URL)</span>
        </button>
      </div>

      {/* TAB 1: DEVICE UPLOAD */}
      {activeTab === 'upload' && (
        <div className="space-y-3">
          
          {/* Video Title optional field */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Video Title / Caption (Optional)
            </label>
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="e.g., Shower Spray Pattern Demo or Live Showroom Display"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center group ${
              dragActive 
                ? 'border-blue-500 bg-blue-950/30' 
                : 'border-slate-800 hover:border-blue-500/60 bg-slate-950/60 hover:bg-slate-900/80'
            }`}
          >
            <div className="p-3.5 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 group-hover:scale-110 transition-transform mb-3">
              <Upload className="w-6 h-6" />
            </div>

            <h4 className="text-xs font-bold text-white mb-1">
              Drag & Drop product video file here or <span className="text-blue-400 underline">Browse Files</span>
            </h4>
            <p className="text-[10px] text-slate-400">
              Direct device upload supported for <strong className="text-slate-200 font-mono">MP4, MOV, AVI, WEBM, MKV</strong>
            </p>
          </div>

          {/* Upload Progress Bar */}
          {uploadProgress !== null && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="truncate max-w-xs text-blue-400 font-mono">Uploading: {uploadingFileName}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Video Preview before confirming */}
          {previewVideo && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-blue-500/40 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Video Loaded & Ready for Product</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewVideo(null)}
                  className="p-1 rounded-lg bg-slate-950 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="rounded-xl overflow-hidden bg-black aspect-video max-h-48 border border-slate-800">
                <video src={previewVideo.url} controls className="w-full h-full object-contain" />
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-300 truncate font-mono">
                  {previewVideo.title}
                </span>

                <button
                  type="button"
                  onClick={handleConfirmAddUploadedVideo}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Attach Video to Product</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: LINK / EMBED */}
      {activeTab === 'url' && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Video Title
            </label>
            <input
              type="text"
              value={urlTitle}
              onChange={(e) => setUrlTitle(e.target.value)}
              placeholder="e.g. Official Manufacturer Presentation"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              value={urlType}
              onChange={(e) => setUrlType(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none"
            >
              <option value="youtube">YouTube Video</option>
              <option value="vimeo">Vimeo Video</option>
              <option value="mp4">Direct MP4 URL</option>
              <option value="embed">Embed Code / Iframe</option>
            </select>

            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste YouTube or MP4 link..."
              className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleAddUrlVideo}
            disabled={!urlInput.trim()}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add External Video Link</span>
          </button>
        </div>
      )}

      {/* LIST OF ATTACHED PRODUCT VIDEOS */}
      {videos.length > 0 ? (
        <div className="space-y-3 pt-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Attached Videos ({videos.length})
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {videos.map((vid, idx) => (
              <div key={vid.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between">
                
                {/* Video Title & Type */}
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate">
                    <span className="text-xs font-bold text-white block truncate">
                      {idx + 1}. {vid.title || 'Product Video'}
                    </span>
                    <span className="text-[10px] text-blue-400 font-mono uppercase">
                      {vid.type === 'mp4' ? 'Device MP4 Upload' : vid.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {vid.type === 'mp4' && (
                      <button
                        type="button"
                        onClick={() => triggerReplace(vid.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Replace Video File"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(vid.id)}
                      className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white transition-colors"
                      title="Delete Video"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Direct Inline Video Preview */}
                <div className="rounded-xl overflow-hidden bg-black aspect-video border border-slate-800/80">
                  {vid.type === 'mp4' || vid.url.startsWith('data:video') ? (
                    <video src={vid.url} controls className="w-full h-full object-contain" />
                  ) : vid.type === 'youtube' ? (
                    <iframe
                      src={vid.url.includes('embed') ? vid.url : `https://www.youtube.com/embed/${vid.url.split('v=')[1]?.split('&')[0] || ''}`}
                      title={vid.title}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-mono p-2 text-center">
                      {vid.url}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-500 text-xs">
          No videos uploaded yet. Upload a video clip above to display on the storefront!
        </div>
      )}

    </div>
  );
};
