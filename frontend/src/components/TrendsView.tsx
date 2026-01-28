'use client';

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Shield,
  Target,
  Activity,
  BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Stats, ThreatItem } from '@/types';

interface TrendsViewProps {
  stats: Stats | null;
  items: ThreatItem[];
  isLoading: boolean;
}

type TimeRange = '7d' | '30d' | '90d';

const CHART_COLORS = {
  blue: '#3b82f6',
  red: '#ef4444',
  amber: '#f59e0b',
  purple: '#8b5cf6',
  green: '#22c55e',
  cyan: '#06b6d4',
};

export default function TrendsView({
  stats,
  items,
  isLoading
}: TrendsViewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  const insights = useMemo(() => {
    if (!stats) return [];

    const insights: { text: string; type: 'rising' | 'persistent' | 'critical'; metric: string }[] = [];

    const topTechniques = Object.entries(stats.tag_counts).sort((a, b) => b[1] - a[1]);
    if (topTechniques.length > 0) {
      const [technique, count] = topTechniques[0];
      insights.push({
        text: `${technique.replace(/_/g, ' ')} technique detected ${count}x`,
        type: 'rising',
        metric: technique
      });
    }

    if (stats.total_cves > 0) {
      insights.push({
        text: `${stats.total_cves} CVEs actively being exploited`,
        type: 'critical',
        metric: 'CVEs'
      });
    }

    if (stats.all_actors.length > 0) {
      insights.push({
        text: `${stats.all_actors.length} threat actors identified`,
        type: 'persistent',
        metric: 'Actors'
      });
    }

    const totalIocs = stats.ioc_breakdown.ips + stats.ioc_breakdown.domains + stats.ioc_breakdown.hashes + stats.ioc_breakdown.urls;
    if (totalIocs > 0) {
      insights.push({
        text: `${totalIocs} indicators of compromise extracted`,
        type: 'rising',
        metric: 'IoCs'
      });
    }

    return insights.slice(0, 4);
  }, [stats]);

  const iocData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'IPs', value: stats.ioc_breakdown.ips, fill: CHART_COLORS.amber },
      { name: 'Domains', value: stats.ioc_breakdown.domains, fill: CHART_COLORS.blue },
      { name: 'Hashes', value: stats.ioc_breakdown.hashes, fill: CHART_COLORS.cyan },
      { name: 'URLs', value: stats.ioc_breakdown.urls, fill: CHART_COLORS.purple },
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
        fullMark: Math.max(...Object.values(stats.tag_counts)),
      }));
  }, [stats]);

  const radarData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.tag_counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({
        technique: tag.replace(/_/g, ' ').slice(0, 12),
        value: count,
        fullMark: Math.max(...Object.values(stats.tag_counts)),
      }));
  }, [stats]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-slate-700 text-xs font-medium">{label || payload[0].name}</p>
          <p className="text-blue-600 font-semibold text-lg">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-12 skeleton rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 skeleton rounded-xl" />
          <div className="h-64 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center bg-slate-50">
        <TrendingUp size={48} className="text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-700 mb-2">No trend data available</h3>
        <p className="text-sm text-slate-500">Sync intel to see trend analysis</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Trend Analysis</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Pattern recognition and threat landscape insights
            </p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  timeRange === range
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Insight Cards */}
        <div className="grid grid-cols-4 gap-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`bg-white p-4 rounded-lg border border-slate-200 border-l-4 ${
                insight.type === 'critical' ? 'border-l-red-500' :
                insight.type === 'rising' ? 'border-l-blue-500' : 'border-l-purple-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  insight.type === 'critical' ? 'bg-red-100' :
                  insight.type === 'rising' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  {insight.type === 'critical' ? (
                    <AlertTriangle size={16} className="text-red-600" />
                  ) : insight.type === 'rising' ? (
                    <TrendingUp size={16} className="text-blue-600" />
                  ) : (
                    <Activity size={16} className="text-purple-600" />
                  )}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {insight.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Technique Distribution - Radar */}
          {radarData.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-blue-500" />
                <h3 className="font-medium text-slate-800 text-sm">Attack Technique Radar</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                      dataKey="technique"
                      tick={{ fill: '#64748b', fontSize: 10 }}
                    />
                    <PolarRadiusAxis
                      stroke="#e2e8f0"
                      tick={{ fill: '#94a3b8', fontSize: 9 }}
                    />
                    <Radar
                      name="Occurrences"
                      dataKey="value"
                      stroke={CHART_COLORS.blue}
                      fill={CHART_COLORS.blue}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* IoC Breakdown - Donut */}
          {iocData.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Target size={16} className="text-amber-500" />
                <h3 className="font-medium text-slate-800 text-sm">IoC Distribution</h3>
              </div>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={iocData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {iocData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {iocData.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span className="text-xs text-slate-600">{entry.name}</span>
                    <span className="text-xs text-slate-400">({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top CVEs */}
          {stats.top_cves.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={16} className="text-red-500" />
                <h3 className="font-medium text-slate-800 text-sm">Top CVEs</h3>
              </div>
              <div className="space-y-3">
                {stats.top_cves.slice(0, 6).map(([cve, count], i) => (
                  <div key={i} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <code className="text-xs text-red-600 group-hover:text-red-700 transition-colors">
                        {cve}
                      </code>
                      <span className="text-xs text-slate-400">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-500 transition-all duration-500"
                        style={{ width: `${(count / stats.top_cves[0][1]) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Threats */}
          {stats.top_threats.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-purple-500" />
                <h3 className="font-medium text-slate-800 text-sm">Threat Actors</h3>
              </div>
              <div className="space-y-3">
                {stats.top_threats.slice(0, 6).map(([threat, count], i) => (
                  <div key={i} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-purple-600 group-hover:text-purple-700 transition-colors">
                        {threat}
                      </span>
                      <span className="text-xs text-slate-400">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-500 transition-all duration-500"
                        style={{ width: `${(count / stats.top_threats[0][1]) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technique Bar Chart - Full width */}
          {techniqueData.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-4 col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-green-500" />
                <h3 className="font-medium text-slate-800 text-sm">Attack Technique Frequency</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={techniqueData} barCategoryGap="15%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
                    <Bar
                      dataKey="count"
                      fill={CHART_COLORS.blue}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
