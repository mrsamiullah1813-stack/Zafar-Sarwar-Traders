import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  RefreshCw, 
  Check, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  AlertCircle,
  Sparkles,
  Loader2
} from 'lucide-react';

interface MultiImageUploaderProps {
  label?: string;
  images: string[];
  onChange: (newImages: string[]) => void;
  maxFiles?: number;
  aspectRatioHint?: string;
}

export const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({
  label = 'Product / Showcase Gallery Images',
  images,
  onChange,
  maxFiles = 10,
  aspectRatioHint = 'Supported: JPG, PNG, WebP, AVIF up to 20MB each'
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    if (!filesArray.length) return;

    setErrorMsg(null);
    setUploadProgress(10);

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    const maxSize = 20 * 1024 * 1024; // 20 MB

    const processedDataUrls: string[] = [];

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];

      if (file.size > maxSize) {
        setErrorMsg(`File "${file.name}" exceeds 20MB limit.`);
        continue;
      }

      if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
        setErrorMsg(`Unsupported format for "${file.name}". Allowed: JPG, JPEG, PNG, WEBP, AVIF.`);
        continue;
      }

      setUploadProgress(Math.round(((i + 1) / filesArray.length) * 80));

      try {
        const dataUrl = await compressAndResizeImage(file);
        processedDataUrls.push(dataUrl);
      } catch (err) {
        console.error('Failed to compress image:', err);
      }
    }

    setUploadProgress(100);
    setTimeout(() => setUploadProgress(null), 400);

    if (processedDataUrls.length > 0) {
      onChange([...images, ...processedDataUrls].slice(0, maxFiles));
    }
  };

  const compressAndResizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200; // max width or height
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(dataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const updated = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif,image/jpg"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-blue-400" />
          <span>{label}</span>
        </label>
        <span className="text-[10px] text-slate-500 font-mono">
          {images.length} / {maxFiles} Uploaded
        </span>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center group ${
          dragActive 
            ? 'border-blue-500 bg-blue-950/40' 
            : 'border-slate-800 hover:border-blue-500/60 bg-slate-950/60 hover:bg-slate-900/80'
        }`}
      >
        <div className="p-3 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 group-hover:scale-110 transition-transform mb-2">
          <Upload className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-bold text-white mb-1">
          Drag & Drop multiple images or <span className="text-blue-400 underline">Browse Device Files</span>
        </h4>
        <p className="text-[10px] text-slate-400 font-mono">
          {aspectRatioHint}
        </p>
      </div>

      {/* Progress Indicator */}
      {uploadProgress !== null && (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 animate-fadeIn">
          <div className="flex justify-between items-center text-[11px] text-slate-300 font-mono">
            <span className="flex items-center gap-1.5 text-blue-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Processing & Compressing Images...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Image Thumbnails & Reorder List */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {images.map((imgUrl, idx) => (
            <div 
              key={idx}
              className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group h-28 flex flex-col justify-between"
            >
              <img 
                src={imgUrl} 
                alt={`Uploaded ${idx + 1}`}
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 backdrop-blur-xs">
                {/* Move Left / Up */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleMoveImage(idx, 'up'); }}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30"
                  title="Move Left"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>

                {/* Move Right / Down */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleMoveImage(idx, 'down'); }}
                  disabled={idx === images.length - 1}
                  className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white disabled:opacity-30"
                  title="Move Right"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                  className="p-1.5 rounded-lg bg-rose-950/80 text-rose-300 hover:text-white border border-rose-500/40"
                  title="Remove Image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Cover Badge for First Image */}
              {idx === 0 && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold shadow-md">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
