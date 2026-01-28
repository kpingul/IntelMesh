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
  Users,
  Crosshair,
  Zap,
  Radio,
  MapPin,
  Cpu,
  TrendingUp,
  Skull,
  ExternalLink,
} from 'lucide-react';
import { Stats, ThreatItem } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface TodayViewProps {
  stats: Stats | null;
  items: ThreatItem[];
  isLoading: boolean;
  onItemClick: (item: ThreatItem) => void;
  onViewThreads: () => void;
}

// Sector icon mapping
const sectorIcons: { [key: string]: React.ReactNode } = {
  'technology': <Cpu size={12} />,
  'financial': <TrendingUp size={12} />,
  'healthcare': <Shield size={12} />,
  'government': <Building size={12} />,
  'energy': <Zap size={12} />,
  'manufacturing': <Target size={12} />,
  'retail': <Building size={12} />,
  'telecommunications': <Radio size={12} />,
  'education': <Building size={12} />,
  'defense': <Shield size={12} />,
};

// Region flag/color mapping
const regionColors: { [key: string]: string } = {
  'united states': '#3b82f6',
  'usa': '#3b82f6',
  'us': '#3b82f6',
  'china': '#ef4444',
  'russia': '#64748b',
  'iran': '#f59e0b',
  'north korea': '#dc2626',
  'europe': '#0ea5e9',
  'uk': '#6366f1',
  'india': '#f97316',
  'default': '#64748b',
};

const getRegionColor = (region: string) => {
  const lower = region.toLowerCase();
  for (const [key, color] of Object.entries(regionColors)) {
    if (lower.includes(key)) return color;
  }
  return regionColors.default;
};

