'use client';

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Shield,
  Target,
  Skull,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Stats, ThreatItem } from '@/types';

interface TrendsViewProps {
  stats: Stats | null;
  items: ThreatItem[];
  isLoading: boolean;
}

type TimeRange = '7d' | '30d' | '90d';

const CHART_COLORS = {
  coral: '#E85D4C',
  amber: '#D4940A',
  teal: '#0F8B8D',
  violet: '#7C3AED',
  ocean: '#2563EB',
  slate: '#475569',
};

export default function TrendsView({
  stats,
  items,
  isLoading
}: TrendsViewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  // Generate insights based on stats
  const insights = useMemo(() => {
    if (!stats) return [];

    const insights: { text: string; type: 'rising' | 'falling' | 'persistent' | 'new'; icon: React.ReactNode }[] = [];

    // Check for dominant techniques
    const topTechniques = Object.entries(stats.tag_counts).sort((a, b) => b[1] - a[1]);
    if (topTechniques.length > 0) {
      const [technique, count] = topTechniques[0];
      insights.push({
        text: `${technique.replace(/_/g, ' ')} is the most common technique with ${count} occurrences`,
        type: 'rising',
        icon: <TrendingUp size={16} className="text-accent-coral" />
      });
    }

    // CVE activity
    if (stats.total_cves > 5) {
      insights.push({
        text: `High CVE activity: ${stats.total_cves} vulnerabilities being actively discussed`,
        type: 'rising',
        icon: <AlertTriangle size={16} className="text-red-500" />
      });
    }

    // Threat actors
    if (stats.all_actors.length > 0) {
      insights.push({
        text: `${stats.all_actors.length} threat actors mentioned across sources`,
        type: 'persistent',
        icon: <Skull size={16} className="text-violet-500" />
      });
    }

    // IoC types
    const mostIocs = Object.entries(stats.ioc_breakdown)
      .sort((a, b) => b[1] - a[1])[0];
    if (mostIocs && mostIocs[1] > 0) {
      insights.push({
        text: `${mostIocs[0].charAt(0).toUpperCase() + mostIocs[0].slice(1)} are the most extracted IoC type (${mostIocs[1]} found)`,
        type: 'persistent',
        icon: <Target size={16} className="text-amber-500" />
      });
    }

    return insights.slice(0, 4);
  }, [stats]);

  // Chart data
  const sourceData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.sources)
      .filter(([, count]) => count > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [stats]);

  const iocData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'IPs', value: stats.ioc_breakdown.ips, fill: CHART_COLORS.amber },
      { name: 'Domains', value: stats.ioc_breakdown.domains, fill: CHART_COLORS.ocean },
      { name: 'Hashes', value: stats.ioc_breakdown.hashes, fill: CHART_COLORS.teal },
      { name: 'URLs', value: stats.ioc_breakdown.urls, fill: CHART_COLORS.violet },
    ].filter(d => d.value > 0);
  }, [stats]);

  const techniqueData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.tag_counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag, count]) => ({
        name: tag.replace(/_/g, ' '),
        count,
      }));
  }, [stats]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-ink-100 rounded-xl px-4 py-3 shadow-elevated">
          <p className="text-ink-900 font-medium text-sm">{label || payload[0].name}</p>
          <p className="text-accent-coral font-mono text-lg font-semibold mt-1">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-paper-200 rounded-lg w-48" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-paper-200 rounded-2xl" />
          <div className="h-64 bg-paper-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16">
        <TrendingUp size={48} className="mx-auto text-ink-300 mb-4" />
        <h3 className="font-display text-lg font-semibold text-ink-700 mb-2">No trend data available</h3>
        <p className="text-ink-500">Sync news to see trend analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900 tracking-tight">
            Trends & Patterns
          </h1>
          <p className="text-ink-500 mt-1">
            Identify recurring themes, technique clusters, and shifts over time
          </p>
        </div>
        <div className="flex items-center gap-2 bg-paper-100 rounded-xl p-1">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                timeRange === range
                  ? 'bg-white text-ink-900 shadow-soft'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="insight-card animate-fadeInUp"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="pl-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-paper-100 flex-shrink-0">
                {insight.icon}
              </div>
              <p className="text-sm text-ink-700 leading-relaxed">
                {insight.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Distribution */}
        {sourceData.length > 0 && (
          <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-soft">
            <h3 className="font-display font-semibold text-ink-900 mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-accent-coral" />
              Source Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {sourceData.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: Object.values(CHART_COLORS)[i % Object.values(CHART_COLORS).length] }}
                  />
                  <span className="text-sm text-ink-600 font-medium">{entry.name}</span>
                  <span className="text-sm text-ink-400 font-mono">({entry.value})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IoC Breakdown */}
        {iocData.length > 0 && (
          <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-soft">
            <h3 className="font-display font-semibold text-ink-900 mb-6 flex items-center gap-2">
              <Target size={18} className="text-accent-amber" />
              IoC Breakdown
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={iocData} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E5DE" horizontal={false} />
                  <XAxis type="number" stroke="#9B9589" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#9B9589"
                    width={70}
                    tick={{ fontSize: 12, fill: '#5C5850' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(232, 93, 76, 0.05)' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top CVEs */}
        {stats.top_cves.length > 0 && (
          <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-soft">
            <h3 className="font-display font-semibold text-ink-900 mb-6 flex items-center gap-2">
              <Shield size={18} className="text-red-500" />
              Top CVEs
            </h3>
            <div className="space-y-4">
              {stats.top_cves.slice(0, 5).map(([cve, count], i) => (
                <div key={i} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-red-600 font-mono text-sm font-medium group-hover:text-ink-900 transition-colors">
                      {cve}
                    </code>
                    <span className="text-ink-500 text-sm font-mono">{count}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill bg-gradient-to-r from-red-500 to-orange-500"
                      style={{
                        width: `${(count / stats.top_cves[0][1]) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Threats */}
        {stats.top_threats.length > 0 && (
          <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-soft">
            <h3 className="font-display font-semibold text-ink-900 mb-6 flex items-center gap-2">
              <Skull size={18} className="text-violet-500" />
              Top Threats
            </h3>
            <div className="space-y-4">
              {stats.top_threats.slice(0, 5).map(([threat, count], i) => (
                <div key={i} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-violet-600 font-medium text-sm group-hover:text-ink-900 transition-colors">
                      {threat}
                    </span>
                    <span className="text-ink-500 text-sm font-mono">{count}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill bg-gradient-to-r from-violet-500 to-indigo-500"
                      style={{
                        width: `${(count / stats.top_threats[0][1]) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TTP Distribution */}
        {techniqueData.length > 0 && (
          <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-soft lg:col-span-2">
            <h3 className="font-display font-semibold text-ink-900 mb-6 flex items-center gap-2">
              <Lightbulb size={18} className="text-accent-teal" />
              Technique Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={techniqueData} barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E5DE" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#9B9589"
                    tick={{ fontSize: 11, fill: '#5C5850' }}
                    tickLine={false}
                    axisLine={{ stroke: '#E8E5DE' }}
                  />
                  <YAxis
                    stroke="#9B9589"
                    tick={{ fontSize: 12, fill: '#5C5850' }}
                    tickLine={false}
                    axisLine={{ stroke: '#E8E5DE' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(15, 139, 141, 0.05)' }} />
                  <Bar
                    dataKey="count"
                    fill={CHART_COLORS.teal}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
