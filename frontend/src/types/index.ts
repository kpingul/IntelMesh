// Type definitions for Threat Intel Dashboard

export interface ExtractedEntities {
  cves: string[];
  ips: string[];
  domains: string[];
  urls: string[];
  hashes: Hash[];
  threats: string[];
  malware: string[];
  actors: string[];
  tags: string[];
  products: string[];
  geography: string[];
  sectors: string[];
}

export interface Hash {
  type: 'md5' | 'sha1' | 'sha256';
  value: string;
}

export interface ThreatItem {
  id: string;
  title: string;
  source: string;
  date: string;
  description: string;
  content?: string;
  url?: string;
  filename?: string;
  extracted: ExtractedEntities;
  evidence?: Evidence[];
  added_at: string;
}

export interface Evidence {
  entity: string;
  snippet: string;
  type: 'cve' | 'ioc' | 'threat';
}

export interface Stats {
  total_items: number;
  articles: number;
  pdfs: number;
  total_cves: number;
  total_iocs: number;
  total_threats: number;
  ioc_breakdown: {
    ips: number;
    domains: number;
    hashes: number;
    urls: number;
  };
  top_cves: [string, number][];
  top_threats: [string, number][];
  all_cves: string[];
  all_threats: string[];
  all_malware: string[];
  all_actors: string[];
  tag_counts: Record<string, number>;
  product_counts: Record<string, number>;
  geography_counts: Record<string, number>;
  sector_counts: Record<string, number>;
  sources: Record<string, number>;
}

export interface CVEEntry {
  id: string;
  count: number;
  sources: string[];
  items: { id: string; title: string; source: string }[];
}

export interface ThreatEntry {
  name: string;
  type: 'malware' | 'actor';
  count: number;
  items: { id: string; title: string }[];
}

export interface IoCs {
  ips: { value: string; source_item: { id: string; title: string; source: string } }[];
  domains: { value: string; source_item: { id: string; title: string; source: string } }[];
  urls: { value: string; source_item: { id: string; title: string; source: string } }[];
  hashes: { value: string; type: string; source_item: { id: string; title: string; source: string } }[];
}

export interface ParsedQuery {
  query_type: string | null;
  keywords: string[];
  cve_id: string | null;
  time_range: string | null;
  source: string | null;
  entity_type: string | null;
  raw_query: string;
}

export interface SearchResult {
  query: string;
  parsed_query: ParsedQuery;
  answer_summary: string;
  result_count: number;
  results: ThreatItem[];
}

// View types
export type ViewType = 'today' | 'trends' | 'threads' | 'feeds' | 'settings';

// Feed types
export interface FeedIOC {
  id: string;
  ioc_type: 'ip' | 'domain' | 'url' | 'hash';
  ioc_value: string;
  threat_type: string;
  malware_family?: string;
  confidence?: number;
  first_seen?: string;
  last_seen?: string;
  source: string;
  tags: string[];
  reference?: string;
}

export interface FeedCVE {
  cve_id: string;
  vendor: string;
  product: string;
  vulnerability_name: string;
  date_added: string;
  due_date?: string;
  known_ransomware: boolean;
  notes: string;
  source: string;
}

export interface FeedStats {
  total_feed_iocs: number;
  total_feed_cves: number;
  by_source: Record<string, number>;
  by_ioc_type: Record<string, number>;
  by_threat_type: Record<string, number>;
  malware_families: Record<string, number>;
  ransomware_cves: number;
  last_updated: Record<string, string>;
  top_malware: [string, number][];
}

// User preferences types
export interface WatchlistItem {
  id: string;
  type: 'vendor' | 'technique' | 'actor' | 'category' | 'cve';
  value: string;
}

export interface UserPreferences {
  briefingMode: 'executive' | 'analyst' | 'engineer';
  briefingLength: number;
  preferredCategories: string[];
  preferredVendors: string[];
  preferredTechniques: string[];
  watchlist: WatchlistItem[];
  trendWindow: '7d' | '30d' | '90d';
}
