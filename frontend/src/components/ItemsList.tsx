'use client';

import { ExternalLink, FileText, Clock, Shield, Target, ChevronRight, Inbox } from 'lucide-react';
import { ThreatItem } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface ItemsListProps {
  items: ThreatItem[];
  onItemClick: (item: ThreatItem) => void;
  selectedItemId?: string;
  isLoading: boolean;
  title?: string;
}

export default function ItemsList({
  items,
  onItemClick,
  selectedItemId,
  isLoading,
  title = 'Recent Items'
}: ItemsListProps) {
  const getSourceStyle = (source: string) => {
    switch (source) {
      case 'bleepingcomputer':
        return {
          bg: 'bg-accent-cyan/10',
          text: 'text-accent-cyan',
          border: 'border-accent-cyan/20',
          label: 'BleepingComputer'
        };
      case 'gbhackers':
        return {
          bg: 'bg-accent-emerald/10',
          text: 'text-accent-emerald',
          border: 'border-accent-emerald/20',
          label: 'GBHackers'
        };
      case 'pdf':
        return {
          bg: 'bg-accent-violet/10',
          text: 'text-accent-violet',
          border: 'border-accent-violet/20',
          label: 'PDF'
        };
      default:
        return {
          bg: 'bg-dark-600/50',
          text: 'text-dark-100',
          border: 'border-dark-500/50',
          label: source
        };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-display font-semibold text-white">{title}</h3>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl p-5 bg-dark-700/30 border border-dark-600/30">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="skeleton h-5 w-3/4" />
                <div className="flex gap-3">
                  <div className="skeleton h-6 w-24 rounded-lg" />
                  <div className="skeleton h-6 w-20 rounded-lg" />
                </div>
                <div className="flex gap-2">
                  <div className="skeleton h-6 w-16 rounded-md" />
                  <div className="skeleton h-6 w-20 rounded-md" />
                </div>
              </div>
              <div className="skeleton w-10 h-10 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-2xl bg-dark-700/30 border border-dark-600/30 mb-5">
          <Inbox size={48} className="text-dark-300" />
        </div>
        <h3 className="text-lg font-display font-semibold text-dark-100">No items yet</h3>
        <p className="text-dark-200 mt-2 max-w-sm">
          Sync news or upload PDFs to start collecting threat intelligence
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-display font-semibold text-white">{title}</h3>
        <span className="text-xs font-mono text-dark-200 px-2 py-1 rounded-lg bg-dark-700/50">
          {items.length} items
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => {
          const sourceStyle = getSourceStyle(item.source);
          const isSelected = selectedItemId === item.id;
          const totalIocs = item.extracted.ips.length + item.extracted.domains.length + item.extracted.hashes.length;

          return (
            <div
              key={item.id}
              onClick={() => onItemClick(item)}
              className={`group relative rounded-2xl p-5 cursor-pointer transition-all duration-300 animate-fadeInUp ${
                isSelected
                  ? 'bg-accent-cyan/5 border border-accent-cyan/30 shadow-lg shadow-accent-cyan/10'
                  : 'bg-dark-700/30 border border-dark-600/30 hover:bg-dark-700/50 hover:border-dark-500/50'
              }`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-accent-cyan to-accent-violet" />
              )}

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <h4 className={`font-medium leading-snug line-clamp-2 transition-colors duration-200 ${
                    isSelected ? 'text-white' : 'text-dark-100 group-hover:text-white'
                  }`}>
                    {item.title}
                  </h4>

                  {/* Metadata row */}
                  <div className="flex items-center gap-3 mt-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${sourceStyle.bg} ${sourceStyle.text} ${sourceStyle.border}`}>
                      {sourceStyle.label}
                    </span>
                    <span className="flex items-center gap-1.5 text-dark-200 text-sm">
                      <Clock size={13} />
                      {formatDate(item.date)}
                    </span>
                  </div>

                  {/* Entity badges */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {item.extracted.cves.length > 0 && (
                      <span className="tag tag-cve">
                        <Shield size={11} />
                        {item.extracted.cves.length} CVE{item.extracted.cves.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {totalIocs > 0 && (
                      <span className="tag tag-ioc">
                        <Target size={11} />
                        {totalIocs} IoC{totalIocs > 1 ? 's' : ''}
                      </span>
                    )}
                    {item.extracted.threats.length > 0 && (
                      <span className="tag tag-threat">
                        {item.extracted.threats.slice(0, 2).join(', ')}
                        {item.extracted.threats.length > 2 && ` +${item.extracted.threats.length - 2}`}
                      </span>
                    )}
                    {item.extracted.tags.slice(0, 2).map((tag, j) => (
                      <span key={j} className="tag tag-ttp">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col items-center gap-2">
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-dark-300 hover:text-accent-cyan hover:bg-accent-cyan/10 rounded-lg transition-all duration-200"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <div className={`p-2 rounded-lg transition-all duration-200 ${
                    isSelected
                      ? 'text-accent-cyan bg-accent-cyan/10'
                      : 'text-dark-300 group-hover:text-white group-hover:bg-dark-600/50'
                  }`}>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
