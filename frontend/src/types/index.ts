// Type definitions for Cyber Threat Radar

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
  source: 'bleepingcomputer' | 'gbhackers' | 'thehackernews' | 'krebsonsecurity' | 'securityaffairs' | 'threatpost' | 'securityweek' | 'cisa' | 'talos' | 'unit42' | 'mandiant' | 'recordedfuture' | 'pdf';
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

// New types for Cyber Threat Radar
export type ViewType = 'today' | 'briefings' | 'trends' | 'threads' | 'playbooks' | 'learning' | 'settings';

export type BriefingMode = 'executive' | 'analyst' | 'engineer';

export type BriefingPeriod = 'daily' | 'weekly' | 'monthly';

export interface BriefingBullet {
  id: string;
  text: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  relatedThreadId?: string;
  tags?: string[];
}

export interface ThreatThread {
  id: string;
  title: string;
  summary: string[];
  category: string;
  tags: string[];
  entities: {
    cves: string[];
    vendors: string[];
    actors: string[];
    malware: string[];
    techniques: string[];
  };
  whyItMatters: string;
  sources: ThreatItem[];
  hasAttackFlow: boolean;
  updatedAt: string;
  sourceCount: number;
}

export interface AttackFlowStep {
  id: string;
  order: number;
  title: string;
  description: string;
  attackerAction: string;
  defenderLookFor: string[];
  mitigations: string[];
  detectionIdeas: string[];
  technique?: string;
}

export interface Playbook {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  techniques: string[];
  steps: AttackFlowStep[];
  threadId?: string;
}

export interface LearningQueueItem {
  id: string;
  type: 'thread' | 'playbook';
  itemId: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'learned';
  notes?: string;
  reviewLater: boolean;
  addedAt: string;
}

export interface UserPreferences {
  briefingMode: BriefingMode;
  briefingLength: 5 | 10 | 15;
  preferredCategories: string[];
  preferredVendors: string[];
  preferredTechniques: string[];
  watchlist: WatchlistItem[];
  trendWindow: '7d' | '30d' | '90d';
}

export interface WatchlistItem {
  id: string;
  type: 'vendor' | 'technique' | 'actor' | 'category' | 'cve';
  value: string;
}

export interface TrendInsight {
  id: string;
  text: string;
  type: 'rising' | 'falling' | 'persistent' | 'new';
  relatedEntity: string;
  confidence: number;
}

export interface CategoryTrend {
  category: string;
  data: { date: string; count: number }[];
  change: number;
  direction: 'up' | 'down' | 'stable';
}
