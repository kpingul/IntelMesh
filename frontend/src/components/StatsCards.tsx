'use client';

import { FileText, Shield, Target, Skull, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Stats } from '@/types';

interface StatsCardsProps {
  stats: Stats | null;
  isLoading: boolean;
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const cards = [
    {
      label: 'Total Items',
      value: stats?.total_items ?? 0,
      subtext: `${stats?.articles ?? 0} articles, ${stats?.pdfs ?? 0} PDFs`,
      icon: <FileText size={22} />,
      accentColor: 'cyan',
      gradient: 'from-accent-cyan/20 to-accent-cyan/5',
      borderColor: 'border-accent-cyan/20',
      iconBg: 'bg-accent-cyan/15',
      textColor: 'text-accent-cyan',
    },
    {
      label: 'CVEs Found',
      value: stats?.total_cves ?? 0,
      subtext: stats?.top_cves?.[0] ? `Top: ${stats.top_cves[0][0]}` : 'No CVEs yet',
      icon: <Shield size={22} />,
      accentColor: 'red',
      gradient: 'from-accent-red/20 to-accent-red/5',
      borderColor: 'border-accent-red/20',
      iconBg: 'bg-accent-red/15',
      textColor: 'text-accent-red',
    },
    {
      label: 'IoCs Extracted',
      value: stats?.total_iocs ?? 0,
      subtext: stats ? `${stats.ioc_breakdown.ips} IPs, ${stats.ioc_breakdown.domains} domains` : 'No IoCs yet',
      icon: <Target size={22} />,
      accentColor: 'amber',
      gradient: 'from-accent-amber/20 to-accent-amber/5',
      borderColor: 'border-accent-amber/20',
      iconBg: 'bg-accent-amber/15',
      textColor: 'text-accent-amber',
    },
    {
      label: 'Threats Identified',
      value: stats?.total_threats ?? 0,
      subtext: `${stats?.all_malware?.length ?? 0} malware, ${stats?.all_actors?.length ?? 0} actors`,
      icon: <Skull size={22} />,
      accentColor: 'violet',
      gradient: 'from-accent-violet/20 to-accent-violet/5',
      borderColor: 'border-accent-violet/20',
      iconBg: 'bg-accent-violet/15',
      textColor: 'text-accent-violet',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="relative rounded-2xl p-6 bg-dark-700/50 border border-dark-600/30 overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-10 w-20" />
                <div className="skeleton h-3 w-32" />
              </div>
              <div className="skeleton w-12 h-12 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`group relative rounded-2xl p-6 bg-gradient-to-br ${card.gradient} border ${card.borderColor} overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-xl animate-fadeInUp cursor-default`}
          style={{ animationDelay: `${i * 80}ms` }}
        >
          {/* Background glow effect */}
          <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${card.gradient} blur-3xl opacity-50 group-hover:opacity-75 transition-opacity duration-500`} />

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-dark-100 text-sm font-medium tracking-wide uppercase">
                  {card.label}
                </p>
                <p className={`text-4xl font-display font-bold mt-2 ${card.textColor}`}>
                  {card.value.toLocaleString()}
                </p>
                <p className="text-dark-200 text-sm mt-3 font-mono">{card.subtext}</p>
              </div>

              <div className={`${card.iconBg} ${card.textColor} p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                {card.icon}
              </div>
            </div>

            {/* Trend indicator */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dark-600/30">
              <div className="flex items-center gap-1 text-accent-emerald text-xs font-medium">
                <ArrowUpRight size={14} />
                <span>Live</span>
              </div>
              <span className="text-dark-300 text-xs">|</span>
              <span className="text-dark-200 text-xs">Updated in real-time</span>
            </div>
          </div>

          {/* Corner accent */}
          <div className={`absolute top-0 left-0 w-16 h-16 overflow-hidden`}>
            <div className={`absolute -top-8 -left-8 w-16 h-16 rotate-45 ${card.iconBg}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
