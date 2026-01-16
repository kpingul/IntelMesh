'use client';

import { Stats } from '@/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface OverviewChartsProps {
  stats: Stats | null;
}

const COLORS = {
  cyan: '#38bdf8',
  violet: '#a78bfa',
  red: '#fb7185',
  amber: '#fbbf24',
  emerald: '#34d399',
  magenta: '#f472b6',
};

export default function OverviewCharts({ stats }: OverviewChartsProps) {
  if (!stats) return null;

  // Source distribution data
  const sourceData = [
    { name: 'BleepingComputer', value: stats.sources.bleepingcomputer, color: COLORS.cyan },
    { name: 'GBHackers', value: stats.sources.gbhackers, color: COLORS.emerald },
    { name: 'PDFs', value: stats.sources.pdf, color: COLORS.violet },
  ].filter(d => d.value > 0);

  // IoC breakdown data
  const iocData = [
    { name: 'IPs', value: stats.ioc_breakdown.ips, fill: COLORS.amber },
    { name: 'Domains', value: stats.ioc_breakdown.domains, fill: COLORS.cyan },
    { name: 'Hashes', value: stats.ioc_breakdown.hashes, fill: COLORS.emerald },
    { name: 'URLs', value: stats.ioc_breakdown.urls, fill: COLORS.violet },
  ].filter(d => d.value > 0);

  // Top CVEs data
  const topCVEsData = stats.top_cves.slice(0, 5).map(([cve, count]) => ({
    name: cve,
    count,
  }));

  // Top Threats data
  const topThreatsData = stats.top_threats.slice(0, 5).map(([threat, count]) => ({
    name: threat,
    count,
  }));

  // TTP tags data
  const ttpData = Object.entries(stats.tag_counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, count]) => ({
      name: tag.replace(/_/g, ' '),
      count,
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-700/95 backdrop-blur-xl border border-dark-600/50 rounded-xl px-4 py-3 shadow-2xl shadow-black/50">
          <p className="text-white font-medium text-sm">{label || payload[0].name}</p>
          <p className="text-accent-cyan font-mono text-lg font-bold mt-1">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const ChartCard = ({
    title,
    children,
    className = ''
  }: {
    title: string;
    children: React.ReactNode;
    className?: string
  }) => (
    <div className={`rounded-2xl p-6 bg-dark-700/30 border border-dark-600/30 hover:border-dark-500/50 transition-all duration-300 ${className}`}>
      <h3 className="text-base font-display font-semibold text-white mb-5 flex items-center gap-2">
        <TrendingUp size={16} className="text-accent-cyan" />
        {title}
      </h3>
      {children}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
      {/* Sources Distribution */}
      {sourceData.length > 0 && (
        <ChartCard title="Sources Distribution">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {sourceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      style={{
                        filter: `drop-shadow(0 0 8px ${entry.color}40)`
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {sourceData.map((entry, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: entry.color,
                    boxShadow: `0 0 8px ${entry.color}60`
                  }}
                />
                <span className="text-sm text-dark-100 font-medium">
                  {entry.name}
                </span>
                <span className="text-sm text-dark-200 font-mono">
                  ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {/* IoC Breakdown */}
      {iocData.length > 0 && (
        <ChartCard title="IoC Breakdown">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={iocData} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(56, 189, 248, 0.08)" horizontal={false} />
                <XAxis type="number" stroke="#4a5e73" tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#4a5e73"
                  width={70}
                  tick={{ fontSize: 12, fill: '#8b9eb0' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(56, 189, 248, 0.05)' }} />
                <Bar
                  dataKey="value"
                  radius={[0, 6, 6, 0]}
                  style={{ filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.3))' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* Top CVEs */}
      {topCVEsData.length > 0 && (
        <ChartCard title="Top CVEs">
          <div className="space-y-4">
            {topCVEsData.map((cve, i) => (
              <div key={i} className="group">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-accent-red font-mono text-sm font-medium group-hover:text-white transition-colors">
                    {cve.name}
                  </code>
                  <span className="text-dark-100 text-sm font-mono">{cve.count}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill bg-gradient-to-r from-accent-red to-accent-magenta"
                    style={{
                      width: `${(cve.count / topCVEsData[0].count) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {/* Top Threats */}
      {topThreatsData.length > 0 && (
        <ChartCard title="Top Threats">
          <div className="space-y-4">
            {topThreatsData.map((threat, i) => (
              <div key={i} className="group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-accent-violet font-medium text-sm group-hover:text-white transition-colors">
                    {threat.name}
                  </span>
                  <span className="text-dark-100 text-sm font-mono">{threat.count}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill bg-gradient-to-r from-accent-violet to-accent-cyan"
                    style={{
                      width: `${(threat.count / topThreatsData[0].count) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {/* TTP Tags Distribution */}
      {ttpData.length > 0 && (
        <ChartCard title="TTP Distribution" className="lg:col-span-2">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ttpData} barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(56, 189, 248, 0.08)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#4a5e73"
                  tick={{ fontSize: 11, fill: '#8b9eb0' }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(56, 189, 248, 0.1)' }}
                />
                <YAxis
                  stroke="#4a5e73"
                  tick={{ fontSize: 12, fill: '#8b9eb0' }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(56, 189, 248, 0.1)' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(56, 189, 248, 0.05)' }} />
                <Bar
                  dataKey="count"
                  fill="url(#barGradient)"
                  radius={[6, 6, 0, 0]}
                  style={{ filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.3))' }}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.cyan} stopOpacity={1} />
                    <stop offset="100%" stopColor={COLORS.violet} stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}
    </div>
  );
}
