'use client';

import {
  Radar,
  FileText,
  TrendingUp,
  Layers,
  BookOpen,
  GraduationCap,
  Settings,
  RefreshCw,
  Upload,
  ChevronRight
} from 'lucide-react';
import { ViewType, Stats } from '@/types';
import { format } from 'date-fns';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  stats?: Stats;
  onSync: () => void;
  onUpload: (files: File[]) => void;
  isSyncing: boolean;
  isUploading: boolean;
}

export default function Sidebar({
  currentView,
  onViewChange,
  stats,
  onSync,
  onUpload,
  isSyncing,
  isUploading
}: SidebarProps) {
  const navItems: { id: ViewType; label: string; icon: React.ReactNode; description: string }[] = [
    {
      id: 'today',
      label: 'Today',
      icon: <Radar size={20} />,
      description: 'Daily briefing'
    },
    {
      id: 'briefings',
      label: 'Briefings',
      icon: <FileText size={20} />,
      description: 'Daily, weekly, monthly'
    },
    {
      id: 'trends',
      label: 'Trends',
      icon: <TrendingUp size={20} />,
      description: 'Patterns & shifts'
    },
    {
      id: 'threads',
      label: 'Threads',
      icon: <Layers size={20} />,
      description: 'Threat stories'
    },
    {
      id: 'playbooks',
      label: 'Playbooks',
      icon: <BookOpen size={20} />,
      description: 'Attack flows'
    },
    {
      id: 'learning',
      label: 'Learning',
      icon: <GraduationCap size={20} />,
      description: 'Your queue'
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onUpload(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <aside className="w-72 bg-white border-r border-ink-100 flex flex-col h-full relative">
      {/* Logo Section */}
      <div className="p-6 border-b border-ink-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-coral to-accent-amber flex items-center justify-center shadow-soft">
            <Radar size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-semibold text-lg text-ink-900 tracking-tight">
              Threat Radar
            </h1>
            <p className="text-xs text-ink-400 font-medium">
              Intelligence Briefings
            </p>
          </div>
        </div>

        {/* Today's date */}
        <div className="mt-4 flex items-center justify-between">
          <span className="date-badge">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-coral" />
            {format(new Date(), 'EEEE, MMM d')}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="px-6 py-4 border-b border-ink-100 bg-paper-50">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-2xl font-display font-semibold text-ink-900">
                {stats.total_items}
              </div>
              <div className="text-xs text-ink-400 font-medium">Articles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-semibold text-accent-coral">
                {stats.total_cves}
              </div>
              <div className="text-xs text-ink-400 font-medium">CVEs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-semibold text-accent-amber">
                {stats.total_iocs}
              </div>
              <div className="text-xs text-ink-400 font-medium">IoCs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-semibold text-accent-violet">
                {stats.total_threats}
              </div>
              <div className="text-xs text-ink-400 font-medium">Threats</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <p className="text-xs font-semibold text-ink-300 uppercase tracking-wider mb-3 px-3">
          Navigation
        </p>
        <ul className="space-y-1">
          {navItems.map((item, index) => {
            const isActive = currentView === item.id;

            return (
              <li
                key={item.id}
                className="animate-fadeInUp"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-accent-coral/10 text-accent-coral'
                      : 'text-ink-600 hover:bg-paper-200 hover:text-ink-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                      {item.icon}
                    </span>
                    <div className="text-left">
                      <span className={`block text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>
                        {item.label}
                      </span>
                      <span className={`block text-xs ${isActive ? 'text-accent-coral/70' : 'text-ink-400'}`}>
                        {item.description}
                      </span>
                    </div>
                  </div>
                  {isActive && (
                    <ChevronRight size={16} className="text-accent-coral" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Actions */}
      <div className="p-4 border-t border-ink-100 space-y-2">
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ink-900 text-white font-medium text-sm transition-all duration-200 hover:bg-ink-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : 'Sync News'}
        </button>

        <label className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-ink-200 text-ink-700 font-medium text-sm transition-all duration-200 hover:bg-paper-100 cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Upload size={16} className={isUploading ? 'animate-pulse' : ''} />
          {isUploading ? 'Uploading...' : 'Upload PDFs'}
          <input
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Settings & Footer */}
      <div className="p-4 border-t border-ink-100">
        <button
          onClick={() => onViewChange('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
            currentView === 'settings'
              ? 'bg-paper-200 text-ink-800'
              : 'text-ink-500 hover:bg-paper-100 hover:text-ink-700'
          }`}
        >
          <Settings size={18} className="group-hover:rotate-45 transition-transform duration-300" />
          <span className="text-sm font-medium">Settings</span>
        </button>

        {/* Version info */}
        <div className="mt-3 px-3 flex items-center justify-between text-xs text-ink-300">
          <span className="font-mono">v2.0.0</span>
          <span>Cyber Threat Radar</span>
        </div>
      </div>
    </aside>
  );
}
