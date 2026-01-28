'use client';

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  Shield,
  Globe,
  Building,
  Users,
  Crosshair,
  Zap,
  Radio,
  Cpu,
  TrendingUp,
  Skull,
  ExternalLink,
  Brain,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps';

// Country coordinates for labels
const countryCoordinates: Record<string, [number, number]> = {
  'russia': [100, 60],
  'china': [105, 35],
  'usa': [-95, 40],
  'uk': [-2, 54],
  'india': [78, 22],
  'japan': [138, 36],
  'australia': [134, -25],
  'north_korea': [127, 40],
  'south_korea': [127, 36],
  'ukraine': [32, 49],
  'israel': [35, 31],
  'iran': [53, 32],
  'eu': [10, 50],
};

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Map country names (from topology) to our region keys
const countryNameToRegion: Record<string, string> = {
  // Direct matches
  'Russia': 'russia',
  'China': 'china',
  'North Korea': 'north_korea',
  'Dem. Rep. Korea': 'north_korea',
  'Iran': 'iran',
  'United States': 'usa',
  'United States of America': 'usa',
  'United Kingdom': 'uk',
  'Israel': 'israel',
  'Ukraine': 'ukraine',
  'India': 'india',
  'Australia': 'australia',
  'Japan': 'japan',
  'South Korea': 'south_korea',
  'Korea': 'south_korea',
  // EU countries
  'Germany': 'eu',
  'France': 'eu',
  'Italy': 'eu',
  'Spain': 'eu',
  'Netherlands': 'eu',
  'Belgium': 'eu',
  'Poland': 'eu',
  'Sweden': 'eu',
  'Austria': 'eu',
  'Portugal': 'eu',
  'Greece': 'eu',
  'Czech Republic': 'eu',
  'Czechia': 'eu',
  'Romania': 'eu',
  'Hungary': 'eu',
  'Finland': 'eu',
  'Denmark': 'eu',
  'Ireland': 'eu',
  'Bulgaria': 'eu',
  'Croatia': 'eu',
  'Slovakia': 'eu',
  'Lithuania': 'eu',
  'Slovenia': 'eu',
  'Latvia': 'eu',
  'Estonia': 'eu',
  'Cyprus': 'eu',
  'Luxembourg': 'eu',
  'Malta': 'eu',
};

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
  'manufacturing': <Crosshair size={12} />,
  'retail': <Building size={12} />,
  'telecommunications': <Radio size={12} />,
  'education': <Building size={12} />,
  'defense': <Shield size={12} />,
};

// Get threat count for a country name
const getCountryThreatCount = (countryName: string, geographyCounts: Record<string, number>): number => {
  const region = countryNameToRegion[countryName];
  if (region && geographyCounts[region]) {
    return geographyCounts[region];
  }
  return 0;
};

// Get color intensity based on threat count
const getThreatColorIntensity = (count: number, maxCount: number): string => {
  if (count === 0 || maxCount === 0) return '#e2e8f0'; // slate-200
  const intensity = count / maxCount;
  if (intensity > 0.8) return '#dc2626'; // red-600
  if (intensity > 0.6) return '#ef4444'; // red-500
  if (intensity > 0.4) return '#f87171'; // red-400
  if (intensity > 0.2) return '#fca5a5'; // red-300
  return '#fecaca'; // red-200
};

// World Map Component
interface WorldMapProps {
  geographyCounts: Record<string, number>;
}

