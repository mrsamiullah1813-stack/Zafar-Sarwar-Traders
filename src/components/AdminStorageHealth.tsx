import React, { useState, useEffect, useMemo } from 'react';
import {
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Folder,
  FileText,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  Trash2,
  AlertCircle,
  Eye,
  X,
  Layers,
  Sparkles,
  Lock,
  Globe,
  Settings,
  CheckSquare,
  Square,
  ArrowDownCircle,
  Database,
  Sliders,
  Check
} from 'lucide-react';
import {
  fetchStorageHealth,
  pruneDeliveredOrderProof,
  deleteStorageFile,
  deleteStorageFilesBatch,
  updateStorageQuotaPlan,
  StorageHealthResponse,
  StorageBucketStat,
  StorageFileItem,
  StorageCleanupCandidate
} from '../services/storageHealthService';

interface AdminStorageHealthProps {
  onShowToast?: (message: string) => void;
}

export const AdminStorageHealth: React.FC<AdminStorageHealthProps> = ({ onShowToast }) => {
  const [data, setData] = useState<StorageHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sub-view tab
  const [activeView, setActiveView] = useState<'overview' | 'buckets' | 'largest' | 'recent' | 'cleanup'>('overview');

  // Search & Filter
  const [fileSearch, setFileSearch] = useState('');
  const [selectedBucketFilter, setSelectedBucketFilter] = useState('all');

  // Batch Selection
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Cleanup & Delete Modals / State
  const [selectedCleanupCandidate, setSelectedCleanupCandidate] = useState<StorageCleanupCandidate | null>(null);
  const [fileToDelete, setFileToDelete] = useState<{ bucket: string; path: string; name: string; size: string; publicUrl?: string | null; orderId?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Quota Settings Modal
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [customQuotaGb, setCustomQuotaGb] = useState<number>(1);
  const [isUpdatingQuota, setIsUpdatingQuota] = useState(false);

  // Batch Cleanup Confirmation
  const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState(false);
  const [isPruningAllDelivered, setIsPruningAllDelivered] = useState(false);

  const loadData = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await fetchStorageHealth();
      setData(res);
      if (res.quotaInfo?.quotaMb) {
        setCustomQuotaGb(parseFloat((res.quotaInfo.quotaMb / 1024).toFixed(2)));
      }
      if (showRefreshSpinner && onShowToast) {
        onShowToast('Storage health telemetry updated successfully');
      }
    } catch (err: any) {
      console.error('Failed to load storage health:', err);
      setError(err.message || 'Unable to retrieve Supabase storage health.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered largest files
  const filteredLargestFiles = useMemo(() => {
    if (!data?.largestFiles) return [];
    return data.largestFiles.filter(file => {
      const matchSearch =
        !fileSearch ||
        file.name.toLowerCase().includes(fileSearch.toLowerCase()) ||
        file.path.toLowerCase().includes(fileSearch.toLowerCase()) ||
        file.bucket.toLowerCase().includes(fileSearch.toLowerCase());
      const matchBucket = selectedBucketFilter === 'all' || file.bucket === selectedBucketFilter;
      return matchSearch && matchBucket;
    });
  }, [data?.largestFiles, fileSearch, selectedBucketFilter]);

  // Filtered recent uploads
  const filteredRecentUploads = useMemo(() => {
    if (!data?.recentUploads) return [];
    return data.recentUploads.filter(file => {
      const matchSearch =
        !fileSearch ||
        file.name.toLowerCase().includes(fileSearch.toLowerCase()) ||
        file.path.toLowerCase().includes(fileSearch.toLowerCase()) ||
        file.bucket.toLowerCase().includes(fileSearch.toLowerCase());
      const matchBucket = selectedBucketFilter === 'all' || file.bucket === selectedBucketFilter;
      return matchSearch && matchBucket;
    });
  }, [data?.recentUploads, fileSearch, selectedBucketFilter]);

  // Handle single candidate prune
  const handlePruneCandidate = async () => {
    if (!selectedCleanupCandidate) return;
    setIsDeleting(true);

    try {
      await pruneDeliveredOrderProof(
        selectedCleanupCandidate.bucket,
        selectedCleanupCandidate.storagePath,
        selectedCleanupCandidate.orderId
      );

      if (onShowToast) {
        onShowToast(`Cleaned up ${selectedCleanupCandidate.fileName} for Delivered Order #${selectedCleanupCandidate.orderNumber}`);
      }
      setSelectedCleanupCandidate(null);
      await loadData(true);
    } catch (err: any) {
      console.error('Prune failed:', err);
      if (onShowToast) {
        onShowToast(`Cleanup failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle single file delete
  const handleConfirmSingleDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);

    try {
      await deleteStorageFile(fileToDelete.bucket, fileToDelete.path, fileToDelete.orderId);
      if (onShowToast) {
        onShowToast(`Successfully deleted "${fileToDelete.name}" from ${fileToDelete.bucket}`);
      }
      setFileToDelete(null);
      setSelectedFiles(prev => {
        const next = new Set(prev);
        next.delete(`${fileToDelete.bucket}:::${fileToDelete.path}`);
        return next;
      });
      await loadData(true);
    } catch (err: any) {
      console.error('File delete failed:', err);
      if (onShowToast) {
        onShowToast(`Delete failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle batch deletion of selected files
  const handleConfirmBatchDelete = async () => {
    if (selectedFiles.size === 0) return;
    setIsDeleting(true);

    const filesToClean = Array.from(selectedFiles).map(key => {
      const [bucket, storagePath] = key.split(':::');
      return { bucket, storagePath };
    });

    try {
      const res = await deleteStorageFilesBatch(filesToClean);
      if (onShowToast) {
        onShowToast(res.message || `Cleaned up ${res.deletedCount || filesToClean.length} files from Supabase Storage`);
      }
      setSelectedFiles(new Set());
      setIsBatchConfirmOpen(false);
      await loadData(true);
    } catch (err: any) {
      console.error('Batch delete failed:', err);
      if (onShowToast) {
        onShowToast(`Batch cleanup failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle 1-click clean all delivered proofs
  const handlePruneAllDeliveredProofs = async () => {
    if (!data?.cleanupCandidates || data.cleanupCandidates.length === 0) return;
    setIsPruningAllDelivered(true);

    const files = data.cleanupCandidates.map(c => ({
      bucket: c.bucket,
      storagePath: c.storagePath,
      orderId: c.orderId
    }));

    try {
      const res = await deleteStorageFilesBatch(files);
      if (onShowToast) {
        onShowToast(`Cleaned up ${res.deletedCount || files.length} payment receipts from delivered orders.`);
      }
      await loadData(true);
    } catch (err: any) {
      console.error('Clean all delivered failed:', err);
      if (onShowToast) {
        onShowToast(`Cleanup failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsPruningAllDelivered(false);
    }
  };

  // Handle quota update
  const handleSaveQuotaPlan = async (gb: number) => {
    setIsUpdatingQuota(true);
    const mb = Math.round(gb * 1024);
    const planName = gb === 1 ? 'Supabase Free Tier (1 GB)' : (gb === 100 ? 'Supabase Pro Tier (100 GB)' : `${gb} GB Plan`);

    try {
      await updateStorageQuotaPlan(mb, planName);
      if (onShowToast) {
        onShowToast(`Storage quota capacity updated to ${gb} GB`);
      }
      setIsQuotaModalOpen(false);
      await loadData(true);
    } catch (err: any) {
      console.error('Failed to update quota plan:', err);
      if (onShowToast) {
        onShowToast(`Failed to update quota: ${err.message}`);
      }
    } finally {
      setIsUpdatingQuota(false);
    }
  };

  // Toggle selection for batch delete
  const toggleFileSelection = (bucket: string, path: string) => {
    const key = `${bucket}:::${path}`;
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = (files: StorageFileItem[]) => {
    const currentKeys = files.map(f => `${f.bucket}:::${f.path}`);
    const allSelected = currentKeys.every(k => selectedFiles.has(k));

    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (allSelected) {
        currentKeys.forEach(k => next.delete(k));
      } else {
        currentKeys.forEach(k => next.add(k));
      }
      return next;
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 space-y-4 bg-slate-900/40 rounded-3xl border border-slate-800/80">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-200">Connecting to Supabase Storage API...</p>
          <p className="text-xs text-slate-400 mt-1">Calculating exact used storage and remaining capacity</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 bg-rose-950/20 border border-rose-800/50 rounded-3xl space-y-4">
        <div className="flex items-center gap-3 text-rose-400">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <h3 className="text-base font-bold">Storage Health Telemetry Unavailable</h3>
        </div>
        <p className="text-sm text-rose-200/80">{error}</p>
        <button
          onClick={() => loadData(false)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  const totalUsed = data?.totalUsedFormatted || '0 B';
  const totalCapacity = data?.totalCapacityFormatted || data?.quotaInfo?.totalCapacityFormatted || '1.00 GB';
  const remainingStorage = data?.remainingFormatted || data?.quotaInfo?.remainingFormatted || '1.00 GB';
  const usagePct = data?.usagePercentage ?? 0;
  const remainingPct = data?.remainingPercentage ?? 100;
  const planName = data?.quotaInfo?.planName || 'Supabase Free Tier (1 GB)';

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900/70 rounded-2xl border border-slate-800/80 backdrop-blur-sm shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Supabase Storage Usage & Cleanup Monitor
              </h2>
              <p className="text-xs text-slate-400">
                Exact storage capacity, used space, left storage & direct cleanup tools
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsQuotaModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            title="Configure storage plan limit"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>Plan: {planName}</span>
          </button>

          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-900/30 disabled:opacity-50"
            title="Refresh real-time storage metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Recalculating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* STORAGE USAGE & CAPACITY HERO CARD */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-400" />
                Live Supabase Project Capacity
              </span>
              <div className="flex items-baseline gap-3 mt-1.5">
                <span className="text-3xl font-black text-white font-mono tracking-tight">{totalUsed}</span>
                <span className="text-sm font-semibold text-slate-400">used of</span>
                <span className="text-2xl font-bold text-slate-200 font-mono">{totalCapacity}</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono font-bold">
                  {usagePct}% Used
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-right">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Remaining / Left Storage</span>
                <span className="text-xl font-black text-emerald-300 font-mono">{remainingStorage}</span>
                <span className="text-[11px] text-emerald-400/80 font-mono block mt-0.5">({remainingPct}% Available)</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Storage Status</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 mt-1 rounded-full text-xs font-bold font-mono ${
                  data?.status === 'Healthy'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                    : (data?.status === 'Warning' ? 'bg-amber-950 text-amber-300 border border-amber-800/60' : 'bg-rose-950 text-rose-300 border border-rose-800/60')
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {data?.status || 'Healthy'}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Dual Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span className="text-blue-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Used: {totalUsed} ({usagePct}%)
              </span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Left: {remainingStorage} ({remainingPct}%)
              </span>
            </div>

            <div className="h-4 bg-slate-950 rounded-full p-0.5 border border-slate-800 flex overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-l-full transition-all duration-500 ${
                  usagePct > 90 ? 'bg-rose-500' : (usagePct > 75 ? 'bg-amber-500' : 'bg-blue-500')
                }`}
                style={{ width: `${Math.max(usagePct, 1)}%` }}
                title={`Used: ${totalUsed} (${usagePct}%)`}
              />
              <div
                className="h-full bg-emerald-500/80 rounded-r-full transition-all duration-500"
                style={{ width: `${remainingPct}%` }}
                title={`Left: ${remainingStorage} (${remainingPct}%)`}
              />
            </div>
          </div>

          {/* KPI Mini-Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Stored Files</span>
              <span className="text-lg font-black text-white font-mono">{(data?.totalFileCount || 0).toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Active Buckets</span>
              <span className="text-lg font-black text-white font-mono">{data?.bucketCount || 0}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Delivered Proofs</span>
              <span className="text-lg font-black text-amber-400 font-mono">{data?.cleanupCandidates?.length || 0}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Plan Tier</span>
              <span className="text-xs font-bold text-purple-300 truncate block mt-0.5" title={planName}>{planName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Batch Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveView('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeView === 'overview'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Storage Overview</span>
          </button>

          <button
            onClick={() => setActiveView('buckets')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeView === 'buckets'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Buckets ({data?.buckets?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveView('largest')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeView === 'largest'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Largest Files ({data?.largestFiles?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveView('recent')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeView === 'recent'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recent Uploads ({data?.recentUploads?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveView('cleanup')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeView === 'cleanup'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-950'
                : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>Delivered Receipts Cleanup ({data?.cleanupCandidates?.length || 0})</span>
            {Boolean(data?.cleanupCandidates?.length) && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-950 text-amber-300 font-mono text-[10px]">
                {data?.cleanupCandidates?.length}
              </span>
            )}
          </button>
        </div>

        {/* Batch selection count & clean action */}
        {selectedFiles.size > 0 && (
          <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-800/60 px-3 py-1.5 rounded-xl">
            <span className="text-xs text-rose-200 font-semibold">
              {selectedFiles.size} file(s) selected
            </span>
            <button
              onClick={() => setIsBatchConfirmOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clean Up Selected</span>
            </button>
            <button
              onClick={() => setSelectedFiles(new Set())}
              className="text-slate-400 hover:text-white text-xs p-1"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: OVERVIEW */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Quick Storage Health Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box 1: Storage Quota Health */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Capacity</span>
                <HardDrive className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">{totalCapacity}</div>
                <p className="text-xs text-slate-400 mt-1">{planName}</p>
              </div>
              <button
                onClick={() => setIsQuotaModalOpen(true)}
                className="w-full text-center py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                Change Capacity Limit
              </button>
            </div>

            {/* Box 2: Used Storage Metric */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Currently Used</span>
                <Database className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">{totalUsed}</div>
                <p className="text-xs text-slate-400 mt-1">{(data?.totalUsedBytes || 0).toLocaleString()} bytes</p>
              </div>
              <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg font-mono">
                {usagePct}% of total capacity used
              </div>
            </div>

            {/* Box 3: Left Storage Metric */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Remaining / Left</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-300 font-mono">{remainingStorage}</div>
                <p className="text-xs text-emerald-400/80 mt-1">{(data?.remainingBytes || 0).toLocaleString()} bytes free</p>
              </div>
              <div className="text-[11px] text-emerald-400/90 bg-emerald-950/40 p-2 rounded-lg font-mono border border-emerald-900/40">
                {remainingPct}% available for uploads
              </div>
            </div>
          </div>

          {/* Quick Clean Up Candidates Banner */}
          {Boolean(data?.cleanupCandidates?.length) && (
            <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{data?.cleanupCandidates?.length} Delivered Order Receipt(s) Ready for Cleanup</span>
                </div>
                <p className="text-xs text-amber-200/80">
                  These payment receipts belong to completed orders and can be pruned to immediately recover Supabase storage.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActiveView('cleanup')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
                >
                  Review Individually
                </button>
                <button
                  onClick={handlePruneAllDeliveredProofs}
                  disabled={isPruningAllDelivered}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-950/40 disabled:opacity-50"
                >
                  {isPruningAllDelivered ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>{isPruningAllDelivered ? 'Cleaning...' : 'Clean All Delivered Proofs'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Top Buckets Summary */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Folder className="w-4 h-4 text-blue-400" />
                Bucket Storage Breakdown
              </h3>
              <button
                onClick={() => setActiveView('buckets')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                View Details →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data?.buckets?.map(b => (
                <div key={b.name} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-200 truncate">{b.name}</span>
                    <span className="font-mono text-xs font-bold text-blue-400">{b.usedFormatted}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{b.fileCount} files</span>
                    <span>{b.percentageOfTotal}% of total</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(b.percentageOfTotal, b.fileCount > 0 ? 4 : 0))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: BUCKETS BREAKDOWN */}
      {activeView === 'buckets' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Storage Buckets</h3>
                <p className="text-xs text-slate-400 mt-0.5">Real-time object distribution per Supabase bucket</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {data?.buckets?.length || 0} Buckets Total
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <th className="p-3.5">Bucket Name</th>
                    <th className="p-3.5">Access</th>
                    <th className="p-3.5">File Limit</th>
                    <th className="p-3.5 text-right">File Count</th>
                    <th className="p-3.5 text-right">Used Space</th>
                    <th className="p-3.5 w-44">Distribution</th>
                    <th className="p-3.5 text-center">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {data?.buckets?.map(b => (
                    <tr key={b.name} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-bold text-slate-200">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="font-mono text-xs">{b.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        {b.isPublic ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[10px] font-semibold">
                            <Globe className="w-3 h-3" /> Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-semibold">
                            <Lock className="w-3 h-3" /> Private
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                        {b.fileSizeLimit ? `${(b.fileSizeLimit / (1024 * 1024)).toFixed(1)} MB` : 'Unlimited'}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-200 font-semibold">
                        {b.fileCount.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-100">
                        {b.usedFormatted}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, Math.max(b.percentageOfTotal, b.fileCount > 0 ? 3 : 0))}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 w-10 text-right">
                            {b.percentageOfTotal}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => {
                            setSelectedBucketFilter(b.name);
                            setActiveView('largest');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-colors"
                        >
                          View Files
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!data?.buckets || data.buckets.length === 0) && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No storage buckets found in this Supabase project.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3 & 4: LARGEST FILES OR RECENT UPLOADS (With Single & Batch Delete) */}
      {(activeView === 'largest' || activeView === 'recent') && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search file name, path, or bucket..."
                value={fileSearch}
                onChange={e => setFileSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 rounded-xl text-xs text-slate-200 border border-slate-800 focus:outline-none focus:border-blue-500"
              />
              {fileSearch && (
                <button
                  onClick={() => setFileSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedBucketFilter}
                onChange={e => setSelectedBucketFilter(e.target.value)}
                className="bg-slate-950 text-xs text-slate-300 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Buckets</option>
                {data?.buckets?.map(b => (
                  <option key={b.name} value={b.name}>
                    {b.name} ({b.fileCount})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {activeView === 'largest' ? 'Top Largest Files' : 'Recent Uploads Activity'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select files to delete in batch or clean up individually to free storage
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleSelectAll(activeView === 'largest' ? filteredLargestFiles : filteredRecentUploads)}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Toggle All</span>
                </button>
                <span className="text-xs text-slate-400 font-mono">
                  {activeView === 'largest' ? filteredLargestFiles.length : filteredRecentUploads.length} Files
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          (activeView === 'largest' ? filteredLargestFiles : filteredRecentUploads).length > 0 &&
                          (activeView === 'largest' ? filteredLargestFiles : filteredRecentUploads).every(f => selectedFiles.has(`${f.bucket}:::${f.path}`))
                        }
                        onChange={() => toggleSelectAll(activeView === 'largest' ? filteredLargestFiles : filteredRecentUploads)}
                        className="rounded border-slate-700 text-blue-600 focus:ring-0"
                      />
                    </th>
                    <th className="p-3.5">File Name & Path</th>
                    <th className="p-3.5">Bucket</th>
                    <th className="p-3.5">MIME Type</th>
                    <th className="p-3.5 text-right">Size</th>
                    <th className="p-3.5">Uploaded / Modified</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {(activeView === 'largest' ? filteredLargestFiles : filteredRecentUploads).map((file, idx) => {
                    const isSelected = selectedFiles.has(`${file.bucket}:::${file.path}`);
                    return (
                      <tr
                        key={`${file.bucket}-${file.path}-${idx}`}
                        className={`transition-colors ${isSelected ? 'bg-blue-950/20' : 'hover:bg-slate-800/30'}`}
                      >
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleFileSelection(file.bucket, file.path)}
                            className="rounded border-slate-700 text-blue-600 focus:ring-0"
                          />
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                            <div className="max-w-md truncate">
                              <span className="font-mono text-slate-200 font-semibold block truncate" title={file.name}>
                                {file.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block truncate" title={file.path}>
                                {file.path}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-300">
                          <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800">
                            {file.bucket}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-400">
                          {file.mimetype}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-100">
                          {file.formattedSize}
                        </td>
                        <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                          {formatDate(file.created_at || file.updated_at)}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {file.publicUrl && file.mimetype.startsWith('image/') && (
                              <button
                                onClick={() => setPreviewImage(file.publicUrl)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                title="Quick Preview"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {file.publicUrl && (
                              <a
                                href={file.publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors inline-flex items-center"
                                title="Open in new tab"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => setFileToDelete({
                                bucket: file.bucket,
                                path: file.path,
                                name: file.name,
                                size: file.formattedSize,
                                publicUrl: file.publicUrl
                              })}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800/50 transition-colors"
                              title="Delete file to clean up storage"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {(activeView === 'largest' ? filteredLargestFiles : filteredRecentUploads).length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No files matching the search and bucket filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: DELIVERED ORDERS PAYMENT PROOFS CLEANUP */}
      {activeView === 'cleanup' && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-amber-200/90">
                <p className="font-bold text-amber-300">Delivered Orders Cleanup Manager</p>
                <p>
                  Pruning payment screenshots of completed & delivered orders safely recovers Supabase storage without affecting order records.
                </p>
              </div>
            </div>

            {Boolean(data?.cleanupCandidates?.length) && (
              <button
                onClick={handlePruneAllDeliveredProofs}
                disabled={isPruningAllDelivered}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-950/40 shrink-0 disabled:opacity-50"
              >
                {isPruningAllDelivered ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isPruningAllDelivered ? 'Pruning...' : `Clean All (${data?.cleanupCandidates?.length}) Proofs`}</span>
              </button>
            )}
          </div>

          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Delivered Orders — Removable Payment Proofs</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review and prune payment proof screenshots for orders marked as Delivered
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {data?.cleanupCandidates?.length || 0} Candidate(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <th className="p-3.5">Order Info</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Proof File Name</th>
                    <th className="p-3.5">Bucket & Path</th>
                    <th className="p-3.5 text-right">Size</th>
                    <th className="p-3.5">Uploaded</th>
                    <th className="p-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {data?.cleanupCandidates?.map((candidate, idx) => (
                    <tr key={`${candidate.orderId}-${candidate.fileName}-${idx}`} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-bold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-emerald-400 font-bold">#{candidate.orderNumber}</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-semibold">
                            Delivered
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-300 font-medium">
                        {candidate.customerName}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-200 max-w-xs truncate" title={candidate.fileName}>
                        {candidate.fileName}
                      </td>
                      <td className="p-3.5 font-mono text-[10px] text-slate-400">
                        <span className="px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800">
                          {candidate.bucket}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-100">
                        {candidate.formattedSize}
                      </td>
                      <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                        {formatDate(candidate.uploadedAt)}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {candidate.fileUrl && (
                            <button
                              onClick={() => setPreviewImage(candidate.fileUrl)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Preview Receipt"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedCleanupCandidate(candidate)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 hover:text-white text-xs font-semibold transition-all"
                            title="Review & Clean Up"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Clean Up</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!data?.cleanupCandidates || data.cleanupCandidates.length === 0) && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                        <p className="font-semibold text-slate-300">No Cleanup Required</p>
                        <p className="text-xs text-slate-400 mt-1">
                          All payment proofs are organized or already pruned.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE FILE DELETE MODAL */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">Delete File from Storage</h3>
              </div>
              <button
                onClick={() => setFileToDelete(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {fileToDelete.publicUrl && (
              <div className="flex justify-center p-2 bg-slate-950 rounded-xl border border-slate-800">
                <img
                  src={fileToDelete.publicUrl}
                  alt={fileToDelete.name}
                  className="max-h-32 object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">File Name:</span>
                <span className="font-mono font-bold text-white truncate max-w-[200px]" title={fileToDelete.name}>{fileToDelete.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bucket:</span>
                <span className="text-slate-200 font-mono">{fileToDelete.bucket}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Storage Path:</span>
                <span className="font-mono text-slate-400 truncate max-w-[200px]" title={fileToDelete.path}>{fileToDelete.path}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Size to be freed:</span>
                <span className="font-mono font-bold text-emerald-400">{fileToDelete.size}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Are you sure you want to permanently delete this object from Supabase storage? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSingleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-rose-950/40"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Object'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH DELETE CONFIRMATION MODAL */}
      {isBatchConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">Batch Cleanup Confirmation</h3>
              </div>
              <button
                onClick={() => setIsBatchConfirmOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Files:</span>
                <span className="font-mono font-bold text-rose-400">{selectedFiles.size} Files</span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-slate-800/40 pr-1">
                {Array.from(selectedFiles).map((k, i) => {
                  const [b, p] = k.split(':::');
                  return (
                    <div key={i} className="pt-1 flex justify-between text-[11px] font-mono">
                      <span className="text-slate-300 truncate max-w-[220px]">{p}</span>
                      <span className="text-slate-500">[{b}]</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-slate-400">
              This will permanently delete all {selectedFiles.size} selected objects from your Supabase storage buckets and immediately free up storage space.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsBatchConfirmOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBatchDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-rose-950/40"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Cleaning Up...' : `Clean Up ${selectedFiles.size} Files`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELIVERED ORDER PROOF PRUNE MODAL */}
      {selectedCleanupCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-amber-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">Review & Clean Payment Receipt</h3>
              </div>
              <button
                onClick={() => setSelectedCleanupCandidate(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedCleanupCandidate.fileUrl && (
              <div className="flex justify-center p-2 bg-slate-950 rounded-xl border border-slate-800">
                <img
                  src={selectedCleanupCandidate.fileUrl}
                  alt={selectedCleanupCandidate.fileName}
                  className="max-h-36 object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-mono font-bold text-white">#{selectedCleanupCandidate.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="text-slate-200">{selectedCleanupCandidate.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-semibold">{selectedCleanupCandidate.orderStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Storage Size:</span>
                <span className="font-mono font-bold text-emerald-400">{selectedCleanupCandidate.formattedSize}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Pruning this screenshot permanently removes it from Supabase Storage. The order history, ledger, and customer receipt data remain intact.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedCleanupCandidate(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handlePruneCandidate}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Cleaning...' : 'Confirm Cleanup'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUOTA PLAN SETTINGS MODAL */}
      {isQuotaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-purple-400">
                <Sliders className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">Supabase Storage Plan Limit</h3>
              </div>
              <button
                onClick={() => setIsQuotaModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select your active Supabase subscription plan to accurately calculate remaining left storage:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => setCustomQuotaGb(1)}
                className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  customQuotaGb === 1
                    ? 'bg-purple-950/40 border-purple-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">Supabase Free Plan</div>
                  <div className="text-[11px] text-slate-400">1.00 GB total storage capacity</div>
                </div>
                {customQuotaGb === 1 && <Check className="w-4 h-4 text-purple-400" />}
              </button>

              <button
                onClick={() => setCustomQuotaGb(100)}
                className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  customQuotaGb === 100
                    ? 'bg-purple-950/40 border-purple-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">Supabase Pro Plan</div>
                  <div className="text-[11px] text-slate-400">100.00 GB total storage capacity</div>
                </div>
                {customQuotaGb === 100 && <Check className="w-4 h-4 text-purple-400" />}
              </button>

              <button
                onClick={() => setCustomQuotaGb(250)}
                className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  customQuotaGb === 250
                    ? 'bg-purple-950/40 border-purple-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">Supabase Team / Enterprise Plan</div>
                  <div className="text-[11px] text-slate-400">250.00 GB total storage capacity</div>
                </div>
                {customQuotaGb === 250 && <Check className="w-4 h-4 text-purple-400" />}
              </button>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs text-slate-400 block font-semibold">Custom GB Capacity:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={customQuotaGb}
                  onChange={e => setCustomQuotaGb(parseFloat(e.target.value) || 1)}
                  className="flex-1 px-3 py-2 bg-slate-950 rounded-xl text-xs text-white border border-slate-800 focus:outline-none focus:border-purple-500"
                />
                <span className="text-xs text-slate-400 font-mono">GB</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setIsQuotaModalOpen(false)}
                disabled={isUpdatingQuota}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveQuotaPlan(customQuotaGb)}
                disabled={isUpdatingQuota}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {isUpdatingQuota ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Capacity</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-3xl max-h-[85vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Storage Preview"
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl border border-slate-800"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
