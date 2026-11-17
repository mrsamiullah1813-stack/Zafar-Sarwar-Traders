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

const CLIENT_STORAGE_HEALTH_TTL_MS = 30_000;
let cachedStorageHealth: { data: StorageHealthResponse; expiresAt: number } | null = null;
let inFlightStorageHealth: Promise<StorageHealthResponse> | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseRetryAfterMs(res: Response, attempt: number): number {
  const retryAfter = res.headers.get('retry-after');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (!Number.isNaN(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, 10_000);
    }
  }
  return Math.min(1200 * Math.pow(2, attempt), 6000);
}

/**
 * Clear client cache after storage mutations (cleanup / quota update)
 */
export function clearStorageHealthClientCache(): void {
  cachedStorageHealth = null;
}

/**
 * Fetch real Supabase Storage usage and health statistics from Admin backend API
 * Includes in-flight request coalescing, short-lived caching, and HTTP 429 retry/backoff.
 */
export async function fetchStorageHealth(forceRefresh = false): Promise<StorageHealthResponse> {
  if (!forceRefresh && cachedStorageHealth && Date.now() < cachedStorageHealth.expiresAt) {
    return cachedStorageHealth.data;
  }

  if (inFlightStorageHealth && !forceRefresh) {
    return inFlightStorageHealth;
  }

  const runFetch = async (): Promise<StorageHealthResponse> => {
    const headers = await getAuthHeaders();
    const url = forceRefresh ? '/api/admin/storage-health?force=1' : '/api/admin/storage-health';
    const maxAttempts = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers
        });

        // Handle reverse-proxy / upstream rate limiting cleanly with retry/backoff
        if (res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504) {
          const waitMs = parseRetryAfterMs(res, attempt);
          const bodySnippet = (await res.text().catch(() => '')).trim().slice(0, 120);
          lastError = new Error(
            res.status === 429
              ? `Storage health temporarily rate-limited (HTTP 429${bodySnippet ? `: ${bodySnippet}` : ''}).`
              : `Storage health service temporarily unavailable (HTTP ${res.status}).`
          );

          if (attempt < maxAttempts - 1) {
            await sleep(waitMs);
            continue;
          }

          // If we already have prior telemetry in memory, keep displaying it rather than crashing the view
          if (cachedStorageHealth?.data) {
            return cachedStorageHealth.data;
          }
          throw lastError;
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const text = await res.text();
          throw new Error(`Server returned non-JSON response (HTTP ${res.status}): ${text.slice(0, 120)}`);
        }

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Failed to fetch storage health (HTTP ${res.status})`);
        }

        cachedStorageHealth = {
          data,
          expiresAt: Date.now() + CLIENT_STORAGE_HEALTH_TTL_MS
        };
        return data;
      } catch (err: any) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const isTransient =
          lastError.message.includes('HTTP 429') ||
          lastError.message.includes('Failed to fetch') ||
          lastError.message.includes('NetworkError');

        if (isTransient && attempt < maxAttempts - 1) {
          await sleep(1200 * (attempt + 1));
          continue;
        }

        if (cachedStorageHealth?.data && isTransient) {
          return cachedStorageHealth.data;
        }
        throw lastError;
      }
    }

    throw lastError || new Error('Unable to retrieve Supabase storage health.');
  };

  inFlightStorageHealth = runFetch().finally(() => {
    inFlightStorageHealth = null;
  });

  return inFlightStorageHealth;
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

  if (res.status === 429) {
    throw new Error('Request temporarily rate-limited (HTTP 429). Please wait a few seconds and try again.');
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Server error (HTTP ${res.status}): ${text.slice(0, 120)}`);
  }

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Cleanup request failed with HTTP ${res.status}`);
  }

  clearStorageHealthClientCache();
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

  if (res.status === 429) {
    throw new Error('Request temporarily rate-limited (HTTP 429). Please wait a few seconds and try again.');
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Server error (HTTP ${res.status}): ${text.slice(0, 120)}`);
  }

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Batch cleanup request failed with HTTP ${res.status}`);
  }

  clearStorageHealthClientCache();
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

  if (res.status === 429) {
    throw new Error('Request temporarily rate-limited (HTTP 429). Please wait a few seconds and try again.');
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Server error (HTTP ${res.status}): ${text.slice(0, 120)}`);
  }

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Failed to update storage plan (HTTP ${res.status})`);
  }

  clearStorageHealthClientCache();
  return data;
}
