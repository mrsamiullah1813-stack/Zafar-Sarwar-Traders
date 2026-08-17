import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  RefreshCw, 
  Check, 
  X, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Sliders, 
  AlertCircle 
} from 'lucide-react';

interface CategoryImageUploaderProps {
  label: string;
  imageUrl: string;
  onChange: (newUrl: string) => void;
  aspectRatioLabel?: string;
}

export const CategoryImageUploader: React.FC<CategoryImageUploaderProps> = ({
  label,
  imageUrl,
  onChange,
  aspectRatioLabel = 'Recommended 4:3 or 16:9 ratio (JPG, PNG, WebP)'
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [cropZoom, setCropZoom] = useState(1);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');
  const [isCropping, setIsCropping] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
      alert('Unsupported image format. Please select a JPG, JPEG, PNG, or WebP image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setTempImage(dataUrl);
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleApplyCroppedImage = () => {
    if (tempImage) {
      // Create canvas to handle scale & export cropped/resized data URL
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetWidth = 800;
        const targetHeight = fitMode === 'cover' ? 600 : 600;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#020617'; // slate-950 background
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          if (fitMode === 'cover') {
            const scale = Math.max(targetWidth / img.width, targetHeight / img.height) * cropZoom;
            const x = (targetWidth - img.width * scale) / 2;
            const y = (targetHeight - img.height * scale) / 2;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          } else {
            const scale = Math.min(targetWidth / img.width, targetHeight / img.height) * cropZoom;
            const x = (targetWidth - img.width * scale) / 2;
            const y = (targetHeight - img.height * scale) / 2;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          }

          const processedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          onChange(processedDataUrl);
        } else {
          onChange(tempImage);
        }

        setTempImage(null);
        setIsCropping(false);
      };
      img.src = tempImage;
    }
  };

  const handleRemove = () => {
    if (confirm('Are you sure you want to remove this category cover image?')) {
      onChange('');
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-blue-400" />
          <span>{label}</span>
        </label>
        <span className="text-[10px] text-slate-500 font-mono">JPG, PNG, WebP</span>
      </div>

      {/* Current Image Preview Container */}
      {imageUrl ? (
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 group transition-all">
          <div className="h-40 w-full overflow-hidden relative">
            <img 
              src={imageUrl} 
              alt={label} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 hover:bg-blue-500 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace Image</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 rounded-xl bg-rose-950/80 text-rose-300 hover:text-white border border-rose-500/40 hover:bg-rose-900 transition-all"
                title="Delete Image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-2.5 bg-slate-900 flex items-center justify-between border-t border-slate-800 text-[11px]">
            <span className="text-emerald-400 font-mono flex items-center gap-1">
              <Check className="w-3 h-3" /> Cover Image Uploaded
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-400 hover:underline font-medium"
            >
              Change File
            </button>
          </div>
        </div>
      ) : (
        /* Upload / Drag and Drop Dropzone */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center group ${
            dragActive 
              ? 'border-blue-500 bg-blue-950/30' 
              : 'border-slate-800 hover:border-blue-500/60 bg-slate-950/60 hover:bg-slate-900/80'
          }`}
        >
          <div className="p-3 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 group-hover:scale-110 transition-transform mb-2">
            <Upload className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-white mb-1">
            Drag & Drop image here or <span className="text-blue-400 underline">Browse File</span>
          </h4>
          <p className="text-[10px] text-slate-400 font-mono">
            {aspectRatioLabel}
          </p>
        </div>
      )}

      {/* URL Fallback Option */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste external image URL (https://...)"
          className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* CROP & RESIZE MODAL */}
      {isCropping && tempImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>Crop & Resize Category Cover</span>
              </h3>
              <button
                onClick={() => { setIsCropping(false); setTempImage(null); }}
                className="p-1 rounded-lg bg-slate-950 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Canvas / Image Preview */}
            <div className="relative h-60 w-full overflow-hidden bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center">
              <img
                src={tempImage}
                alt="Crop preview"
                className="transition-all duration-200"
                style={{
                  transform: `scale(${cropZoom})`,
                  objectFit: fitMode,
                  maxHeight: '100%',
                  maxWidth: '100%'
                }}
              />
            </div>

            {/* Adjust Controls */}
            <div className="space-y-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5 text-blue-400" />
                  <span>Zoom / Scale Ratio: {Math.round(cropZoom * 100)}%</span>
                </span>
                <input
                  type="range"
                  min="0.8"
                  max="2.5"
                  step="0.05"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  className="w-32 accent-blue-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-900">
                <span>Fit Mode:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFitMode('cover')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      fitMode === 'cover' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    Fill / Cover
                  </button>
                  <button
                    type="button"
                    onClick={() => setFitMode('contain')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      fitMode === 'contain' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    Fit / Contain
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setIsCropping(false); setTempImage(null); }}
                className="px-4 py-2 rounded-xl bg-slate-950 text-slate-400 text-xs font-semibold hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCroppedImage}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Save & Apply Cover Image</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
