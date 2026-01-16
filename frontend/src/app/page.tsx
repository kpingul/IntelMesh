'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import SearchBar from '@/components/SearchBar';
import StatsCards from '@/components/StatsCards';
import ItemsList from '@/components/ItemsList';
import DetailPanel from '@/components/DetailPanel';
import CVEsView from '@/components/CVEsView';
import IoCsView from '@/components/IoCsView';
import ThreatsView from '@/components/ThreatsView';
import OverviewCharts from '@/components/OverviewCharts';
import {
  Stats, ThreatItem, CVEEntry, IoCs, ThreatEntry, SearchResult, ViewType
} from '@/types';
import * as api from '@/lib/api';
import { AlertCircle, Shield, Skull } from 'lucide-react';

export default function Dashboard() {
  // View state
  const [currentView, setCurrentView] = useState<ViewType>('overview');
  const [timeRange, setTimeRange] = useState('all');

  // Data state
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<ThreatItem[]>([]);
  const [cves, setCves] = useState<CVEEntry[]>([]);
  const [iocs, setIocs] = useState<IoCs | null>(null);
  const [threats, setThreats] = useState<ThreatEntry[]>([]);

  // UI state
  const [selectedItem, setSelectedItem] = useState<ThreatItem | null>(null);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
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
    if (!confirm('Are you sure you want to clear all data?')) return;
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
  const handleSearch = async (query: string): Promise<SearchResult | null> => {
    try {
      setIsSearching(true);
      setError(null);
      const result = await api.search(query);
      setSearchResult(result);
      setItems(result.results);
      return result;
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  // Clear search handler
  const handleClearSearch = async () => {
    setSearchResult(null);
    const itemsRes = await api.getItems(undefined, 100);
    setItems(itemsRes.items);
  };

  // Item click handler
  const handleItemClick = async (item: ThreatItem) => {
    try {
      // Fetch full item details (includes evidence snippets)
      const fullItem = await api.getItem(item.id);
      setSelectedItem(fullItem);
    } catch {
      setSelectedItem(item);
    }
  };

  // Item click by ID (for views)
  const handleItemClickById = async (itemId: string) => {
    try {
      const fullItem = await api.getItem(itemId);
      setSelectedItem(fullItem);
    } catch (err) {
      console.error('Failed to fetch item:', err);
    }
  };

  // Render main content based on current view
  const renderMainContent = () => {
    switch (currentView) {
      case 'cves':
        return (
          <CVEsView
            cves={cves}
            isLoading={isLoading}
            onItemClick={handleItemClickById}
          />
        );
      case 'iocs':
        return (
          <IoCsView
            iocs={iocs}
            isLoading={isLoading}
            onItemClick={handleItemClickById}
          />
        );
      case 'threats':
        return (
          <ThreatsView
            threats={threats}
            isLoading={isLoading}
            onItemClick={handleItemClickById}
          />
        );
      case 'items':
        return (
          <ItemsList
            items={searchResult ? searchResult.results : items}
            onItemClick={handleItemClick}
            selectedItemId={selectedItem?.id}
            isLoading={isLoading}
            title={searchResult ? `Search Results (${searchResult.result_count})` : 'All Items'}
          />
        );
      case 'overview':
      default:
        return (
          <>
            <StatsCards stats={stats} isLoading={isLoading} />
            <OverviewCharts stats={stats} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ItemsList
                items={(searchResult ? searchResult.results : items).slice(0, 10)}
                onItemClick={handleItemClick}
                selectedItemId={selectedItem?.id}
                isLoading={isLoading}
                title="Recent Items"
              />
              <div className="space-y-6">
                {/* Top CVEs Mini List */}
                {stats && stats.top_cves.length > 0 && (
                  <div className="rounded-2xl p-6 bg-dark-700/30 border border-dark-600/30 hover:border-accent-red/20 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="p-1.5 rounded-lg bg-accent-red/15">
                        <Shield size={14} className="text-accent-red" />
                      </div>
                      <h3 className="text-base font-display font-semibold text-white">Top CVEs</h3>
                    </div>
                    <div className="space-y-3">
                      {stats.top_cves.slice(0, 5).map(([cve, count], i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-2.5 border-b border-dark-600/30 last:border-0"
                        >
                          <code className="text-accent-red font-mono text-sm font-medium">{cve}</code>
                          <span className="text-dark-200 text-sm font-mono">
                            {count} mention{count > 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Threats Mini List */}
                {stats && stats.top_threats.length > 0 && (
                  <div className="rounded-2xl p-6 bg-dark-700/30 border border-dark-600/30 hover:border-accent-violet/20 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="p-1.5 rounded-lg bg-accent-violet/15">
                        <Skull size={14} className="text-accent-violet" />
                      </div>
                      <h3 className="text-base font-display font-semibold text-white">Top Threats</h3>
                    </div>
                    <div className="space-y-3">
                      {stats.top_threats.slice(0, 5).map(([threat, count], i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-2.5 border-b border-dark-600/30 last:border-0"
                        >
                          <span className="text-accent-violet font-medium text-sm">{threat}</span>
                          <span className="text-dark-200 text-sm font-mono">
                            {count} mention{count > 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="flex h-screen bg-void relative overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        stats={stats ? {
          total_cves: stats.total_cves,
          total_iocs: stats.total_iocs,
          total_threats: stats.total_threats,
          total_items: stats.total_items,
        } : undefined}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Bar */}
        <TopBar
          onSync={handleSync}
          onUpload={handleUpload}
          onClear={handleClear}
          isSyncing={isSyncing}
          isUploading={isUploading}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Panel */}
          <main className="flex-1 overflow-y-auto p-8">
            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-accent-red/10 border border-accent-red/30 flex items-center gap-3 animate-fadeInUp">
                <AlertCircle size={20} className="text-accent-red flex-shrink-0" />
                <p className="text-accent-red text-sm">{error}</p>
              </div>
            )}

            {/* Search Bar */}
            <SearchBar
              onSearch={handleSearch}
              onClearSearch={handleClearSearch}
              searchResult={searchResult}
              isSearching={isSearching}
            />

            {/* Main Content */}
            {renderMainContent()}
          </main>

          {/* Detail Panel */}
          {selectedItem && (
            <DetailPanel
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
