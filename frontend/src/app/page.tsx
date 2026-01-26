'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import TodayView from '@/components/TodayView';
import BriefingsView from '@/components/BriefingsView';
import TrendsView from '@/components/TrendsView';
import ThreadsView from '@/components/ThreadsView';
import PlaybooksView from '@/components/PlaybooksView';
import LearningView from '@/components/LearningView';
import SettingsView from '@/components/SettingsView';
import ThreadDetailPanel from '@/components/ThreadDetailPanel';
import {
  Stats, ThreatItem, CVEEntry, IoCs, ThreatEntry, SearchResult, ViewType
} from '@/types';
import * as api from '@/lib/api';
import { AlertCircle, Search, X } from 'lucide-react';

export default function Dashboard() {
  // View state
  const [currentView, setCurrentView] = useState<ViewType>('today');

  // Data state
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<ThreatItem[]>([]);
  const [cves, setCves] = useState<CVEEntry[]>([]);
  const [iocs, setIocs] = useState<IoCs | null>(null);
  const [threats, setThreats] = useState<ThreatEntry[]>([]);

  // UI state
  const [selectedItem, setSelectedItem] = useState<ThreatItem | null>(null);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
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

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync news handler
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

  // Upload PDFs handler
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

  // Clear data handler
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

  // Search handler
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
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Clear search handler
  const handleClearSearch = async () => {
    setSearchResult(null);
    setSearchQuery('');
    const itemsRes = await api.getItems(undefined, 100);
    setItems(itemsRes.items);
  };

  // Item click handler
  const handleItemClick = async (item: ThreatItem) => {
    try {
      const fullItem = await api.getItem(item.id);
      setSelectedItem(fullItem);
    } catch {
      setSelectedItem(item);
    }
  };

  // Add to learning queue
  const handleAddToLearning = (item: ThreatItem) => {
    // In a real app, this would be persisted
    console.log('Adding to learning queue:', item.id);
  };

  // Render main content based on current view
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
      case 'playbooks':
        return (
          <PlaybooksView
            items={searchResult ? searchResult.results : items}
            stats={stats}
            isLoading={isLoading}
            onItemClick={handleItemClick}
          />
        );
      case 'learning':
        return (
          <LearningView
            items={searchResult ? searchResult.results : items}
            isLoading={isLoading}
            onItemClick={handleItemClick}
          />
        );
      case 'settings':
        return (
          <SettingsView
            onClearData={handleClear}
          />
        );
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
    <div className="flex h-screen bg-paper-50 relative overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        stats={stats || undefined}
        onSync={handleSync}
        onUpload={handleUpload}
        isSyncing={isSyncing}
        isUploading={isUploading}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Search Bar */}
        <div className="bg-white border-b border-ink-100 px-8 py-4">
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                placeholder="Search threats by CVE, actor, technique, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input pl-11 pr-24"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-20 top-1/2 -translate-y-1/2 p-1.5 text-ink-400 hover:text-ink-600"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-ink-900 text-white text-sm font-medium rounded-lg hover:bg-ink-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Search result indicator */}
            {searchResult && (
              <div className="flex items-center gap-2 mt-2 text-sm text-ink-600">
                <span>Found <strong>{searchResult.result_count}</strong> results for "{searchResult.query}"</span>
                <button
                  onClick={handleClearSearch}
                  className="text-accent-coral hover:underline"
                >
                  Clear search
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Panel */}
          <main className="flex-1 overflow-y-auto p-8">
            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 animate-fadeInUp">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto p-1 text-red-400 hover:text-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Main Content */}
            {renderMainContent()}
          </main>

          {/* Detail Panel */}
          {selectedItem && (
            <ThreadDetailPanel
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onAddToLearning={handleAddToLearning}
            />
          )}
        </div>
      </div>
    </div>
  );
}
