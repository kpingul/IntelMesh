// Type definitions for the Threat Intel Dashboard

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
}

export interface Hash {
  type: 'md5' | 'sha1' | 'sha256';
  value: string;
}

export interface ThreatItem {
  id: string;
  title: string;
  source: 'bleepingcomputer' | 'gbhackers' | 'pdf';
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
  sources: {
    bleepingcomputer: number;
    gbhackers: number;
    pdf: number;
  };
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

export type ViewType = 'overview' | 'cves' | 'iocs' | 'threats' | 'items';
