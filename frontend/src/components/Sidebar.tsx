'use client';

import {
  Activity,
  FileText,
  TrendingUp,
  Layers,
  Database,
  Settings,
  RefreshCw,
  Upload,
  Shield,
  AlertTriangle,
  Users,
  Crosshair,
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
      icon: <Activity size={18} />,
    },
    {
      id: 'briefings',
      label: 'Briefings',
      icon: <FileText size={18} />,
    },
    {
      id: 'threads',
      label: 'Articles',
      icon: <Layers size={18} />,
      badge: stats?.total_items
    },
    {
      id: 'feeds',
      label: 'Threat Feeds',
      icon: <Database size={18} />,
    },
    {
      id: 'trends',
      label: 'Analysis',
      icon: <TrendingUp size={18} />,
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onUpload(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  // Calculate impactful metrics
  const criticalAlerts = stats?.top_cves?.length || 0;
  const activeActors = stats?.all_actors?.length || 0;
  const attackSurface = stats?.product_counts ? Object.keys(stats.product_counts).length : 0;

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-900 tracking-tight">IntelMesh</h1>
            <p className="text-[10px] text-slate-400 font-medium">{format(new Date(), 'MMM d, yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Impactful Stats */}
      {stats && (
        <div className="p-3 border-b border-slate-200">
          <div className="space-y-2">
            {/* Critical Alerts */}
            <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-500" />
                <span className="text-xs font-medium text-slate-700">Critical Vulns</span>
              </div>
              <span className="text-sm font-semibold text-red-600">{criticalAlerts}</span>
            </div>

            {/* Active Threat Actors */}
            <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-purple-500" />
                <span className="text-xs font-medium text-slate-700">Active Actors</span>
              </div>
              <span className="text-sm font-semibold text-purple-600">{activeActors}</span>
            </div>

            {/* Attack Surface */}
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2">
                <Crosshair size={14} className="text-blue-500" />
                <span className="text-xs font-medium text-slate-700">Products at Risk</span>
              </div>
              <span className="text-sm font-semibold text-blue-600">{attackSurface}</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-white/20' : 'bg-slate-200 text-slate-600'
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
      <div className="p-3 border-t border-slate-200 space-y-2">
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : 'Sync News'}
        </button>

        <label className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 cursor-pointer transition-colors">
          <Upload size={14} />
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
      <div className="p-2 border-t border-slate-200">
        <button
          onClick={() => onViewChange('settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'settings'
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
