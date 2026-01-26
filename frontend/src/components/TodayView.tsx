'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  ChevronRight,
  ExternalLink,
  Shield,
  Skull,
  Target,
  Sparkles,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { Stats, ThreatItem } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';

interface TodayViewProps {
  stats: Stats | null;
  items: ThreatItem[];
  isLoading: boolean;
  onItemClick: (item: ThreatItem) => void;
  onViewThreads: () => void;
}

export default function TodayView({
  stats,
  items,
  isLoading,
  onItemClick,
  onViewThreads
}: TodayViewProps) {
  const [selectedBriefingMode, setSelectedBriefingMode] = useState<'executive' | 'analyst' | 'engineer'>('analyst');

  // Generate briefing bullets from recent items
  const generateBriefingBullets = () => {
    const bullets: { text: string; severity: string; item?: ThreatItem }[] = [];

    // CVE-related items
    const cveItems = items.filter(item => item.extracted.cves.length > 0);
    if (cveItems.length > 0) {
      const topCveItem = cveItems[0];
      bullets.push({
        text: `${topCveItem.extracted.cves[0]} identified in ${topCveItem.title.substring(0, 60)}...`,
        severity: 'critical',
        item: topCveItem
      });
    }

    // Threat actor items
    const actorItems = items.filter(item => item.extracted.actors.length > 0);
    if (actorItems.length > 0) {
      bullets.push({
        text: `${actorItems[0].extracted.actors[0]} activity detected: ${actorItems[0].title.substring(0, 50)}...`,
        severity: 'high',
        item: actorItems[0]
      });
    }

    // Malware items
    const malwareItems = items.filter(item => item.extracted.malware.length > 0);
    if (malwareItems.length > 0) {
      bullets.push({
        text: `New ${malwareItems[0].extracted.malware[0]} variant observed targeting enterprises`,
        severity: 'high',
        item: malwareItems[0]
      });
    }

    // Ransomware items
    const ransomwareItems = items.filter(item => item.extracted.tags.includes('ransomware'));
    if (ransomwareItems.length > 0) {
      bullets.push({
        text: `Ransomware campaign update: ${ransomwareItems[0].title.substring(0, 60)}...`,
        severity: 'critical',
        item: ransomwareItems[0]
      });
    }

    // General recent items
    items.slice(0, 3).forEach(item => {
      if (!bullets.find(b => b.item?.id === item.id)) {
        bullets.push({
          text: item.title,
          severity: item.extracted.cves.length > 0 ? 'high' : 'medium',
          item
        });
      }
    });

    return bullets.slice(0, 7);
  };

  const briefingBullets = generateBriefingBullets();

  // Get top techniques from tag_counts
  const topTechniques = stats
    ? Object.entries(stats.tag_counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag]) => tag.replace(/_/g, ' '))
    : [];

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-amber-500';
      default:
        return 'bg-teal-500';
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-paper-200 rounded-lg w-48" />
        <div className="h-64 bg-paper-200 rounded-2xl" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-48 bg-paper-200 rounded-2xl" />
          <div className="h-48 bg-paper-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900 tracking-tight">
            Today's Briefing
          </h1>
          <p className="text-ink-500 mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} — Your daily threat intelligence summary
          </p>
        </div>
        <div className="flex items-center gap-2 bg-paper-100 rounded-xl p-1">
          {(['executive', 'analyst', 'engineer'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setSelectedBriefingMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                selectedBriefingMode === mode
                  ? 'bg-white text-ink-900 shadow-soft'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Briefing Card */}
      <div className="bg-white rounded-2xl border border-ink-100 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-ink-100 bg-gradient-to-r from-paper-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent-coral/10">
                <AlertTriangle size={20} className="text-accent-coral" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-ink-900">What Matters Today</h2>
                <p className="text-sm text-ink-500">{briefingBullets.length} key developments</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-ink-400">
              <Clock size={14} />
              Updated {formatDistanceToNow(new Date())} ago
            </span>
          </div>
        </div>

        <div className="p-6">
          <ul className="space-y-3">
            {briefingBullets.map((bullet, index) => (
              <li
                key={index}
                className="animate-fadeInUp group"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <button
                  onClick={() => bullet.item && onItemClick(bullet.item)}
                  className="w-full flex items-start gap-4 p-3 rounded-xl hover:bg-paper-50 transition-all duration-200 text-left"
                >
                  <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getSeverityStyles(bullet.severity)}`} />
                  <span className="flex-1 text-ink-700 group-hover:text-ink-900 transition-colors">
                    {bullet.text}
                  </span>
                  {bullet.item && (
                    <ChevronRight size={18} className="text-ink-300 group-hover:text-accent-coral group-hover:translate-x-1 transition-all mt-0.5" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Threads Today */}
        <div className="bg-white rounded-2xl border border-ink-100 shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-accent-amber" />
              <h3 className="font-display font-semibold text-ink-900">Top Threads Today</h3>
            </div>
            <button
              onClick={onViewThreads}
              className="text-sm text-accent-coral font-medium hover:underline flex items-center gap-1"
            >
              View all <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-ink-100">
            {items.slice(0, 4).map((item, index) => (
              <button
                key={item.id}
                onClick={() => onItemClick(item)}
                className="w-full p-4 text-left hover:bg-paper-50 transition-colors group animate-fadeInUp"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-ink-800 group-hover:text-ink-900 line-clamp-2 text-sm">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-ink-400 capitalize">{item.source}</span>
                      {item.extracted.cves.length > 0 && (
                        <span className="tag tag-cve text-[10px] py-0.5">
                          {item.extracted.cves[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-ink-300 group-hover:text-accent-coral flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Hot Topics */}
        <div className="bg-white rounded-2xl border border-ink-100 shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-100">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-accent-teal" />
              <h3 className="font-display font-semibold text-ink-900">Hot Topics</h3>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {/* Top Techniques */}
            <div>
              <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3">Trending Techniques</h4>
              <div className="flex flex-wrap gap-2">
                {topTechniques.map((technique, index) => (
                  <span
                    key={technique}
                    className="tag tag-ttp capitalize animate-fadeInUp"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    {technique}
                  </span>
                ))}
              </div>
            </div>

            {/* Top CVEs */}
            {stats && stats.top_cves.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3">Active CVEs</h4>
                <div className="space-y-2">
                  {stats.top_cves.slice(0, 3).map(([cve, count], index) => (
                    <div
                      key={cve}
                      className="flex items-center justify-between p-2 rounded-lg bg-paper-50 animate-fadeInUp"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <code className="text-sm font-mono text-red-600">{cve}</code>
                      <span className="text-xs text-ink-400">{count} mentions</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Threats */}
            {stats && stats.top_threats.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3">Active Threats</h4>
                <div className="flex flex-wrap gap-2">
                  {stats.top_threats.slice(0, 4).map(([threat], index) => (
                    <span
                      key={threat}
                      className="tag tag-threat animate-fadeInUp"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <Skull size={12} />
                      {threat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Learning Focus Suggestion */}
      <div className="insight-card animate-fadeInUp">
        <div className="pl-4">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-accent-amber/10 flex-shrink-0">
              <Lightbulb size={22} className="text-accent-amber" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-ink-900 mb-1">Learning Focus</h3>
              <p className="text-ink-600 text-sm leading-relaxed">
                {topTechniques[0] ? (
                  <>
                    Based on today's trends, consider deep-diving into <strong className="text-ink-800 capitalize">{topTechniques[0]}</strong> techniques.
                    This is appearing frequently in recent threat reports and understanding the attack patterns will strengthen your defensive posture.
                  </>
                ) : (
                  <>
                    Sync the latest threat intelligence to get personalized learning recommendations based on current trends.
                  </>
                )}
              </p>
              <button className="mt-3 text-sm font-medium text-accent-coral hover:underline flex items-center gap-1">
                Start learning <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          <div className="bg-white rounded-xl border border-ink-100 p-4 text-center">
            <div className="text-3xl font-display font-semibold text-ink-900">{stats.total_items}</div>
            <div className="text-xs text-ink-500 mt-1">Total Articles</div>
          </div>
          <div className="bg-white rounded-xl border border-ink-100 p-4 text-center">
            <div className="text-3xl font-display font-semibold text-red-600">{stats.total_cves}</div>
            <div className="text-xs text-ink-500 mt-1">CVEs Found</div>
          </div>
          <div className="bg-white rounded-xl border border-ink-100 p-4 text-center">
            <div className="text-3xl font-display font-semibold text-amber-600">{stats.total_iocs}</div>
            <div className="text-xs text-ink-500 mt-1">IoCs Extracted</div>
          </div>
          <div className="bg-white rounded-xl border border-ink-100 p-4 text-center">
            <div className="text-3xl font-display font-semibold text-violet-600">{stats.total_threats}</div>
            <div className="text-xs text-ink-500 mt-1">Threats Identified</div>
          </div>
        </div>
      )}
    </div>
  );
}
