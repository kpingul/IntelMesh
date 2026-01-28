'use client';

import { useState, useMemo } from 'react';
import { ExternalLink, Shield, ChevronRight } from 'lucide-react';
import { ThreatItem, Stats } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface ThreadsViewProps {
  items: ThreatItem[];
  stats: Stats | null;
  isLoading: boolean;
  onItemClick: (item: ThreatItem) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'ransomware', label: 'Ransomware' },
  { id: 'phishing', label: 'Phishing' },
  { id: 'exploitation', label: 'Exploitation' },
  { id: 'malware', label: 'Malware' },
  { id: 'apt', label: 'APT' },
];

export default function ThreadsView({ items, stats, isLoading, onItemClick }: ThreadsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'severity' | 'cves'>('date');

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (selectedCategory !== 'all') {
      filtered = items.filter(item => {
        const tags = item.extracted.tags.map(t => t.toLowerCase());
        const content = (item.content || item.description).toLowerCase();
        const title = item.title.toLowerCase();

        switch (selectedCategory) {
          case 'ransomware':
            return tags.includes('ransomware') || content.includes('ransomware') || title.includes('ransomware');
          case 'phishing':
            return tags.includes('phishing') || content.includes('phishing') || title.includes('phishing');
          case 'exploitation':
            return tags.includes('exploitation') || item.extracted.cves.length > 0;
          case 'malware':
            return item.extracted.malware.length > 0;
          case 'apt':
            return item.extracted.actors.length > 0;
          default:
            return true;
        }
      });
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'severity':
          const getSeverityScore = (item: ThreatItem) => {
            let score = 0;
            score += item.extracted.cves.length * 3;
            score += item.extracted.actors.length * 2;
            score += item.extracted.malware.length * 2;
            return score;
          };
          return getSeverityScore(b) - getSeverityScore(a);
        case 'cves':
          return b.extracted.cves.length - a.extracted.cves.length;
        case 'date':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  }, [items, selectedCategory, sortBy]);

  const getSeverity = (item: ThreatItem) => {
    if (item.extracted.cves.length > 0) return 'critical';
    if (item.extracted.malware.length > 0 || item.extracted.actors.length > 0) return 'high';
    return 'medium';
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 skeleton rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col bg-slate-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Articles</h1>
            <p className="text-sm text-slate-500">{filteredItems.length} items</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white"
          >
            <option value="date">Sort by Date</option>
            <option value="severity">Sort by Severity</option>
            <option value="cves">Sort by CVEs</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No articles found. Try a different filter or sync new data.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const severity = getSeverity(item);
              return (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="w-full bg-white p-4 rounded-lg border border-slate-200 text-left hover:border-slate-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-1 h-16 rounded-full flex-shrink-0 ${
                      severity === 'critical' ? 'bg-red-500' :
                      severity === 'high' ? 'bg-orange-500' : 'bg-amber-500'
                    }`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-medium ${
                          severity === 'critical' ? 'bg-red-100 text-red-700' :
                          severity === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {severity}
                        </span>
                        <span className="text-xs text-slate-400 capitalize">{item.source}</span>
                        <span className="text-xs text-slate-400">
                          {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                        </span>
                      </div>

                      <h3 className="text-sm font-medium text-slate-800 mb-2 line-clamp-2 group-hover:text-slate-900">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                        {item.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {item.extracted.cves.slice(0, 3).map(cve => (
                          <span key={cve} className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded flex items-center gap-1">
                            <Shield size={10} />
                            {cve}
                          </span>
                        ))}
                        {item.extracted.malware.slice(0, 2).map(m => (
                          <span key={m} className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded">
                            {m}
                          </span>
                        ))}
                        {item.extracted.actors.slice(0, 2).map(a => (
                          <span key={a} className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded">
                            {a}
                          </span>
                        ))}
                        {item.extracted.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded capitalize">
                            {tag.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {item.extracted.products?.slice(0, 2).map(p => (
                          <span key={p} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded capitalize">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
