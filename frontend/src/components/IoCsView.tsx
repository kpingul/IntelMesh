'use client';

import { Target, Globe, Link2, Hash, Copy, CheckCircle, ChevronRight, Inbox } from 'lucide-react';
import { IoCs } from '@/types';
import { useState } from 'react';

interface IoCsViewProps {
  iocs: IoCs | null;
  isLoading: boolean;
  onItemClick: (itemId: string) => void;
}

type IoCTab = 'ips' | 'domains' | 'hashes' | 'urls';

export default function IoCsView({ iocs, isLoading, onItemClick }: IoCsViewProps) {
  const [activeTab, setActiveTab] = useState<IoCTab>('ips');
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const copyToClipboard = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const tabs: { id: IoCTab; label: string; icon: React.ReactNode; count: number; color: string }[] = [
    { id: 'ips', label: 'IPs', icon: <Globe size={16} />, count: iocs?.ips.length ?? 0, color: 'amber' },
    { id: 'domains', label: 'Domains', icon: <Link2 size={16} />, count: iocs?.domains.length ?? 0, color: 'cyan' },
    { id: 'hashes', label: 'Hashes', icon: <Hash size={16} />, count: iocs?.hashes.length ?? 0, color: 'emerald' },
    { id: 'urls', label: 'URLs', icon: <Link2 size={16} />, count: iocs?.urls.length ?? 0, color: 'violet' },
  ];

  const totalIoCs = tabs.reduce((sum, tab) => sum + tab.count, 0);

  const getTabColors = (tabId: IoCTab, isActive: boolean) => {
    const colors: Record<string, { active: string; inactive: string }> = {
      ips: {
        active: 'bg-accent-amber/15 text-accent-amber border-accent-amber/30',
        inactive: 'text-dark-100 hover:bg-dark-700/50 hover:text-accent-amber'
      },
      domains: {
        active: 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30',
        inactive: 'text-dark-100 hover:bg-dark-700/50 hover:text-accent-cyan'
      },
      hashes: {
        active: 'bg-accent-emerald/15 text-accent-emerald border-accent-emerald/30',
        inactive: 'text-dark-100 hover:bg-dark-700/50 hover:text-accent-emerald'
      },
      urls: {
        active: 'bg-accent-violet/15 text-accent-violet border-accent-violet/30',
        inactive: 'text-dark-100 hover:bg-dark-700/50 hover:text-accent-violet'
      },
    };
    return colors[tabId] || colors.ips;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="skeleton h-8 w-8 rounded-lg" />
          <div className="skeleton h-7 w-48" />
        </div>
        <div className="flex gap-2 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-11 w-28 rounded-xl" />
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl p-5 bg-dark-700/30 border border-dark-600/30">
            <div className="skeleton h-5 w-64" />
          </div>
        ))}
      </div>
    );
  }

  if (totalIoCs === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-5 rounded-2xl bg-accent-amber/10 border border-accent-amber/20 mb-5">
          <Target size={48} className="text-accent-amber" />
        </div>
        <h3 className="text-xl font-display font-semibold text-white">No IoCs Found</h3>
        <p className="text-dark-200 mt-2 max-w-sm">
          Sync news or upload PDFs containing indicators of compromise
        </p>
      </div>
    );
  }

  const currentData = iocs?.[activeTab] ?? [];

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent-amber/15">
            <Target size={22} className="text-accent-amber" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">Indicators of Compromise</h2>
            <p className="text-sm text-dark-200">{totalIoCs} indicators tracked</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 pb-6 border-b border-dark-600/30">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const colors = getTabColors(tab.id, isActive);

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 border ${
                isActive ? colors.active : `${colors.inactive} border-transparent`
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`text-xs font-mono px-2 py-0.5 rounded-lg ${
                isActive ? 'bg-white/10' : 'bg-dark-600/50'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* IoC List */}
      {currentData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox size={40} className="text-dark-300 mb-3" />
          <p className="text-dark-200">No {activeTab} found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {currentData.map((ioc, i) => (
            <div
              key={i}
              className="group rounded-2xl p-4 bg-dark-700/30 border border-dark-600/30 hover:border-dark-500/50 flex items-center justify-between animate-fadeInUp transition-all duration-300"
              style={{ animationDelay: `${i * 20}ms` }}
            >
              <div className="flex-1 min-w-0">
                {activeTab === 'hashes' ? (
                  <div>
                    <span className="text-xs text-dark-300 uppercase font-mono font-medium">
                      {(ioc as any).type}
                    </span>
                    <code className="block text-accent-emerald font-mono text-sm truncate mt-1">
                      {ioc.value}
                    </code>
                  </div>
                ) : (
                  <code className={`font-mono text-sm ${
                    activeTab === 'ips' ? 'text-accent-amber' :
                    activeTab === 'domains' ? 'text-accent-cyan' : 'text-accent-violet'
                  }`}>
                    {ioc.value}
                  </code>
                )}
                <p className="text-xs text-dark-300 mt-2 truncate">
                  Found in: <span className="text-dark-200">{ioc.source_item.title}</span>
                </p>
              </div>

              <div className="flex items-center gap-1 ml-4">
                <button
                  onClick={() => copyToClipboard(ioc.value)}
                  className="p-2 text-dark-200 hover:text-accent-cyan hover:bg-accent-cyan/10 rounded-lg transition-all duration-200"
                  title="Copy"
                >
                  {copiedValue === ioc.value ? (
                    <CheckCircle size={16} className="text-accent-emerald" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
                <button
                  onClick={() => onItemClick(ioc.source_item.id)}
                  className="p-2 text-dark-200 hover:text-white hover:bg-dark-600/50 rounded-lg transition-all duration-200"
                  title="View source"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tip */}
      <div className="mt-8 p-5 rounded-2xl bg-dark-700/20 border border-dark-600/30">
        <p className="text-sm text-dark-200">
          <strong className="text-white font-medium">Tip:</strong> Click the copy button to copy individual IoCs,
          or use the search bar with queries like "show IPs" or "list domains" to filter results.
        </p>
      </div>
    </div>
  );
}
