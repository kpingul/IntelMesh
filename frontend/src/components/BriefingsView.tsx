'use client';

import { useState, useMemo } from 'react';
import {
  Calendar,
  TrendingUp,
  Lightbulb,
  ChevronRight,
  Shield,
  Skull,
  Target,
  FileText,
  BarChart3,
  ArrowUpRight
} from 'lucide-react';
import { Stats, ThreatItem, BriefingPeriod } from '@/types';
import { format, subDays, isAfter } from 'date-fns';

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

  // Filter items based on period
  const periodItems = useMemo(() => {
    const now = new Date();
    const cutoff = selectedPeriod === 'daily'
      ? subDays(now, 1)
      : selectedPeriod === 'weekly'
      ? subDays(now, 7)
      : subDays(now, 30);

    return items.filter(item => isAfter(new Date(item.date), cutoff));
  }, [items, selectedPeriod]);

  // Generate period-specific insights
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
      .map(([tag]) => tag);

    return {
      totalArticles: periodItems.length,
      cveCount: cveItems.reduce((acc, i) => acc + i.extracted.cves.length, 0),
      threatCount: threatItems.reduce((acc, i) => acc + i.extracted.threats.length, 0),
      topTags,
      uniqueSources: new Set(periodItems.map(i => i.source)).size,
    };
  }, [periodItems]);

  const renderDailyBriefing = () => (
    <div className="space-y-6">
      {/* What Matters Today */}
      <div className="bg-white rounded-2xl border border-ink-100 shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-ink-100 bg-gradient-to-r from-paper-50 to-white">
          <h3 className="font-display font-semibold text-ink-900">What Matters Today</h3>
          <p className="text-sm text-ink-500 mt-1">{periodInsights.totalArticles} articles processed</p>
        </div>
        <div className="p-6">
          <ul className="space-y-3">
            {periodItems.slice(0, 7).map((item, index) => (
              <li key={item.id} className="animate-fadeInUp" style={{ animationDelay: `${index * 50}ms` }}>
                <button
                  onClick={() => onItemClick(item)}
                  className="w-full flex items-start gap-4 p-3 rounded-xl hover:bg-paper-50 transition-colors text-left group"
                >
                  <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    item.extracted.cves.length > 0 ? 'bg-red-500' :
                    item.extracted.threats.length > 0 ? 'bg-violet-500' : 'bg-accent-teal'
                  }`} />
                  <span className="flex-1 text-ink-700 text-sm group-hover:text-ink-900">{item.title}</span>
                  <ChevronRight size={16} className="text-ink-300 group-hover:text-accent-coral mt-0.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Technique Spotlight */}
      {periodInsights.topTags.length > 0 && (
        <div className="insight-card">
          <div className="pl-4 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-accent-teal/10 flex-shrink-0">
              <Lightbulb size={20} className="text-accent-teal" />
            </div>
            <div>
              <h4 className="font-display font-semibold text-ink-900 mb-2">Technique Spotlight</h4>
              <p className="text-ink-600 text-sm leading-relaxed mb-3">
                <strong className="capitalize">{periodInsights.topTags[0]?.replace(/_/g, ' ')}</strong> is the most common technique today.
                Understanding how attackers leverage this technique will help you identify potential threats earlier.
              </p>
              <div className="flex flex-wrap gap-2">
                {periodInsights.topTags.map(tag => (
                  <span key={tag} className="tag tag-ttp capitalize">{tag.replace(/_/g, ' ')}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderWeeklyBriefing = () => (
    <div className="space-y-6">
      {/* This Week's Patterns */}
      <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-6">
        <h3 className="font-display font-semibold text-ink-900 mb-6 flex items-center gap-2">
          <BarChart3 size={18} className="text-accent-coral" />
          This Week's Patterns
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-paper-50 rounded-xl">
            <div className="text-3xl font-display font-semibold text-ink-900">{periodInsights.totalArticles}</div>
            <div className="text-xs text-ink-500 mt-1">Articles</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-xl">
            <div className="text-3xl font-display font-semibold text-red-600">{periodInsights.cveCount}</div>
            <div className="text-xs text-ink-500 mt-1">CVEs</div>
          </div>
          <div className="text-center p-4 bg-violet-50 rounded-xl">
            <div className="text-3xl font-display font-semibold text-violet-600">{periodInsights.threatCount}</div>
            <div className="text-xs text-ink-500 mt-1">Threats</div>
          </div>
        </div>

        {/* Top Techniques */}
        <div>
          <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3">Top Techniques This Week</h4>
          <div className="flex flex-wrap gap-2">
            {periodInsights.topTags.map((tag, index) => (
              <span
                key={tag}
                className="tag tag-ttp capitalize animate-fadeInUp"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {tag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recurring Threads */}
      <div className="bg-white rounded-2xl border border-ink-100 shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-ink-100">
          <h3 className="font-display font-semibold text-ink-900">Notable Threads</h3>
        </div>
        <div className="divide-y divide-ink-100">
          {periodItems.slice(0, 8).map((item, index) => (
            <button
              key={item.id}
              onClick={() => onItemClick(item)}
              className="w-full p-4 text-left hover:bg-paper-50 transition-colors group animate-fadeInUp"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-ink-800 group-hover:text-ink-900 line-clamp-2 text-sm mb-2">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-400 capitalize">{item.source}</span>
                    {item.extracted.cves.length > 0 && (
                      <span className="tag tag-cve text-[10px] py-0.5">{item.extracted.cves[0]}</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-ink-300 group-hover:text-accent-coral flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMonthlyBriefing = () => (
    <div className="space-y-6">
      {/* Month in Review */}
      <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-6">
        <h3 className="font-display font-semibold text-ink-900 mb-2">Month in Review</h3>
        <p className="text-ink-600 text-sm leading-relaxed mb-6">
          This month saw <strong>{periodInsights.totalArticles}</strong> articles from <strong>{periodInsights.uniqueSources}</strong> sources,
          identifying <strong>{periodInsights.cveCount}</strong> CVEs and <strong>{periodInsights.threatCount}</strong> threat actors.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-paper-50 rounded-xl border border-ink-100">
            <FileText size={20} className="text-ink-400 mb-2" />
            <div className="text-2xl font-display font-semibold text-ink-900">{periodInsights.totalArticles}</div>
            <div className="text-xs text-ink-500">Total Articles</div>
          </div>
          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
            <Shield size={20} className="text-red-500 mb-2" />
            <div className="text-2xl font-display font-semibold text-red-600">{periodInsights.cveCount}</div>
            <div className="text-xs text-ink-500">CVEs Found</div>
          </div>
          <div className="p-4 bg-violet-50 rounded-xl border border-violet-100">
            <Skull size={20} className="text-violet-500 mb-2" />
            <div className="text-2xl font-display font-semibold text-violet-600">{periodInsights.threatCount}</div>
            <div className="text-xs text-ink-500">Threats</div>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <Target size={20} className="text-amber-500 mb-2" />
            <div className="text-2xl font-display font-semibold text-amber-600">{periodInsights.uniqueSources}</div>
            <div className="text-xs text-ink-500">Sources</div>
          </div>
        </div>
      </div>

      {/* Trend Summary */}
      <div className="insight-card">
        <div className="pl-4">
          <h4 className="font-display font-semibold text-ink-900 mb-3">Key Trends</h4>
          <ul className="space-y-3">
            {periodInsights.topTags.slice(0, 3).map((tag, index) => (
              <li key={tag} className="flex items-start gap-3 animate-fadeInUp" style={{ animationDelay: `${index * 50}ms` }}>
                <TrendingUp size={16} className="text-accent-coral mt-0.5 flex-shrink-0" />
                <span className="text-ink-700 text-sm">
                  <strong className="capitalize">{tag.replace(/_/g, ' ')}</strong> techniques remained consistently present across threat reports
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* All Items */}
      <div className="bg-white rounded-2xl border border-ink-100 shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
          <h3 className="font-display font-semibold text-ink-900">All Threads This Month</h3>
          <span className="text-sm text-ink-500">{periodItems.length} total</span>
        </div>
        <div className="divide-y divide-ink-100 max-h-96 overflow-y-auto">
          {periodItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => onItemClick(item)}
              className="w-full p-4 text-left hover:bg-paper-50 transition-colors group"
            >
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-medium text-ink-700 group-hover:text-ink-900 line-clamp-1 text-sm flex-1">
                  {item.title}
                </h4>
                <span className="text-xs text-ink-400 flex-shrink-0">
                  {format(new Date(item.date), 'MMM d')}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-paper-200 rounded-xl" />
        <div className="h-64 bg-paper-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900 tracking-tight">
            Briefings
          </h1>
          <p className="text-ink-500 mt-1">
            Curated threat intelligence summaries
          </p>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex items-center gap-1 bg-paper-100 rounded-xl p-1 w-fit">
        {(['daily', 'weekly', 'monthly'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
              selectedPeriod === period
                ? 'bg-white text-ink-900 shadow-soft'
                : 'text-ink-500 hover:text-ink-700'
            }`}
          >
            <Calendar size={16} />
            {period}
          </button>
        ))}
      </div>

      {/* Period Content */}
      {selectedPeriod === 'daily' && renderDailyBriefing()}
      {selectedPeriod === 'weekly' && renderWeeklyBriefing()}
      {selectedPeriod === 'monthly' && renderMonthlyBriefing()}
    </div>
  );
}
