import { getAdminAuthToken, getAdminPin } from '../utils/storage';
import { supabase } from '../lib/supabase';

export interface StorageBucketStat {
  id: string;
  name: string;
  isPublic: boolean;
  fileSizeLimit: number | null;
  fileCount: number;
  usedBytes: number;
  usedFormatted: string;
  percentageOfTotal: number;
}

export interface StorageFileItem {
  bucket: string;
  name: string;
  path: string;
  size: number;
  formattedSize: string;
  mimetype: string;
  created_at: string | null;
  updated_at: string | null;
  publicUrl: string | null;
}

export interface StorageCleanupCandidate {
  orderId: string;
  orderNumber: string;
  customerName: string;
  orderStatus: string;
  paymentStatus: string;
  fileName: string;
  fileUrl: string;
  bucket: string;
  storagePath: string;
  size: number;
  formattedSize: string;
  uploadedAt: string | null;
}

export interface StorageQuotaInfo {
  available: boolean;
  planName?: string;
  quotaMb?: number;
  message: string;
  totalCapacity?: number | null;
  totalCapacityBytes?: number | null;
  totalCapacityFormatted?: string | null;
  totalUsedBytes?: number | null;
  totalUsedFormatted?: string | null;
  remainingBytes?: number | null;
  remainingFormatted?: string | null;
  usagePercentage?: number | null;
  remainingPercentage?: number | null;
}

export interface StorageHealthResponse {
  success: boolean;
  status: 'Healthy' | 'Warning' | 'Critical';
  connected: boolean;
  totalUsedBytes: number;
  totalUsedFormatted: string;
  totalCapacityBytes?: number;
  totalCapacityFormatted?: string;
  remainingBytes?: number;
  remainingFormatted?: string;
  usagePercentage?: number;
  remainingPercentage?: number;
  totalFileCount: number;
  bucketCount: number;
  buckets: StorageBucketStat[];
  largestFiles: StorageFileItem[];
  recentUploads: StorageFileItem[];
  cleanupCandidates: StorageCleanupCandidate[];
  quotaInfo: StorageQuotaInfo;
  serverTime: string;
  lastCheckedAt: string;
  error?: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token || getAdminAuthToken() || getAdminPin() || '8002';
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    const token = getAdminAuthToken() || getAdminPin() || '8002';
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * Fetch real Supabase Storage usage and health statistics from Admin backend API
 */
export async function fetchStorageHealth(): Promise<StorageHealthResponse> {
  const headers = await getAuthHeaders();

  const res = await fetch('/api/admin/storage-health', {
    method: 'GET',
    headers
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Server returned non-JSON response (HTTP ${res.status}): ${text.slice(0, 120)}`);
  }

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Failed to fetch storage health (HTTP ${res.status})`);
  }

  return data;
}

/**
 * Prune a single reviewed payment proof belonging to a Delivered order or any selected file
 */
export async function pruneDeliveredOrderProof(
  bucket: string,
  storagePath: string,
  orderId?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  return deleteStorageFile(bucket, storagePath, orderId);
}

/**
 * Delete a single file from Supabase storage
 */
export async function deleteStorageFile(
  bucket: string,
  storagePath: string,
  orderId?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const headers = await getAuthHeaders();

  const res = await fetch('/api/admin/storage-health/cleanup-file', {
    method: 'POST',
    headers,
    body: JSON.stringify({ bucket, storagePath, orderId })
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Server error (HTTP ${res.status}): ${text.slice(0, 120)}`);
  }

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Cleanup request failed with HTTP ${res.status}`);
  }

  return data;
}

/**
 * Batch delete multiple files from Supabase storage
 */
export async function deleteStorageFilesBatch(
  files: Array<{ bucket: string; storagePath: string; orderId?: string }>
): Promise<{ success: boolean; message?: string; deletedCount?: number; error?: string }> {
  const headers = await getAuthHeaders();

  const res = await fetch('/api/admin/storage-health/cleanup-batch', {
    method: 'POST',
    headers,
    body: JSON.stringify({ files })
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Server error (HTTP ${res.status}): ${text.slice(0, 120)}`);
  }

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Batch cleanup request failed with HTTP ${res.status}`);
  }

  return data;
}

/**
 * Update Supabase Storage plan quota capacity (e.g. 1024 MB for Free, 102400 MB for Pro, etc.)
 */
export async function updateStorageQuotaPlan(
  quotaMb: number,
  planName?: string
): Promise<{ success: boolean; message?: string; quotaMb?: number; planName?: string; error?: string }> {
  const headers = await getAuthHeaders();

  const res = await fetch('/api/admin/storage-health/update-quota', {
    method: 'POST',
    headers,
    body: JSON.stringify({ quotaMb, planName })
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Server error (HTTP ${res.status}): ${text.slice(0, 120)}`);
  }

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Failed to update storage plan (HTTP ${res.status})`);
  }

  return data;
}
