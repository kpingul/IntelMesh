// API utilities for communicating with the FastAPI backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Stats
export async function getStats() {
  return fetchAPI<import('@/types').Stats>('/api/stats');
}

// Items
export async function getItems(source?: string, limit = 50) {
  const params = new URLSearchParams();
  if (source) params.set('source', source);
  params.set('limit', limit.toString());
  return fetchAPI<{ items: import('@/types').ThreatItem[]; total: number }>(
    `/api/items?${params}`
  );
}

export async function getItem(id: string) {
  return fetchAPI<import('@/types').ThreatItem>(`/api/items/${id}`);
}

// CVEs
export async function getCVEs() {
  return fetchAPI<{ cves: import('@/types').CVEEntry[] }>('/api/cves');
}

// IoCs
export async function getIoCs() {
  return fetchAPI<import('@/types').IoCs>('/api/iocs');
}

// Threats
export async function getThreats() {
  return fetchAPI<{ threats: import('@/types').ThreatEntry[] }>('/api/threats');
}

// Sync news
export async function syncNews(
  sources?: string[],
  limitPerSource = 15,
  fetchFullContent = true
) {
  return fetchAPI<{
    success: boolean;
    message: string;
    articles_processed: number;
    sources: string[];
    stats: import('@/types').Stats;
  }>('/api/sync', {
    method: 'POST',
    body: JSON.stringify({
      sources,
      limit_per_source: limitPerSource,
      fetch_full_content: fetchFullContent,
    }),
  });
}

// Upload PDFs
export async function uploadPDFs(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  return response.json();
}

// Search
export async function search(query: string) {
  return fetchAPI<import('@/types').SearchResult>('/api/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

// Clear data
export async function clearData() {
  return fetchAPI<{ success: boolean; message: string }>('/api/clear', {
    method: 'DELETE',
  });
}
