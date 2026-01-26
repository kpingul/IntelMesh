'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ChevronRight,
  ExternalLink,
  Shield,
  Skull,
  Clock,
  Layers,
  GitBranch,
  X
} from 'lucide-react';
import { ThreatItem, Stats } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';

interface ThreadsViewProps {
  items: ThreatItem[];
  stats: Stats | null;
  isLoading: boolean;
  onItemClick: (item: ThreatItem) => void;
}

type FilterCategory = 'all' | 'ransomware' | 'phishing' | 'exploitation' | 'credential_theft' | 'c2';

export default function ThreadsView({
  items,
  stats,
  isLoading,
  onItemClick
}: ThreadsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [showFilters, setShowFilters] = useState(false);

  const categories: { id: FilterCategory; label: string; count: number }[] = useMemo(() => {
    const counts = {
      all: items.length,
      ransomware: items.filter(i => i.extracted.tags.includes('ransomware')).length,
      phishing: items.filter(i => i.extracted.tags.includes('phishing')).length,
      exploitation: items.filter(i => i.extracted.tags.includes('exploitation')).length,
      credential_theft: items.filter(i => i.extracted.tags.includes('credential_theft')).length,
      c2: items.filter(i => i.extracted.tags.includes('c2')).length,
    };
    return [
      { id: 'all', label: 'All Threads', count: counts.all },
      { id: 'ransomware', label: 'Ransomware', count: counts.ransomware },
      { id: 'phishing', label: 'Phishing', count: counts.phishing },
      { id: 'exploitation', label: 'Exploitation', count: counts.exploitation },
      { id: 'credential_theft', label: 'Credential Theft', count: counts.credential_theft },
      { id: 'c2', label: 'C2', count: counts.c2 },
    ];
  }, [items]);

  const filteredItems = useMemo(() => {
    let filtered = items;

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.extracted.tags.includes(selectedCategory));
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.extracted.cves.some(cve => cve.toLowerCase().includes(query)) ||
        item.extracted.threats.some(threat => threat.toLowerCase().includes(query)) ||
        item.extracted.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [items, selectedCategory, searchQuery]);

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      bleepingcomputer: 'bg-blue-100 text-blue-700',
      gbhackers: 'bg-emerald-100 text-emerald-700',
      thehackernews: 'bg-orange-100 text-orange-700',
      krebsonsecurity: 'bg-purple-100 text-purple-700',
      securityaffairs: 'bg-rose-100 text-rose-700',
      cisa: 'bg-red-100 text-red-700',
      pdf: 'bg-ink-100 text-ink-700',
    };
    return colors[source] || 'bg-ink-100 text-ink-600';
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-paper-200 rounded-xl" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-paper-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900 tracking-tight">
            Threat Threads
          </h1>
          <p className="text-ink-500 mt-1">
            {filteredItems.length} deduplicated threat stories from {Object.keys(stats?.sources || {}).length} sources
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search threads by title, CVE, threat actor, technique..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input pl-11"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Filter size={18} />
          Filters
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              selectedCategory === cat.id
                ? 'bg-ink-900 text-white'
                : 'bg-paper-100 text-ink-600 hover:bg-paper-200'
            }`}
          >
            {cat.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              selectedCategory === cat.id
                ? 'bg-white/20 text-white'
                : 'bg-ink-100 text-ink-500'
            }`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Thread List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-paper-50 rounded-2xl border border-ink-100">
            <Layers size={48} className="mx-auto text-ink-300 mb-4" />
            <h3 className="font-display text-lg font-semibold text-ink-700 mb-2">No threads found</h3>
            <p className="text-ink-500">
              {searchQuery ? 'Try adjusting your search or filters' : 'Sync news to see threat threads'}
            </p>
          </div>
        ) : (
          filteredItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => onItemClick(item)}
              className="thread-card cursor-pointer animate-fadeInUp"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Source & Date */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${getSourceColor(item.source)}`}>
                      {item.source}
                    </span>
                    <span className="text-xs text-ink-400 flex items-center gap-1">
                      <Clock size={12} />
                      {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-semibold text-ink-900 text-lg leading-snug mb-2 group-hover:text-accent-coral transition-colors">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-ink-600 text-sm line-clamp-2 mb-3">
                    {item.description}
                  </p>

                  {/* Tags & Entities */}
                  <div className="flex flex-wrap items-center gap-2">
                    {item.extracted.cves.slice(0, 2).map((cve) => (
                      <span key={cve} className="tag tag-cve">
                        <Shield size={12} />
                        {cve}
                      </span>
                    ))}
                    {item.extracted.actors.slice(0, 1).map((actor) => (
                      <span key={actor} className="tag tag-threat">
                        <Skull size={12} />
                        {actor}
                      </span>
                    ))}
                    {item.extracted.malware.slice(0, 1).map((malware) => (
                      <span key={malware} className="tag tag-threat">
                        {malware}
                      </span>
                    ))}
                    {item.extracted.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="tag tag-ttp capitalize">
                        {tag.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {(item.extracted.cves.length > 2 || item.extracted.tags.length > 2) && (
                      <span className="text-xs text-ink-400">
                        +{item.extracted.cves.length - 2 + item.extracted.tags.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side indicators */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <ChevronRight size={20} className="text-ink-300" />

                  {/* Entity counts */}
                  <div className="flex items-center gap-2 text-xs text-ink-400">
                    {item.extracted.cves.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Shield size={12} className="text-red-500" />
                        {item.extracted.cves.length}
                      </span>
                    )}
                    {item.extracted.ips.length + item.extracted.domains.length > 0 && (
                      <span className="flex items-center gap-1">
                        <GitBranch size={12} className="text-amber-500" />
                        {item.extracted.ips.length + item.extracted.domains.length}
                      </span>
                    )}
                    {item.extracted.threats.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Skull size={12} className="text-violet-500" />
                        {item.extracted.threats.length}
                      </span>
                    )}
                  </div>

                  {/* Has Attack Flow indicator */}
                  {item.extracted.tags.length >= 3 && (
                    <span className="text-xs text-accent-teal font-medium bg-accent-teal/10 px-2 py-0.5 rounded">
                      Attack Flow
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load more hint */}
      {filteredItems.length >= 10 && (
        <div className="text-center py-4">
          <p className="text-sm text-ink-400">
            Showing {filteredItems.length} threads • Scroll for more
          </p>
        </div>
      )}
    </div>
  );
}