// Threat actor severity colors (pseudo-random based on name)
const getActorColor = (name: string) => {
  const colors = [
    { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
    { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', dot: 'bg-slate-500' },
    { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
    { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', dot: 'bg-cyan-500' },
    { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

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
      .slice(0, 4);
  }, [items]);

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedIoc(value);
    setTimeout(() => setCopiedIoc(null), 2000);
  };

  // Prepare chart data
  const productData = useMemo(() => {
    if (!stats?.product_counts) return [];
    return Object.entries(stats.product_counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name: name.length > 12 ? name.slice(0, 12) + '...' : name, fullName: name, value }));
  }, [stats]);

  const sectorData = useMemo(() => {
    if (!stats?.sector_counts) return [];
    return Object.entries(stats.sector_counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [stats]);

  const regionData = useMemo(() => {
    if (!stats?.geography_counts) return [];
    return Object.entries(stats.geography_counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, color: getRegionColor(name) }));
  }, [stats]);

  const iocData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'IPs', value: stats.ioc_breakdown.ips, color: '#f59e0b' },
      { name: 'Domains', value: stats.ioc_breakdown.domains, color: '#3b82f6' },
      { name: 'Hashes', value: stats.ioc_breakdown.hashes, color: '#64748b' },
      { name: 'URLs', value: stats.ioc_breakdown.urls, color: '#0ea5e9' },
    ].filter(d => d.value > 0);
  }, [stats]);

  const getSeverity = (item: ThreatItem) => {
    if (item.extracted.cves.length > 0) return 'critical';
    if (item.extracted.malware.length > 0 || item.extracted.actors.length > 0) return 'high';
    return 'medium';
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 bg-stone-50 min-h-full">
        <div className="h-20 skeleton rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 skeleton rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto bg-stone-50">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 tracking-tight">Threat Intelligence</h1>
          <p className="text-xs text-stone-500 mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-stone-500">Live monitoring</span>
          </div>
          <div className="h-4 w-px bg-stone-300" />
          <div className="text-right">
            <p className="text-lg font-semibold text-stone-900 tabular-nums">{stats?.total_items || 0}</p>
            <p className="text-[10px] text-stone-400 uppercase tracking-wider">Signals today</p>
          </div>
        </div>
      </div>

      {/* Main Grid - Intelligence Tiles */}
      <div className="grid grid-cols-12 gap-4 mb-6">

        {/* Threat Actors - Large tile */}
        <div className="col-span-4 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-100">
                <Skull size={14} className="text-slate-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-stone-900">Threat Actors</h2>
                <p className="text-[10px] text-stone-400">Active adversaries</p>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-full">
              {stats?.all_actors?.length || 0}
            </span>
          </div>
          <div className="p-3 space-y-2 max-h-[280px] overflow-y-auto">
            {stats?.all_actors && stats.all_actors.length > 0 ? (
              stats.all_actors.slice(0, 10).map((actor, i) => {
                const colors = getActorColor(actor);
                return (
                  <div
                    key={actor}
                    className={`p-3 rounded-xl ${colors.bg} border ${colors.border} flex items-center gap-3 group hover:shadow-md transition-all cursor-default`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <span className={`text-sm font-medium ${colors.text} flex-1`}>{actor}</span>
                    <ExternalLink size={12} className="text-stone-300 group-hover:text-stone-500 transition-colors" />
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center">
                <Users size={24} className="mx-auto text-stone-300 mb-2" />
                <p className="text-stone-400 text-xs">No actors identified</p>
              </div>
            )}
          </div>
        </div>

        {/* Products Under Attack */}
        <div className="col-span-4 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100">
                <Crosshair size={14} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-stone-900">Products Targeted</h2>
                <p className="text-[10px] text-stone-400">Attack surface</p>
              </div>
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              {productData.length}
            </span>
          </div>
          <div className="p-3">
            {productData.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productData} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={80}
                      tick={{ fontSize: 10, fill: '#78716c' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-stone-900 text-white px-2 py-1 rounded text-xs">
                              {payload[0].payload.fullName}: {payload[0].value}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                      barSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="p-6 text-center">
                <Crosshair size={24} className="mx-auto text-stone-300 mb-2" />
                <p className="text-stone-400 text-xs">No products identified</p>
              </div>
            )}
          </div>
        </div>

        {/* Sectors & Regions Stack */}
        <div className="col-span-4 space-y-4">
          {/* Sectors */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100">
                  <Building size={14} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-stone-900">Sectors at Risk</h2>
                  <p className="text-[10px] text-stone-400">Industry targets</p>
                </div>
              </div>
            </div>
            <div className="p-3">
              {sectorData.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {sectorData.map(({ name, value }) => (
                    <div
                      key={name}
                      className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all group"
                    >
                      <span className="text-stone-400 group-hover:text-emerald-500 transition-colors">
                        {sectorIcons[name.toLowerCase()] || <Building size={12} />}
                      </span>
                      <span className="text-xs font-medium text-stone-700 capitalize">{name}</span>
                      <span className="text-[10px] text-stone-400 bg-white px-1.5 py-0.5 rounded-full border border-stone-200">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <Building size={20} className="mx-auto text-stone-300 mb-1" />
                  <p className="text-stone-400 text-xs">No sectors identified</p>
                </div>
              )}
            </div>
          </div>

          {/* Regions */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-100">
                  <Globe size={14} className="text-cyan-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-stone-900">Geographic Spread</h2>
                  <p className="text-[10px] text-stone-400">Affected regions</p>
                </div>
              </div>
            </div>
            <div className="p-3">
              {regionData.length > 0 ? (
                <div className="space-y-2">
                  {regionData.slice(0, 5).map(({ name, value, color }) => (
                    <div key={name} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-stone-700 flex-1 capitalize">{name}</span>
                      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden max-w-[80px]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(value / regionData[0].value) * 100}%`,
                            backgroundColor: color
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-stone-400 tabular-nums w-6 text-right">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <MapPin size={20} className="mx-auto text-stone-300 mb-1" />
                  <p className="text-stone-400 text-xs">No regions identified</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Priority Intel & CVEs */}
      <div className="grid grid-cols-12 gap-4">
        {/* Priority Intelligence */}
        <div className="col-span-6 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-100">
                <AlertTriangle size={14} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-stone-900">Priority Intelligence</h2>
                <p className="text-[10px] text-stone-400">High-severity alerts</p>
              </div>
            </div>
            <button
              onClick={onViewThreads}
              className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium"
            >
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-stone-100">
            {priorityIntel.length === 0 ? (
              <div className="p-8 text-center">
                <Radio size={24} className="mx-auto text-stone-300 mb-2" />
                <p className="text-stone-400 text-sm">No priority intel</p>
                <p className="text-stone-300 text-xs">Sync feeds to fetch threats</p>
              </div>
            ) : (
              priorityIntel.map((item) => {
                const severity = getSeverity(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => onItemClick(item)}
                    className="w-full p-4 text-left hover:bg-stone-50 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-1.5 h-12 rounded-full flex-shrink-0 ${
                        severity === 'critical' ? 'bg-red-500' :
                        severity === 'high' ? 'bg-orange-500' : 'bg-amber-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                            severity === 'critical' ? 'bg-red-100 text-red-700' :
                            severity === 'high' ? 'bg-orange-100 text-orange-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {severity}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                          </span>
                        </div>
                        <h3 className="text-sm text-stone-800 group-hover:text-stone-900 line-clamp-1">
                          {item.title}
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.extracted.cves.slice(0, 2).map(cve => (
                            <code key={cve} className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded">
                              {cve}
                            </code>
                          ))}
                          {item.extracted.actors.slice(0, 1).map(a => (
                            <span key={a} className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-stone-300 group-hover:text-cyan-500 transition-colors mt-1 flex-shrink-0" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column - CVEs & IoCs */}
        <div className="col-span-3 space-y-4">
          {/* Top CVEs */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-100">
                <Shield size={14} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-stone-900">Critical CVEs</h2>
                <p className="text-[10px] text-stone-400">Exploited vulnerabilities</p>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {stats?.top_cves && stats.top_cves.length > 0 ? (
                stats.top_cves.slice(0, 5).map(([cve, count]) => (
                  <div key={cve} className="flex items-center justify-between group p-2 rounded-lg hover:bg-red-50 transition-colors">
                    <code className="text-xs text-red-600 font-medium">{cve}</code>
                    <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">{count}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center">
                  <Shield size={20} className="mx-auto text-stone-300 mb-1" />
                  <p className="text-stone-400 text-xs">No CVEs found</p>
                </div>
              )}
            </div>
          </div>

          {/* Malware */}
          {stats?.all_malware && stats.all_malware.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-100">
                  <Zap size={14} className="text-orange-600" />
                </div>
                <h2 className="text-sm font-semibold text-stone-900">Malware</h2>
              </div>
              <div className="p-3 flex flex-wrap gap-1.5">
                {stats.all_malware.slice(0, 8).map((malware) => (
                  <span
                    key={malware}
                    className="text-[10px] px-2 py-1 bg-orange-50 text-orange-600 rounded-lg border border-orange-200"
                  >
                    {malware}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* IoC Breakdown */}
        <div className="col-span-3 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100">
              <Target size={14} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stone-900">Indicators</h2>
              <p className="text-[10px] text-stone-400">IoC breakdown</p>
            </div>
          </div>
          <div className="p-4">
            {iocData.length > 0 ? (
              <>
                <div className="h-32 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={iocData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {iocData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {iocData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-stone-600">{item.name}</span>
                      </div>
                      <span className="text-xs font-medium text-stone-900 tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-4 text-center">
                <Target size={24} className="mx-auto text-stone-300 mb-2" />
                <p className="text-stone-400 text-xs">No IoCs found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attack Techniques */}
      {stats && Object.keys(stats.tag_counts).length > 0 && (
        <div className="mt-4 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-100">
              <Zap size={14} className="text-cyan-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stone-900">Attack Techniques</h2>
              <p className="text-[10px] text-stone-400">Observed TTPs</p>
            </div>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {Object.entries(stats.tag_counts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 12)
              .map(([tag, count]) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1.5 bg-gradient-to-r from-slate-50 to-cyan-50 text-slate-700 rounded-full border border-slate-200 capitalize hover:shadow-md transition-all cursor-default"
                >
                  {tag.replace(/_/g, ' ')}
                  <span className="ml-1.5 text-slate-400">{count}</span>
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
