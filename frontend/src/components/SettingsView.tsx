'use client';

import { useState } from 'react';
import {
  Settings,
  User,
  Bell,
  Eye,
  Palette,
  Database,
  Trash2,
  Plus,
  X,
  Check,
  ChevronRight,
  Shield,
  Skull,
  Target,
  Tag,
  Building
} from 'lucide-react';
import { UserPreferences, WatchlistItem, BriefingMode } from '@/types';

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
        return <Target size={14} className="text-teal-500" />;
      case 'actor':
        return <Skull size={14} className="text-violet-500" />;
      case 'category':
        return <Tag size={14} className="text-amber-500" />;
      case 'cve':
        return <Shield size={14} className="text-red-500" />;
      default:
        return <Tag size={14} className="text-ink-400" />;
    }
  };

  const Section = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl border border-ink-100 shadow-soft overflow-hidden">
      <div className="px-6 py-4 border-b border-ink-100 bg-gradient-to-r from-paper-50 to-white">
        <h3 className="font-display font-semibold text-ink-900">{title}</h3>
        {description && <p className="text-sm text-ink-500 mt-1">{description}</p>}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink-900 tracking-tight">
          Settings
        </h1>
        <p className="text-ink-500 mt-1">
          Customize your threat intelligence experience
        </p>
      </div>

      {/* Briefing Preferences */}
      <Section title="Briefing Preferences" description="Configure how your briefings are generated">
        <div className="space-y-6">
          {/* Briefing Mode */}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-3">Default Briefing Mode</label>
            <div className="grid grid-cols-3 gap-3">
              {(['executive', 'analyst', 'engineer'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updatePreference('briefingMode', mode)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    preferences.briefingMode === mode
                      ? 'border-accent-coral bg-accent-coral/5'
                      : 'border-ink-100 hover:border-ink-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-ink-900 capitalize">{mode}</span>
                    {preferences.briefingMode === mode && (
                      <Check size={16} className="text-accent-coral" />
                    )}
                  </div>
                  <p className="text-xs text-ink-500">
                    {mode === 'executive' && 'High-level impact summaries'}
                    {mode === 'analyst' && 'Investigation angles & evidence'}
                    {mode === 'engineer' && 'Mitigation & detection focus'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Briefing Length */}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-3">Briefing Length</label>
            <div className="flex items-center gap-3">
              {([5, 10, 15] as const).map((length) => (
                <button
                  key={length}
                  onClick={() => updatePreference('briefingLength', length)}
                  className={`px-5 py-2.5 rounded-xl border-2 transition-all duration-200 ${
                    preferences.briefingLength === length
                      ? 'border-accent-coral bg-accent-coral/5 text-accent-coral font-medium'
                      : 'border-ink-100 text-ink-600 hover:border-ink-200'
                  }`}
                >
                  {length} bullets
                </button>
              ))}
            </div>
          </div>

          {/* Trend Window */}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-3">Default Trend Window</label>
            <div className="flex items-center gap-3">
              {(['7d', '30d', '90d'] as const).map((window) => (
                <button
                  key={window}
                  onClick={() => updatePreference('trendWindow', window)}
                  className={`px-5 py-2.5 rounded-xl border-2 transition-all duration-200 ${
                    preferences.trendWindow === window
                      ? 'border-accent-coral bg-accent-coral/5 text-accent-coral font-medium'
                      : 'border-ink-100 text-ink-600 hover:border-ink-200'
                  }`}
                >
                  {window === '7d' ? '7 Days' : window === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Watchlist */}
      <Section title="Watchlist" description="Items you're tracking will be prioritized in briefings">
        <div className="space-y-4">
          {/* Current watchlist items */}
          {preferences.watchlist.length > 0 ? (
            <div className="space-y-2">
              {preferences.watchlist.map((item, index) => (
                <div
                  key={item.id}
                  className="watchlist-item animate-fadeInUp"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="flex items-center gap-3">
                    {getWatchlistIcon(item.type)}
                    <div>
                      <span className="font-medium text-ink-800">{item.value}</span>
                      <span className="ml-2 text-xs text-ink-400 capitalize">{item.type}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeWatchlistItem(item.id)}
                    className="p-1.5 text-ink-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-500 py-4 text-center bg-paper-50 rounded-xl">
              No items in your watchlist yet
            </p>
          )}

          {/* Add new item */}
          {showAddWatchlist ? (
            <div className="p-4 bg-paper-50 rounded-xl border border-ink-100 space-y-3 animate-slideDown">
              <div className="flex items-center gap-3">
                <select
                  value={newWatchlistItem.type}
                  onChange={(e) => setNewWatchlistItem({ ...newWatchlistItem, type: e.target.value as WatchlistItem['type'] })}
                  className="px-3 py-2 text-sm bg-white border border-ink-200 rounded-lg focus:outline-none focus:border-accent-coral"
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
                  className="flex-1 px-3 py-2 text-sm bg-white border border-ink-200 rounded-lg focus:outline-none focus:border-accent-coral"
                  onKeyDown={(e) => e.key === 'Enter' && addWatchlistItem()}
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={addWatchlistItem}
                  className="px-4 py-2 text-sm font-medium bg-ink-900 text-white rounded-lg hover:bg-ink-800"
                >
                  Add to Watchlist
                </button>
                <button
                  onClick={() => setShowAddWatchlist(false)}
                  className="px-4 py-2 text-sm font-medium text-ink-600 hover:text-ink-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddWatchlist(true)}
              className="w-full py-3 border-2 border-dashed border-ink-200 rounded-xl text-ink-500 hover:border-accent-coral hover:text-accent-coral transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add to Watchlist
            </button>
          )}
        </div>
      </Section>

      {/* Preferred Categories */}
      <Section title="Preferred Categories" description="Select categories to prioritize in your feed">
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
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 capitalize ${
                  isSelected
                    ? 'bg-accent-coral text-white'
                    : 'bg-paper-100 text-ink-600 hover:bg-paper-200'
                }`}
              >
                {cat.replace(/_/g, ' ')}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Data Management */}
      <Section title="Data Management" description="Manage your local data">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
            <div>
              <h4 className="font-medium text-red-900">Clear All Data</h4>
              <p className="text-sm text-red-700 mt-1">
                This will remove all synced articles and extracted entities
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
                  onClearData();
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} />
              Clear Data
            </button>
          </div>
        </div>
      </Section>

      {/* About */}
      <div className="bg-paper-50 rounded-2xl border border-ink-100 p-6 text-center">
        <h3 className="font-display font-semibold text-ink-900 mb-2">Cyber Threat Radar</h3>
        <p className="text-sm text-ink-500 mb-4">
          Personal threat intelligence briefings, trends, and learning platform
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-ink-400">
          <span>Version 2.0.0</span>
          <span>•</span>
          <span>Built for security professionals</span>
        </div>
      </div>
    </div>
  );
}
