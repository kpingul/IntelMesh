'use client';

import {
  Activity,
  TrendingUp,
  Layers,
  Database,
  Settings,
  RefreshCw,
  Upload,
  Shield,
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
  const navItems: { id: ViewType; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'today',
      label: 'Dashboard',
      icon: <Activity size={16} />,
    },
    {
      id: 'trends',
      label: 'Analysis',
      icon: <TrendingUp size={16} />,
    },
    {
      id: 'threads',
      label: 'Articles',
      icon: <Layers size={16} />,
      badge: stats?.total_items
    },
    {
      id: 'feeds',
      label: 'Threat Feeds',
      icon: <Database size={16} />,
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onUpload(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <aside className="w-52 bg-white border-r border-stone-200 flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-stone-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-500/20">
            <Shield size={14} className="text-white" />
          </div>
          <div>
            <h1 className="font-medium text-stone-900 tracking-tight text-sm">IntelMesh</h1>
            <p className="text-[10px] text-stone-400">{format(new Date(), 'MMM d, yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded tabular-nums ${
                      isActive ? 'bg-cyan-100 text-cyan-700' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Actions */}
      <div className="p-3 border-t border-stone-200 space-y-2">
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white text-xs font-medium rounded-lg hover:from-slate-600 hover:to-slate-700 disabled:opacity-50 transition-all shadow-lg shadow-slate-500/20"
        >
          <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : 'Sync News'}
        </button>

        <label className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-stone-100 text-stone-600 text-xs font-medium rounded-lg hover:bg-stone-200 cursor-pointer transition-colors border border-stone-200">
          <Upload size={12} />
          Upload PDF
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

      {/* Settings */}
      <div className="p-2 border-t border-stone-200">
        <button
          onClick={() => onViewChange('settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            currentView === 'settings'
              ? 'bg-stone-100 text-stone-900'
              : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