const WorldMap = ({ geographyCounts }: WorldMapProps) => {
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const maxCount = useMemo(() => Math.max(...Object.values(geographyCounts), 1), [geographyCounts]);

  // Get top regions for labels
  const topRegions = useMemo(() => {
    return Object.entries(geographyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .filter(([region]) => countryCoordinates[region]);
  }, [geographyCounts]);

  return (
    <div className="relative h-[350px] w-full overflow-hidden">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 130,
          center: [20, 30],
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const countryName = geo.properties.name || '';
              const count = getCountryThreatCount(countryName, geographyCounts);
              const fillColor = count > 0 ? getThreatColorIntensity(count, maxCount) : '#f1f5f9';

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fillColor}
                  stroke="#94a3b8"
                  strokeWidth={0.3}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: count > 0 ? '#991b1b' : '#e2e8f0', cursor: 'pointer' },
                    pressed: { outline: 'none' },
                  }}
                  onMouseEnter={(e) => {
                    setTooltipContent(count > 0 ? `${countryName}: ${count} threats` : countryName);
                    setTooltipPosition({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => setTooltipContent(null)}
                  onMouseMove={(e) => setTooltipPosition({ x: e.clientX, y: e.clientY })}
                />
              );
            })
          }
        </Geographies>
        {/* Country labels with threat counts */}
        {topRegions.map(([region, count]) => {
          const coords = countryCoordinates[region];
          if (!coords) return null;
          const label = region === 'usa' ? 'US' :
                       region === 'uk' ? 'UK' :
                       region === 'north_korea' ? 'N.Korea' :
                       region === 'south_korea' ? 'S.Korea' :
                       region.charAt(0).toUpperCase() + region.slice(1);
          return (
            <Marker key={region} coordinates={coords}>
              <circle r={4} fill="#dc2626" stroke="#fff" strokeWidth={1} />
              <text
                textAnchor="middle"
                y={-8}
                style={{
                  fontSize: '8px',
                  fontWeight: 600,
                  fill: '#1e293b',
                  textShadow: '0 0 3px #fff, 0 0 3px #fff',
                }}
              >
                {label}: {count}
              </text>
            </Marker>
          );
        })}
      </ComposableMap>
      {tooltipContent && (
        <div
          className="fixed z-50 bg-stone-900 text-white text-xs px-3 py-1.5 rounded shadow-lg pointer-events-none"
          style={{
            left: tooltipPosition.x + 12,
            top: tooltipPosition.y - 35,
          }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
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

      {/* Row 1: Priority Intel + Map */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Priority Intelligence */}
        <div className="col-span-6 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-100">
                <AlertTriangle size={14} className="text-red-600" />
              </div>
              <h2 className="text-sm font-semibold text-stone-900">Priority Intelligence</h2>
            </div>
            <button
              onClick={onViewThreads}
              className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 font-medium"
            >
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-stone-100 max-h-[350px] overflow-y-auto">
            {priorityIntel.length === 0 ? (
              <div className="p-6 text-center">
                <Radio size={20} className="mx-auto text-stone-300 mb-2" />
                <p className="text-stone-400 text-xs">No priority intel</p>
              </div>
            ) : (
              priorityIntel.map((item) => {
                const severity = getSeverity(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => onItemClick(item)}
                    className="w-full p-3 text-left hover:bg-stone-50 transition-all group"
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-1 h-10 rounded-full flex-shrink-0 ${
                        severity === 'critical' ? 'bg-red-500' :
                        severity === 'high' ? 'bg-orange-500' : 'bg-amber-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                            severity === 'critical' ? 'bg-red-100 text-red-700' :
                            severity === 'high' ? 'bg-orange-100 text-orange-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {severity}
                          </span>
                          <span className="text-[9px] text-stone-400">
                            {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                          </span>
                        </div>
                        <h3 className="text-xs text-stone-800 group-hover:text-stone-900 line-clamp-2">
                          {item.title}
                        </h3>
                      </div>
                      <ChevronRight size={12} className="text-stone-300 group-hover:text-cyan-500 transition-colors flex-shrink-0" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* World Map */}
        <div className="col-span-6 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-cyan-100">
                <Globe size={12} className="text-cyan-600" />
              </div>
              <h2 className="text-xs font-semibold text-stone-900">Cyber Global Map</h2>
            </div>
            <div className="flex items-center gap-2 text-[8px] text-stone-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-1.5 rounded-sm bg-red-200" />
                <span>Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-1.5 rounded-sm bg-red-400" />
                <span>Med</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-1.5 rounded-sm bg-red-600" />
                <span>High</span>
              </div>
            </div>
          </div>
          <div>
            {stats?.geography_counts && Object.keys(stats.geography_counts).length > 0 ? (
              <WorldMap geographyCounts={stats.geography_counts} />
            ) : (
              <div className="h-[340px] flex items-center justify-center">
                <div className="text-center">
                  <Globe size={28} className="mx-auto text-stone-300 mb-2" />
                  <p className="text-stone-400 text-xs">No geographic data</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Actors, Products, Sectors, CVEs */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Threat Actors */}
        <div className="col-span-3 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="px-3 py-2.5 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-100">
                <Skull size={12} className="text-slate-600" />
              </div>
              <h2 className="text-xs font-semibold text-stone-900">Threat Actors</h2>
            </div>
            <span className="text-[10px] font-medium text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded-full">
              {stats?.all_actors?.length || 0}
            </span>
          </div>
          <div className="p-2 space-y-1.5 max-h-[200px] overflow-y-auto">
            {stats?.all_actors && stats.all_actors.length > 0 ? (
              stats.all_actors.slice(0, 8).map((actor) => {
                const colors = getActorColor(actor);
                return (
                  <div
                    key={actor}
                    className={`px-2.5 py-2 rounded-lg ${colors.bg} border ${colors.border} flex items-center gap-2`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                    <span className={`text-xs font-medium ${colors.text} truncate`}>{actor}</span>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center">
                <Users size={18} className="mx-auto text-stone-300 mb-1" />
                <p className="text-stone-400 text-[10px]">No actors</p>
              </div>
            )}
          </div>
        </div>

        {/* Products Targeted */}
        <div className="col-span-3 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="px-3 py-2.5 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100">
                <Crosshair size={12} className="text-blue-600" />
              </div>
              <h2 className="text-xs font-semibold text-stone-900">Products Targeted</h2>
            </div>
            <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
              {productData.length}
            </span>
          </div>
          <div className="p-2">
            {productData.length > 0 ? (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productData.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={70}
                      tick={{ fontSize: 9, fill: '#78716c' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-stone-900 text-white px-2 py-1 rounded text-[10px]">
                              {payload[0].payload.fullName}: {payload[0].value}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 3, 3, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="p-4 text-center">
                <Crosshair size={18} className="mx-auto text-stone-300 mb-1" />
                <p className="text-stone-400 text-[10px]">No products</p>
              </div>
            )}
          </div>
        </div>

        {/* Sectors at Risk */}
        <div className="col-span-3 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="px-3 py-2.5 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100">
                <Building size={12} className="text-emerald-600" />
              </div>
              <h2 className="text-xs font-semibold text-stone-900">Sectors at Risk</h2>
            </div>
            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              {sectorData.length}
            </span>
          </div>
          <div className="p-2">
            {sectorData.length > 0 ? (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorData.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={75}
                      tick={{ fontSize: 9, fill: '#78716c' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-stone-900 text-white px-2 py-1 rounded text-[10px]">
                              {payload[0].payload.name}: {payload[0].value}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 3, 3, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="p-4 text-center">
                <Building size={18} className="mx-auto text-stone-300 mb-1" />
                <p className="text-stone-400 text-[10px]">No sectors</p>
              </div>
            )}
          </div>
        </div>

        {/* CVEs + Malware Stack */}
        <div className="col-span-3 space-y-4">
          {/* Critical CVEs */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="px-3 py-2 border-b border-stone-100 flex items-center gap-2">
              <div className="p-1 rounded-lg bg-red-100">
                <Shield size={12} className="text-red-600" />
              </div>
              <h2 className="text-xs font-semibold text-stone-900">Critical CVEs</h2>
            </div>
            <div className="p-2 space-y-1">
              {stats?.top_cves && stats.top_cves.length > 0 ? (
                stats.top_cves.slice(0, 4).map(([cve, count]) => (
                  <div key={cve} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    <code className="text-[10px] text-red-600 font-medium">{cve}</code>
                    <span className="text-[9px] text-stone-400 bg-stone-100 px-1 py-0.5 rounded">{count}</span>
                  </div>
                ))
              ) : (
                <div className="p-2 text-center">
                  <p className="text-stone-400 text-[10px]">No CVEs</p>
                </div>
              )}
            </div>
          </div>

          {/* Malware */}
          {stats?.all_malware && stats.all_malware.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-orange-100">
                    <Zap size={12} className="text-orange-600" />
                  </div>
                  <h2 className="text-xs font-semibold text-stone-900">Malware</h2>
                </div>
                <span className="text-[9px] font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                  {stats.all_malware.length}
                </span>
              </div>
              <div className="p-2 flex flex-wrap gap-1">
                {stats.all_malware.slice(0, 6).map((malware) => (
                  <span key={malware} className="text-[9px] px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded border border-orange-200">
                    {malware}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attack Techniques - Radar Chart + Tags */}
      {stats && Object.keys(stats.tag_counts).length > 0 && (
        <div className="mt-4 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-100">
                <Zap size={14} className="text-cyan-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-stone-900">Attack Techniques</h2>
                <p className="text-[10px] text-stone-400">Observed TTPs</p>
              </div>
            </div>
            <span className="text-xs font-medium text-cyan-600 bg-cyan-50 px-2 py-1 rounded-full">
              {Object.keys(stats.tag_counts).length} techniques
            </span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-12 gap-4">
              {/* Radar Chart */}
              <div className="col-span-4">
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={Object.entries(stats.tag_counts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 6)
                        .map(([tag, count]) => ({
                          technique: tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                          count,
                          fullMark: Math.max(...Object.values(stats.tag_counts))
                        }))}
                    >
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis
                        dataKey="technique"
                        tick={{ fontSize: 9, fill: '#64748b' }}
                      />
                      <Radar
                        name="Techniques"
                        dataKey="count"
                        stroke="#0891b2"
                        fill="#0891b2"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Technique Tags */}
              <div className="col-span-8 flex flex-wrap gap-2 content-start">
                {Object.entries(stats.tag_counts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 15)
                  .map(([tag, count], index) => {
                    const opacity = 1 - (index * 0.05);
                    return (
                      <span
                        key={tag}
                        className="text-xs px-3 py-1.5 bg-gradient-to-r from-slate-50 to-cyan-50 text-slate-700 rounded-full border border-slate-200 capitalize hover:shadow-md hover:border-cyan-300 transition-all cursor-default"
                        style={{ opacity: Math.max(opacity, 0.5) }}
                      >
                        {tag.replace(/_/g, ' ')}
                        <span className="ml-1.5 text-cyan-600 font-medium">{count}</span>
                      </span>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Threat Intelligence Section */}
      {stats && (stats.tag_counts.ai_attack || stats.tag_counts.ai_abuse || stats.tag_counts.ai_supply_chain || Object.keys(stats.tag_counts).some(k => k.includes('ai'))) && (
        <div className="mt-4 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-stone-100 bg-gradient-to-r from-slate-50 to-cyan-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-100">
                <Brain size={14} className="text-cyan-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-stone-900">AI Threat Intelligence</h2>
                <p className="text-[10px] text-stone-400">AI-related security threats</p>
              </div>
            </div>
            <span className="text-xs font-medium text-cyan-600 bg-white px-2 py-1 rounded-full border border-cyan-200">
              {(stats.tag_counts.ai_attack || 0) + (stats.tag_counts.ai_abuse || 0) + (stats.tag_counts.ai_supply_chain || 0)} signals
            </span>
          </div>
          <div className="p-4">
            {/* AI Threat Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={12} className="text-red-500" />
                  <span className="text-[10px] text-red-600 font-medium uppercase tracking-wider">AI Attacks</span>
                </div>
                <p className="text-2xl font-semibold text-red-700 tabular-nums">{stats.tag_counts.ai_attack || 0}</p>
                <p className="text-[10px] text-red-400">AI-powered attack vectors</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={12} className="text-amber-500" />
                  <span className="text-[10px] text-amber-600 font-medium uppercase tracking-wider">AI Abuse</span>
                </div>
                <p className="text-2xl font-semibold text-amber-700 tabular-nums">{stats.tag_counts.ai_abuse || 0}</p>
                <p className="text-[10px] text-amber-400">AI system misuse</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100">
                <div className="flex items-center gap-2 mb-1">
                  <Cpu size={12} className="text-cyan-500" />
                  <span className="text-[10px] text-cyan-600 font-medium uppercase tracking-wider">AI Supply Chain</span>
                </div>
                <p className="text-2xl font-semibold text-cyan-700 tabular-nums">{stats.tag_counts.ai_supply_chain || 0}</p>
                <p className="text-[10px] text-cyan-400">ML pipeline risks</p>
              </div>
            </div>
            {/* Recent AI-related items */}
            {items.filter(item =>
              item.extracted.tags.some(t => t.toLowerCase().includes('ai')) ||
              item.title.toLowerCase().includes('ai ') ||
              item.title.toLowerCase().includes('artificial intelligence') ||
              item.title.toLowerCase().includes('machine learning') ||
              item.title.toLowerCase().includes('llm') ||
              item.title.toLowerCase().includes('gpt')
            ).length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-stone-500 mb-2">Recent AI-Related Threats</h3>
                <div className="space-y-2">
                  {items.filter(item =>
                    item.extracted.tags.some(t => t.toLowerCase().includes('ai')) ||
                    item.title.toLowerCase().includes('ai ') ||
                    item.title.toLowerCase().includes('artificial intelligence') ||
                    item.title.toLowerCase().includes('machine learning') ||
                    item.title.toLowerCase().includes('llm') ||
                    item.title.toLowerCase().includes('gpt')
                  ).slice(0, 3).map(item => (
                    <button
                      key={item.id}
                      onClick={() => onItemClick(item)}
                      className="w-full p-3 rounded-xl bg-stone-50 hover:bg-cyan-50 border border-stone-200 hover:border-cyan-300 text-left transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-1 h-8 rounded-full bg-cyan-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-stone-700 group-hover:text-stone-900 line-clamp-1">{item.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-stone-400">{item.source}</span>
                            <span className="text-[10px] text-stone-300">&bull;</span>
                            <span className="text-[10px] text-stone-400">{formatDistanceToNow(new Date(item.date), { addSuffix: true })}</span>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-stone-300 group-hover:text-cyan-500 transition-colors mt-1 flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
