'use client';

import { useState, useMemo } from 'react';
import {
  Calendar,
  TrendingUp,
  ChevronRight,
  Shield,
  FileText,
  AlertTriangle,
  Radio
} from 'lucide-react';
import { Stats, ThreatItem, BriefingPeriod } from '@/types';
import { format, subDays, isAfter, formatDistanceToNow } from 'date-fns';

interface BriefingsViewProps {
  stats: Stats | null;
  items: ThreatItem[];
  isLoading: boolean;
  onItemClick: (item: ThreatItem) => void;
}

export default function BriefingsView({
  stats,
  items,
  isLoading,
  onItemClick
}: BriefingsViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<BriefingPeriod>('daily');

  const periodItems = useMemo(() => {
    const now = new Date();
    const cutoff = selectedPeriod === 'daily'
      ? subDays(now, 1)
      : selectedPeriod === 'weekly'
      ? subDays(now, 7)
      : subDays(now, 30);

    return items.filter(item => isAfter(new Date(item.date), cutoff));
  }, [items, selectedPeriod]);

  const periodInsights = useMemo(() => {
    const cveItems = periodItems.filter(i => i.extracted.cves.length > 0);
    const threatItems = periodItems.filter(i => i.extracted.threats.length > 0);
    const tagCounts: Record<string, number> = {};

    periodItems.forEach(item => {
      item.extracted.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    const priorityItems = periodItems.filter(
      i => i.extracted.cves.length > 0 || i.extracted.actors.length > 0 || i.extracted.malware.length > 0
    );

    return {
      totalArticles: periodItems.length,
      cveCount: cveItems.reduce((acc, i) => acc + i.extracted.cves.length, 0),
      threatCount: threatItems.reduce((acc, i) => acc + i.extracted.threats.length, 0),
      topTags,
      uniqueSources: new Set(periodItems.map(i => i.source)).size,
      priorityItems: priorityItems.slice(0, 7),
    };
  }, [periodItems]);

  const getSeverityLevel = (item: ThreatItem) => {
    if (item.extracted.cves.length > 0) return 'critical';
    if (item.extracted.malware.length > 0 || item.extracted.actors.length > 0) return 'high';
    if (item.extracted.tags.includes('ransomware')) return 'critical';
    return 'medium';
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-12 skeleton rounded-lg" />
        <div className="h-24 skeleton rounded-xl" />
        <div className="h-64 skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Intelligence Briefings</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Curated threat intelligence summaries
            </p>
          </div>

          {/* Period Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors capitalize ${
                  selectedPeriod === period
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar size={14} />
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-blue-500" />
              <div>
                <div className="text-2xl font-semibold text-slate-900">{periodInsights.totalArticles}</div>
                <div className="text-sm text-slate-500">Intel Items</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 border-l-4 border-l-red-500">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-red-500" />
              <div>
                <div className="text-2xl font-semibold text-red-600">{periodInsights.cveCount}</div>
                <div className="text-sm text-slate-500">CVEs Found</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 border-l-4 border-l-slate-500">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-slate-500" />
              <div>
                <div className="text-2xl font-semibold text-slate-600">{periodInsights.threatCount}</div>
                <div className="text-sm text-slate-500">Threats</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-3">
              <Radio size={18} className="text-amber-500" />
              <div>
                <div className="text-2xl font-semibold text-amber-600">{periodInsights.uniqueSources}</div>
                <div className="text-sm text-slate-500">Sources</div>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Intelligence */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              <div>
                <h3 className="font-medium text-slate-900">Priority Intelligence</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedPeriod === 'daily' ? 'Last 24 hours' : selectedPeriod === 'weekly' ? 'Last 7 days' : 'Last 30 days'}
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-500">
              {periodInsights.priorityItems.length} items
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {periodInsights.priorityItems.length === 0 ? (
              <div className="p-8 text-center">
                <Radio size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 text-sm">No priority intel for this period.</p>
              </div>
            ) : (
              periodInsights.priorityItems.map((item) => {
                const severity = getSeverityLevel(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => onItemClick(item)}
                    className="w-full p-4 text-left hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-1 h-12 rounded-full flex-shrink-0 ${
                        severity === 'critical' ? 'bg-red-500' :
                        severity === 'high' ? 'bg-orange-500' : 'bg-amber-500'
                      }`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-medium ${
                            severity === 'critical' ? 'bg-red-100 text-red-700' :
                            severity === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {severity}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                          </span>
                        </div>

                        <h4 className="text-sm text-slate-800 group-hover:text-slate-900 line-clamp-2 transition-colors">
                          {item.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {item.extracted.cves.slice(0, 2).map(cve => (
                            <span key={cve} className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded">
                              {cve}
                            </span>
                          ))}
                          {item.extracted.actors.slice(0, 1).map(actor => (
                            <span key={actor} className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded">
                              {actor}
                            </span>
                          ))}
                        </div>
                      </div>

                      <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 flex-shrink-0 mt-1 transition-colors" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Two column section */}
        <div className="grid grid-cols-2 gap-6">
          {/* Trending Techniques */}
          {periodInsights.topTags.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-blue-500" />
                <h3 className="font-medium text-slate-800 text-sm">Trending Techniques</h3>
              </div>
              <div className="space-y-3">
                {periodInsights.topTags.map((tech) => (
                  <div key={tech.tag} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 capitalize">{tech.tag.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{tech.count}</span>
                      <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(tech.count / periodInsights.topTags[0].count) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Insight */}
          <div className="bg-white rounded-lg border border-slate-200 border-l-4 border-l-amber-500 p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-amber-500" />
              <h3 className="font-medium text-slate-800 text-sm">Key Insight</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {periodInsights.topTags.length > 0 ? (
                <>
                  <span className="text-amber-600 font-medium capitalize">
                    {periodInsights.topTags[0].tag.replace(/_/g, ' ')}
                  </span>{' '}
                  is the dominant technique this {selectedPeriod === 'daily' ? 'day' : selectedPeriod === 'weekly' ? 'week' : 'month'}, appearing in{' '}
                  <span className="font-medium text-slate-800">{periodInsights.topTags[0].count}</span> intel items.
                  Focus defensive monitoring on this attack vector.
                </>
              ) : (
                'Sync intel to generate insights for this period.'
              )}
            </p>
            {periodInsights.topTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {periodInsights.topTags.slice(0, 3).map(tech => (
                  <span key={tech.tag} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded capitalize">
                    {tech.tag.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* All Items */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-medium text-slate-800 text-sm">
              All Intel ({selectedPeriod === 'daily' ? 'Today' : selectedPeriod === 'weekly' ? 'This Week' : 'This Month'})
            </h3>
            <span className="text-xs text-slate-500">{periodItems.length} items</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {periodItems.slice(0, 15).map((item) => (
              <button
                key={item.id}
                onClick={() => onItemClick(item)}
                className="w-full p-3 text-left hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      item.extracted.cves.length > 0 ? 'bg-red-500' :
                      item.extracted.threats.length > 0 ? 'bg-slate-500' : 'bg-blue-500'
                    }`} />
                    <h4 className="text-sm text-slate-600 group-hover:text-slate-900 line-clamp-1 transition-colors">
                      {item.title}
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {format(new Date(item.date), 'MMM d')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
