'use client';

import { Skull, Bug, Users, ChevronRight, TrendingUp, AlertTriangle } from 'lucide-react';
import { ThreatEntry } from '@/types';
import { useState } from 'react';

interface ThreatsViewProps {
  threats: ThreatEntry[];
  isLoading: boolean;
  onItemClick: (itemId: string) => void;
}

type ThreatTab = 'all' | 'malware' | 'actors';

export default function ThreatsView({ threats, isLoading, onItemClick }: ThreatsViewProps) {
  const [activeTab, setActiveTab] = useState<ThreatTab>('all');

  const malwareCount = threats.filter(t => t.type === 'malware').length;
  const actorCount = threats.filter(t => t.type === 'actor').length;

  const tabs: { id: ThreatTab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: 'All Threats', icon: <Skull size={16} />, count: threats.length },
    { id: 'malware', label: 'Malware', icon: <Bug size={16} />, count: malwareCount },
    { id: 'actors', label: 'Threat Actors', icon: <Users size={16} />, count: actorCount },
  ];

  const filteredThreats = activeTab === 'all'
    ? threats
    : threats.filter(t => t.type === activeTab.replace('actors', 'actor'));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="skeleton h-8 w-8 rounded-lg" />
          <div className="skeleton h-7 w-32" />
        </div>
        <div className="flex gap-2 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-11 w-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="skeleton h-24 rounded-2xl" />
          <div className="skeleton h-24 rounded-2xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (threats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-5 rounded-2xl bg-accent-violet/10 border border-accent-violet/20 mb-5">
          <Skull size={48} className="text-accent-violet" />
        </div>
        <h3 className="text-xl font-display font-semibold text-white">No Threats Identified</h3>
        <p className="text-dark-200 mt-2 max-w-sm">
          Sync news or upload PDFs mentioning malware or threat actors
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent-violet/15">
            <Skull size={22} className="text-accent-violet" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">Threats</h2>
            <p className="text-sm text-dark-200">{threats.length} threats identified</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 pb-6 border-b border-dark-600/30">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 border ${
              activeTab === tab.id
                ? 'bg-accent-violet/15 text-accent-violet border-accent-violet/30'
                : 'text-dark-100 hover:bg-dark-700/50 hover:text-accent-violet border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`text-xs font-mono px-2 py-0.5 rounded-lg ${
              activeTab === tab.id ? 'bg-white/10' : 'bg-dark-600/50'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-accent-red/15 to-accent-red/5 border border-accent-red/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent-red/15 rounded-xl">
              <Bug size={24} className="text-accent-red" />
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-accent-red">{malwareCount}</p>
              <p className="text-sm text-dark-200 mt-1">Malware Families</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-gradient-to-br from-accent-violet/15 to-accent-violet/5 border border-accent-violet/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent-violet/15 rounded-xl">
              <Users size={24} className="text-accent-violet" />
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-accent-violet">{actorCount}</p>
              <p className="text-sm text-dark-200 mt-1">Threat Actors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Threats Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredThreats.map((threat, i) => (
          <div
            key={threat.name}
            className={`group rounded-2xl p-5 border transition-all duration-300 animate-fadeInUp hover:scale-[1.01] ${
              threat.type === 'malware'
                ? 'bg-dark-700/30 border-dark-600/30 hover:border-accent-red/30'
                : 'bg-dark-700/30 border-dark-600/30 hover:border-accent-violet/30'
            }`}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  threat.type === 'malware'
                    ? 'bg-accent-red/15'
                    : 'bg-accent-violet/15'
                }`}>
                  {threat.type === 'malware' ? (
                    <Bug size={18} className="text-accent-red" />
                  ) : (
                    <Users size={18} className="text-accent-violet" />
                  )}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-white group-hover:text-accent-cyan transition-colors">
                    {threat.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                      threat.type === 'malware'
                        ? 'bg-accent-red/15 text-accent-red'
                        : 'bg-accent-violet/15 text-accent-violet'
                    }`}>
                      {threat.type === 'malware' ? 'Malware' : 'Threat Actor'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-dark-200">
                      <TrendingUp size={12} />
                      {threat.count} mention{threat.count > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Related items */}
            {threat.items.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-dark-300 uppercase tracking-wide font-medium">Found in:</p>
                {threat.items.slice(0, 2).map((item, j) => (
                  <button
                    key={j}
                    onClick={() => onItemClick(item.id)}
                    className="w-full text-left px-4 py-3 bg-dark-600/30 hover:bg-dark-600/50 rounded-xl transition-all duration-200 flex items-center justify-between group/item"
                  >
                    <span className="text-sm text-dark-100 group-hover/item:text-white truncate transition-colors">
                      {item.title}
                    </span>
                    <ChevronRight size={14} className="text-dark-300 group-hover/item:text-accent-cyan transition-colors" />
                  </button>
                ))}
                {threat.items.length > 2 && (
                  <p className="text-xs text-dark-300 pl-1">+{threat.items.length - 2} more</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
