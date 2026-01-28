'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import TodayView from '@/components/TodayView';
import BriefingsView from '@/components/BriefingsView';
import TrendsView from '@/components/TrendsView';
import ThreadsView from '@/components/ThreadsView';
import FeedsView from '@/components/FeedsView';
import SettingsView from '@/components/SettingsView';
import ThreadDetailPanel from '@/components/ThreadDetailPanel';
import {
  Stats, ThreatItem, CVEEntry, IoCs, ThreatEntry, SearchResult, ViewType
} from '@/types';
import * as api from '@/lib/api';
import { AlertTriangle, Search, X } from 'lucide-react';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<ViewType>('today');
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<ThreatItem[]>([]);
  const [cves, setCves] = useState<CVEEntry[]>([]);
  const [iocs, setIocs] = useState<IoCs | null>(null);
  const [threats, setThreats] = useState<ThreatEntry[]>([]);
  const [selectedItem, setSelectedItem] = useState<ThreatItem | null>(null);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsRes, itemsRes, cvesRes, iocsRes, threatsRes] = await Promise.all([
        api.getStats(),
        api.getItems(undefined, 100),
        api.getCVEs(),
        api.getIoCs(),
        api.getThreats(),
      ]);

      setStats(statsRes);
      setItems(itemsRes.items);
      setCves(cvesRes.cves);
      setIocs(iocsRes);
      setThreats(threatsRes.threats);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to connect to backend. Make sure the API server is running.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSelectedItem(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setError(null);
      await api.syncNews();
      await fetchData();
    } catch (err) {
      console.error('Sync failed:', err);
      setError('Failed to sync news. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpload = async (files: File[]) => {
    try {
      setIsUploading(true);
      setError(null);
      await api.uploadPDFs(files);
      await fetchData();
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload PDFs. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = async () => {
    try {
      await api.clearData();
      await fetchData();
      setSelectedItem(null);
      setSearchResult(null);
    } catch (err) {
      console.error('Clear failed:', err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setError(null);
      const result = await api.search(searchQuery);
      setSearchResult(result);
      setItems(result.results);
      setCurrentView('threads');
      setShowSearch(false);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = async () => {
    setSearchResult(null);
    setSearchQuery('');
    const itemsRes = await api.getItems(undefined, 100);
    setItems(itemsRes.items);
  };

  const handleItemClick = async (item: ThreatItem) => {
    try {
      const fullItem = await api.getItem(item.id);
      setSelectedItem(fullItem);
    } catch {
      setSelectedItem(item);
    }
  };

  const handleAddToLearning = (item: ThreatItem) => {
    console.log('Adding to learning queue:', item.id);
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'today':
        return (
          <TodayView
            stats={stats}
            items={searchResult ? searchResult.results : items}
            isLoading={isLoading}
            onItemClick={handleItemClick}
            onViewThreads={() => setCurrentView('threads')}
          />
        );
      case 'briefings':
        return (
          <BriefingsView
            stats={stats}
            items={searchResult ? searchResult.results : items}
            isLoading={isLoading}
            onItemClick={handleItemClick}
          />
        );
      case 'trends':
        return (
          <TrendsView
            stats={stats}
            items={searchResult ? searchResult.results : items}
            isLoading={isLoading}
          />
        );
      case 'threads':
        return (
          <ThreadsView
            items={searchResult ? searchResult.results : items}
            stats={stats}
            isLoading={isLoading}
            onItemClick={handleItemClick}
          />
        );
      case 'feeds':
        return <FeedsView />;
      case 'settings':
        return <SettingsView onClearData={handleClear} />;
      default:
        return (
          <TodayView
            stats={stats}
            items={searchResult ? searchResult.results : items}
            isLoading={isLoading}
            onItemClick={handleItemClick}
            onViewThreads={() => setCurrentView('threads')}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        stats={stats || undefined}
        onSync={handleSync}
        onUpload={handleUpload}
        isSyncing={isSyncing}
        isUploading={isUploading}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 text-sm rounded-lg hover:bg-slate-200 transition-colors max-w-md w-full"
            >
              <Search size={16} />
              <span>Search threats, CVEs, actors...</span>
              <span className="ml-auto text-xs text-slate-400 bg-white px-1.5 py-0.5 rounded">⌘K</span>
            </button>

            {searchResult && (
              <div className="flex items-center gap-3 ml-4">
                <span className="text-sm text-slate-500">
                  Found <span className="font-medium text-slate-700">{searchResult.result_count}</span> results
                </span>
                <button
                  onClick={handleClearSearch}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X size={14} />
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-hidden">
            {error && (
              <div className="mx-6 mt-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
                <AlertTriangle size={18} className="text-red-500" />
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto p-1 text-red-400 hover:text-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {renderMainContent()}
          </main>

          {selectedItem && (
            <ThreadDetailPanel
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onAddToLearning={handleAddToLearning}
            />
          )}
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowSearch(false)}
          />
          <div className="relative w-full max-w-xl mx-4">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search CVEs, threat actors, techniques..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-20 py-4 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none text-base border-b border-slate-200"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </form>

              <div className="p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Quick searches</p>
                <div className="flex flex-wrap gap-2">
                  {['CVE-2024', 'ransomware', 'APT', 'phishing', 'credential theft'].map((term) => (
                    <button
                      key={term}
                      onClick={() => setSearchQuery(term)}
                      className="px-3 py-1.5 bg-slate-100 text-slate-600 text-sm rounded hover:bg-slate-200 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
