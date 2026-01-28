'use client';

import { useState } from 'react';
import {
  Settings,
  Trash2,
  Shield,
  Database,
  Download,
  Upload,
  CheckCircle,
  Zap,
  Globe,
  Plus,
  X,
  Check,
  Target,
  Tag,
  Building
} from 'lucide-react';
import { UserPreferences, WatchlistItem } from '@/types';

interface SettingsViewProps {
  onClearData: () => void;
}

export default function SettingsView({ onClearData }: SettingsViewProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    briefingMode: 'analyst',
    briefingLength: 10,
    preferredCategories: ['ransomware', 'phishing', 'exploitation'],
    preferredVendors: ['Microsoft', 'Cisco', 'Palo Alto'],
    preferredTechniques: ['credential_theft', 'lateral_movement'],
    watchlist: [
      { id: '1', type: 'vendor', value: 'Microsoft' },
      { id: '2', type: 'technique', value: 'Phishing' },
      { id: '3', type: 'actor', value: 'APT29' },
    ],
    trendWindow: '30d',
  });

  const [confirmClear, setConfirmClear] = useState(false);
  const [showCleared, setShowCleared] = useState(false);
  const [newWatchlistItem, setNewWatchlistItem] = useState({ type: 'vendor' as WatchlistItem['type'], value: '' });
  const [showAddWatchlist, setShowAddWatchlist] = useState(false);

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const addWatchlistItem = () => {
    if (!newWatchlistItem.value.trim()) return;

    const newItem: WatchlistItem = {
      id: Date.now().toString(),
      type: newWatchlistItem.type,
      value: newWatchlistItem.value.trim(),
    };

    updatePreference('watchlist', [...preferences.watchlist, newItem]);
    setNewWatchlistItem({ type: 'vendor', value: '' });
    setShowAddWatchlist(false);
  };

  const removeWatchlistItem = (id: string) => {
    updatePreference('watchlist', preferences.watchlist.filter(item => item.id !== id));
  };

  const getWatchlistIcon = (type: WatchlistItem['type']) => {
    switch (type) {
      case 'vendor':
        return <Building size={14} className="text-blue-500" />;
      case 'technique':
        return <Target size={14} className="text-cyan-500" />;
      case 'actor':
        return <Shield size={14} className="text-purple-500" />;
      case 'category':
        return <Tag size={14} className="text-amber-500" />;
      case 'cve':
        return <Shield size={14} className="text-red-500" />;
      default:
        return <Tag size={14} className="text-slate-400" />;
    }
  };

  const handleClear = () => {
    if (confirmClear) {
      onClearData();
      setConfirmClear(false);
      setShowCleared(true);
      setTimeout(() => setShowCleared(false), 3000);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 5000);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="p-6 space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure your IntelMesh experience
          </p>
        </div>

        {/* Success Message */}
        {showCleared && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
            <CheckCircle size={18} className="text-green-500" />
            <p className="text-sm text-green-700">All data has been cleared successfully.</p>
          </div>
        )}

        {/* Briefing Preferences */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <Settings size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-medium text-slate-900">Briefing Preferences</h2>
              <p className="text-xs text-slate-500 mt-0.5">Configure how briefings are generated</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Briefing Mode */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">Default Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {(['executive', 'analyst', 'engineer'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updatePreference('briefingMode', mode)}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      preferences.briefingMode === mode
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium capitalize ${preferences.briefingMode === mode ? 'text-blue-600' : 'text-slate-700'}`}>
                        {mode}
                      </span>
                      {preferences.briefingMode === mode && (
                        <Check size={14} className="text-blue-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {mode === 'executive' && 'High-level impact'}
                      {mode === 'analyst' && 'Investigation focus'}
                      {mode === 'engineer' && 'Detection focus'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Trend Window */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">Trend Window</label>
              <div className="flex items-center gap-2">
                {(['7d', '30d', '90d'] as const).map((window) => (
                  <button
                    key={window}
                    onClick={() => updatePreference('trendWindow', window)}
                    className={`px-4 py-2 rounded-lg border transition-all text-sm ${
                      preferences.trendWindow === window
                        ? 'border-blue-500 bg-blue-50 text-blue-600 font-medium'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {window === '7d' ? '7 Days' : window === '30d' ? '30 Days' : '90 Days'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Watchlist */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-100">
              <Target size={18} className="text-amber-600" />
            </div>
            <div>
              <h2 className="font-medium text-slate-900">Watchlist</h2>
              <p className="text-xs text-slate-500 mt-0.5">Tracked items are prioritized in briefings</p>
            </div>
          </div>

          <div className="space-y-3">
            {preferences.watchlist.length > 0 ? (
              <div className="space-y-2">
                {preferences.watchlist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      {getWatchlistIcon(item.type)}
                      <div>
                        <span className="text-sm font-medium text-slate-700">{item.value}</span>
                        <span className="ml-2 text-[10px] text-slate-400 uppercase">{item.type}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeWatchlistItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-6 text-center bg-slate-50 rounded-lg border border-slate-200">
                No items in your watchlist
              </p>
            )}

            {showAddWatchlist ? (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <select
                    value={newWatchlistItem.type}
                    onChange={(e) => setNewWatchlistItem({ ...newWatchlistItem, type: e.target.value as WatchlistItem['type'] })}
                    className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="vendor">Vendor</option>
                    <option value="technique">Technique</option>
                    <option value="actor">Threat Actor</option>
                    <option value="category">Category</option>
                    <option value="cve">CVE</option>
                  </select>
                  <input
                    type="text"
                    value={newWatchlistItem.value}
                    onChange={(e) => setNewWatchlistItem({ ...newWatchlistItem, value: e.target.value })}
                    placeholder="Enter value..."
                    className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && addWatchlistItem()}
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={addWatchlistItem} className="px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg hover:bg-slate-800">
                    Add Item
                  </button>
                  <button onClick={() => setShowAddWatchlist(false)} className="px-3 py-1.5 text-slate-600 text-xs rounded-lg hover:bg-slate-100">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddWatchlist(true)}
                className="w-full py-3 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Plus size={16} />
                Add to Watchlist
              </button>
            )}
          </div>
        </div>

        {/* Preferred Categories */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-100">
              <Tag size={18} className="text-purple-600" />
            </div>
            <div>
              <h2 className="font-medium text-slate-900">Preferred Categories</h2>
              <p className="text-xs text-slate-500 mt-0.5">Prioritize these in your feed</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {['ransomware', 'phishing', 'exploitation', 'credential_theft', 'lateral_movement', 'c2', 'persistence', 'data_exfiltration', 'initial_access', 'defense_evasion'].map((cat) => {
              const isSelected = preferences.preferredCategories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => {
                    if (isSelected) {
                      updatePreference('preferredCategories', preferences.preferredCategories.filter(c => c !== cat));
                    } else {
                      updatePreference('preferredCategories', [...preferences.preferredCategories, cat]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                    isSelected
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat.replace(/_/g, ' ')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-100">
              <Database size={18} className="text-red-600" />
            </div>
            <div>
              <h2 className="font-medium text-slate-900">Data Management</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage your intelligence data</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <Download size={18} className="text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Export Data</p>
                  <p className="text-[10px] text-slate-500">Download all intel as JSON</p>
                </div>
              </div>
              <button className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-100">Export</button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <Upload size={18} className="text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Import Data</p>
                  <p className="text-[10px] text-slate-500">Load intel from JSON file</p>
                </div>
              </div>
              <label className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-100 cursor-pointer">
                Import
                <input type="file" accept=".json" className="hidden" />
              </label>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
              confirmClear
                ? 'bg-red-50 border-red-300'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <Trash2 size={18} className={confirmClear ? 'text-red-500' : 'text-slate-400'} />
                <div>
                  <p className={`text-sm font-medium ${confirmClear ? 'text-red-600' : 'text-slate-700'}`}>
                    {confirmClear ? 'Click again to confirm' : 'Clear All Data'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {confirmClear ? 'This cannot be undone' : 'Remove all stored intel'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClear}
                className={`px-3 py-1.5 text-xs rounded-lg ${
                  confirmClear
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {confirmClear ? 'Confirm' : 'Clear'}
              </button>
            </div>
          </div>
        </div>

        {/* Intel Sources */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-100">
              <Globe size={18} className="text-green-600" />
            </div>
            <div>
              <h2 className="font-medium text-slate-900">Intel Sources</h2>
              <p className="text-xs text-slate-500 mt-0.5">Connected threat feeds</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'BleepingComputer', status: 'active' },
              { name: 'The Hacker News', status: 'active' },
              { name: 'GBHackers', status: 'active' },
              { name: 'Krebs on Security', status: 'active' },
              { name: 'Security Affairs', status: 'active' },
              { name: 'CISA Alerts', status: 'active' },
            ].map((source) => (
              <div
                key={source.name}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200"
              >
                <span className="text-xs font-medium text-slate-600">{source.name}</span>
                <span className="flex items-center gap-1.5 text-[10px] text-green-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <Zap size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-medium text-slate-900">About IntelMesh</h2>
              <p className="text-xs text-slate-500 mt-0.5">Version & system info</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500">Version</span>
              <span className="text-xs font-medium text-blue-600">2.1.0</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500">Framework</span>
              <span className="text-xs text-slate-600">Next.js 14</span>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500 text-center">
            Personal threat intelligence platform for security professionals
          </p>
        </div>
      </div>
    </div>
  );
}
