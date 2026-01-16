'use client';

import {
  LayoutDashboard,
  Shield,
  Target,
  Skull,
  FileText,
  Settings,
  Zap
} from 'lucide-react';
import { ViewType } from '@/types';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  stats?: {
    total_cves: number;
    total_iocs: number;
    total_threats: number;
    total_items: number;
  };
}

export default function Sidebar({ currentView, onViewChange, stats }: SidebarProps) {
  const navItems: { id: ViewType; label: string; icon: React.ReactNode; count?: number; accentColor: string }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard size={20} />,
      accentColor: 'cyan'
    },
    {
      id: 'cves',
      label: 'CVEs',
      icon: <Shield size={20} />,
      count: stats?.total_cves,
      accentColor: 'red'
    },
    {
      id: 'iocs',
      label: 'IoCs',
      icon: <Target size={20} />,
      count: stats?.total_iocs,
      accentColor: 'amber'
    },
    {
      id: 'threats',
      label: 'Threats',
      icon: <Skull size={20} />,
      count: stats?.total_threats,
      accentColor: 'violet'
    },
    {
      id: 'items',
      label: 'All Items',
      icon: <FileText size={20} />,
      count: stats?.total_items,
      accentColor: 'cyan'
    },
  ];

  const getAccentClasses = (accentColor: string, isActive: boolean) => {
    const accents: Record<string, { active: string; inactive: string; badge: string }> = {
      cyan: {
        active: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30 shadow-glow-cyan/20',
        inactive: 'text-dark-100 hover:bg-dark-700/50 hover:text-accent-cyan',
        badge: 'bg-accent-cyan/20 text-accent-cyan'
      },
      red: {
        active: 'bg-accent-red/10 text-accent-red border-accent-red/30 shadow-glow-red/20',
        inactive: 'text-dark-100 hover:bg-dark-700/50 hover:text-accent-red',
        badge: 'bg-accent-red/20 text-accent-red'
      },
      amber: {
        active: 'bg-accent-amber/10 text-accent-amber border-accent-amber/30 shadow-glow-amber/20',
        inactive: 'text-dark-100 hover:bg-dark-700/50 hover:text-accent-amber',
        badge: 'bg-accent-amber/20 text-accent-amber'
      },
      violet: {
        active: 'bg-accent-violet/10 text-accent-violet border-accent-violet/30 shadow-glow-violet/20',
        inactive: 'text-dark-100 hover:bg-dark-700/50 hover:text-accent-violet',
        badge: 'bg-accent-violet/20 text-accent-violet'
      },
    };
    return accents[accentColor] || accents.cyan;
  };

  return (
    <aside className="w-72 bg-dark-800/50 backdrop-blur-xl border-r border-dark-700/50 flex flex-col h-full relative z-10">
      {/* Logo Section */}
      <div className="p-6 border-b border-dark-700/50">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan to-accent-violet rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-violet flex items-center justify-center">
              <Zap size={24} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-white tracking-tight">
              IntelMesh
            </h1>
            <p className="text-xs text-dark-100 font-mono tracking-wider uppercase">
              Threat Intelligence
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="mt-5 flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-700/30 border border-dark-600/50">
          <div className="status-dot status-dot-active" />
          <span className="text-xs text-dark-100 font-medium">System Active</span>
          <span className="ml-auto text-xs text-accent-emerald font-mono">LIVE</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <p className="text-xs font-semibold text-dark-200 uppercase tracking-wider mb-4 px-3">
          Navigation
        </p>
        <ul className="space-y-1.5">
          {navItems.map((item, index) => {
            const isActive = currentView === item.id;
            const accents = getAccentClasses(item.accentColor, isActive);

            return (
              <li
                key={item.id}
                className="animate-fadeInUp"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive
                      ? `${accents.active} border`
                      : `${accents.inactive} border border-transparent`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'animate-float' : ''}>
                      {item.icon}
                    </span>
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`text-xs font-mono px-2.5 py-1 rounded-lg ${
                      isActive ? accents.badge : 'bg-dark-600/50 text-dark-100'
                    }`}>
                      {item.count.toLocaleString()}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-dark-700/50">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-dark-200 hover:text-white hover:bg-dark-700/50 transition-all duration-200 group">
          <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
          <span className="text-sm font-medium">Settings</span>
        </button>

        {/* Version info */}
        <div className="mt-4 px-4 flex items-center justify-between text-xs text-dark-300">
          <span className="font-mono">v1.0.0</span>
          <span className="font-mono opacity-50">2024</span>
        </div>
      </div>

      {/* Decorative gradient line */}
      <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-accent-cyan/20 to-transparent" />
    </aside>
  );
}
