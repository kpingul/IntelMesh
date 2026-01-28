'use client';

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  Shield,
  Target,
  Copy,
  Check,
  Globe,
  Building,
  MapPin,
  Users,
  Crosshair,
  Zap,
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
  const [copiedIoc, setCopiedIoc] = useState<string | null>(null);

  const priorityIntel = useMemo(() => {
    return items
      .filter(item => item.extracted.cves.length > 0 || item.extracted.actors.length > 0 || item.extracted.malware.length > 0)
      .slice(0, 6);
  }, [items]);

  const recentIocs = useMemo(() => {
    const iocs: { type: string; value: string }[] = [];
    items.slice(0, 10).forEach(item => {
      item.extracted.ips.slice(0, 2).forEach(ip => {
        iocs.push({ type: 'IP', value: ip });
      });
      item.extracted.domains.slice(0, 1).forEach(domain => {
        iocs.push({ type: 'Domain', value: domain });
      });
    });
    return iocs.slice(0, 6);
  }, [items]);

  const getSeverity = (item: ThreatItem) => {
    if (item.extracted.cves.length > 0) return 'critical';
    if (item.extracted.malware.length > 0 || item.extracted.actors.length > 0) return 'high';
    return 'medium';
  };

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedIoc(value);
    setTimeout(() => setCopiedIoc(null), 2000);
  };

  // Calculate impactful metrics
  const exploitedVulns = stats?.top_cves?.length || 0;
  const activeActors = stats?.all_actors?.length || 0;
  const productsAtRisk = stats?.product_counts ? Object.keys(stats.product_counts).length : 0;
  const sectorsTargeted = stats?.sector_counts ? Object.keys(stats.sector_counts).length : 0;
  const regionsAffected = stats?.geography_counts ? Object.keys(stats.geography_counts).length : 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-24 skeleton rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          <div className="h-20 skeleton rounded-lg" />
          <div className="h-20 skeleton rounded-lg" />
          <div className="h-20 skeleton rounded-lg" />
          <div className="h-20 skeleton rounded-lg" />
        </div>
        <div className="h-64 skeleton rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Threat Dashboard</h1>
        <p className="text-sm text-slate-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Key Risk Indicators */}
      {stats && (
        <div className="grid grid-cols-5 gap-3 mb-6">
          {/* Exploited Vulnerabilities */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-red-500">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-red-500" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Exploited CVEs</span>
            </div>
            <div className="text-2xl font-semibold text-slate-900 tracking-tight">{exploitedVulns}</div>
            <p className="text-xs text-slate-400 mt-1">Active exploitation</p>
          </div>

          {/* Active Threat Actors */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-purple-500">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-purple-500" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Threat Actors</span>
            </div>
            <div className="text-2xl font-semibold text-slate-900 tracking-tight">{activeActors}</div>
            <p className="text-xs text-slate-400 mt-1">Campaigns detected</p>
          </div>

          {/* Products at Risk */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-2 mb-2">
              <Crosshair size={16} className="text-blue-500" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Attack Surface</span>
            </div>
            <div className="text-2xl font-semibold text-slate-900 tracking-tight">{productsAtRisk}</div>
            <p className="text-xs text-slate-400 mt-1">Products targeted</p>
          </div>

          {/* Sectors Targeted */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-green-500">
            <div className="flex items-center gap-2 mb-2">
              <Building size={16} className="text-green-500" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sectors</span>
            </div>
            <div className="text-2xl font-semibold text-slate-900 tracking-tight">{sectorsTargeted}</div>
            <p className="text-xs text-slate-400 mt-1">Industries at risk</p>
          </div>

          {/* Geographic Spread */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-cyan-500">
            <div className="flex items-center gap-2 mb-2">
              <Globe size={16} className="text-cyan-500" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Regions</span>
            </div>
            <div className="text-2xl font-semibold text-slate-900 tracking-tight">{regionsAffected}</div>
            <p className="text-xs text-slate-400 mt-1">Geographic spread</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Priority Items */}
        <div className="col-span-2">
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" />
                <h2 className="font-semibold text-slate-900 tracking-tight">Priority Intelligence</h2>
              </div>
              <button
                onClick={onViewThreads}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
              >
                View All <ChevronRight size={14} />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {priorityIntel.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No priority intel. Sync to fetch latest threats.
                </div>
              ) : (
                priorityIntel.map((item) => {
                  const severity = getSeverity(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => onItemClick(item)}
                      className="w-full p-4 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-1 h-12 rounded-full ${
                          severity === 'critical' ? 'bg-red-500' :
                          severity === 'high' ? 'bg-orange-500' : 'bg-amber-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                              severity === 'critical' ? 'bg-red-100 text-red-700' :
                              severity === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {severity}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                            </span>
                          </div>
                          <h3 className="text-sm font-medium text-slate-800 line-clamp-2">{item.title}</h3>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.extracted.cves.slice(0, 2).map(cve => (
                              <span key={cve} className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded font-medium">
                                {cve}
                              </span>
                            ))}
                            {item.extracted.malware.slice(0, 1).map(m => (
                              <span key={m} className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded font-medium">
                                {m}
                              </span>
                            ))}
                            {item.extracted.actors.slice(0, 1).map(a => (
                              <span key={a} className="text-[10px] px-1.5 py-0.5 bg-pink-50 text-pink-600 rounded font-medium">
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Top CVEs */}
          {stats && stats.top_cves.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-3 border-b border-slate-200 flex items-center gap-2">
                <Shield size={16} className="text-red-500" />
                <h3 className="font-semibold text-slate-800 text-sm tracking-tight">Exploited CVEs</h3>
              </div>
              <div className="p-3 space-y-2">
                {stats.top_cves.slice(0, 5).map(([cve, count]) => (
                  <div key={cve} className="flex items-center justify-between">
                    <code className="text-xs text-red-600 font-medium">{cve}</code>
                    <span className="text-xs text-slate-400">{count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Threat Actors */}
          {stats && stats.all_actors.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-3 border-b border-slate-200 flex items-center gap-2">
                <Users size={16} className="text-purple-500" />
                <h3 className="font-semibold text-slate-800 text-sm tracking-tight">Active Actors</h3>
              </div>
              <div className="p-3 flex flex-wrap gap-1.5">
                {stats.all_actors.slice(0, 6).map(actor => (
                  <span key={actor} className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded font-medium">
                    {actor}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Trending TTPs */}
          {stats && Object.keys(stats.tag_counts).length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-3 border-b border-slate-200 flex items-center gap-2">
                <Zap size={16} className="text-blue-500" />
                <h3 className="font-semibold text-slate-800 text-sm tracking-tight">Attack Techniques</h3>
              </div>
              <div className="p-3 flex flex-wrap gap-1.5">
                {Object.entries(stats.tag_counts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([tag]) => (
                    <span key={tag} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded capitalize font-medium">
                      {tag.replace(/_/g, ' ')}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Products Affected */}
          {stats && stats.product_counts && Object.keys(stats.product_counts).length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-3 border-b border-slate-200 flex items-center gap-2">
                <Crosshair size={16} className="text-slate-500" />
                <h3 className="font-semibold text-slate-800 text-sm tracking-tight">Products Targeted</h3>
              </div>
              <div className="p-3 flex flex-wrap gap-1.5">
                {Object.entries(stats.product_counts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([product]) => (
                    <span key={product} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded capitalize font-medium">
                      {product.replace(/_/g, ' ')}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Sectors Targeted */}
          {stats && stats.sector_counts && Object.keys(stats.sector_counts).length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-3 border-b border-slate-200 flex items-center gap-2">
                <Building size={16} className="text-green-500" />
                <h3 className="font-semibold text-slate-800 text-sm tracking-tight">Sectors at Risk</h3>
              </div>
              <div className="p-3 flex flex-wrap gap-1.5">
                {Object.entries(stats.sector_counts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([sector]) => (
                    <span key={sector} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded capitalize font-medium">
                      {sector.replace(/_/g, ' ')}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Geography */}
          {stats && stats.geography_counts && Object.keys(stats.geography_counts).length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-3 border-b border-slate-200 flex items-center gap-2">
                <MapPin size={16} className="text-orange-500" />
                <h3 className="font-semibold text-slate-800 text-sm tracking-tight">Geographic Spread</h3>
              </div>
              <div className="p-3 flex flex-wrap gap-1.5">
                {Object.entries(stats.geography_counts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([geo]) => (
                    <span key={geo} className="text-xs px-2 py-1 bg-orange-50 text-orange-700 rounded capitalize font-medium">
                      {geo.replace(/_/g, ' ')}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Recent IoCs */}
          {recentIocs.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-3 border-b border-slate-200 flex items-center gap-2">
                <Target size={16} className="text-amber-500" />
                <h3 className="font-semibold text-slate-800 text-sm tracking-tight">Recent IoCs</h3>
              </div>
              <div className="p-2 space-y-1">
                {recentIocs.map((ioc, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded group">
                    <span className="text-[10px] text-slate-400 uppercase w-12 font-medium">{ioc.type}</span>
                    <code className="text-xs text-amber-600 truncate flex-1">{ioc.value}</code>
                    <button
                      onClick={() => copyToClipboard(ioc.value)}
                      className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100"
                    >
                      {copiedIoc === ioc.value ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
