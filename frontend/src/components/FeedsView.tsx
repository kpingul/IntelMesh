'use client';

import { useState, useEffect } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  Globe,
  Hash,
  Link2,
  Shield,
  ExternalLink,
  Copy,
  Check,
  Filter
} from 'lucide-react';
import { FeedIOC, FeedCVE, FeedStats } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function FeedsView() {
  const [activeTab, setActiveTab] = useState<'iocs' | 'cves'>('iocs');
  const [iocs, setIocs] = useState<FeedIOC[]>([]);
  const [cves, setCves] = useState<FeedCVE[]>([]);
  const [stats, setStats] = useState<FeedStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [iocFilter, setIocFilter] = useState<string>('all');
  const [ransomwareOnly, setRansomwareOnly] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, iocsRes, cvesRes] = await Promise.all([
        fetch(`${API_URL}/api/feeds/stats`).then(r => r.json()),
        fetch(`${API_URL}/api/feeds/iocs?limit=200`).then(r => r.json()),
        fetch(`${API_URL}/api/feeds/cves?limit=200`).then(r => r.json()),
      ]);
      setStats(statsRes);
      setIocs(iocsRes.iocs || []);
      setCves(cvesRes.cves || []);
    } catch (err) {
      console.error('Failed to fetch feeds:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const syncFeeds = async () => {
    setIsSyncing(true);
    try {
      await fetch(`${API_URL}/api/feeds/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit_per_feed: 200 }),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to sync feeds:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredIocs = iocs.filter(ioc =>
    iocFilter === 'all' || ioc.ioc_type === iocFilter
  );

  const filteredCves = cves.filter(cve =>
    !ransomwareOnly || cve.known_ransomware
  );

  const getIocIcon = (type: string) => {
    switch (type) {
      case 'ip': return <Globe size={14} className="text-blue-500" />;
      case 'hash': return <Hash size={14} className="text-slate-500" />;
      case 'url': return <Link2 size={14} className="text-amber-500" />;
      case 'domain': return <Globe size={14} className="text-green-500" />;
      default: return <Shield size={14} className="text-slate-400" />;
    }
  };

  return (
    <div className="h-full overflow-auto p-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Threat Feeds</h1>
            <p className="text-sm text-slate-500 mt-1">
              Open source threat intelligence from multiple sources
            </p>
          </div>
          <button
            onClick={syncFeeds}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync All Feeds'}
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-2xl font-semibold text-slate-900">{stats.total_feed_iocs}</div>
              <div className="text-sm text-slate-500">Total IOCs</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-2xl font-semibold text-red-600">{stats.total_feed_cves}</div>
              <div className="text-sm text-slate-500">CISA KEV CVEs</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-2xl font-semibold text-amber-600">{stats.ransomware_cves}</div>
              <div className="text-sm text-slate-500">Ransomware CVEs</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-2xl font-semibold text-slate-600">
                {Object.keys(stats.malware_families || {}).length}
              </div>
              <div className="text-sm text-slate-500">Malware Families</div>
            </div>
          </div>
        )}

        {/* Top Malware */}
        {stats && stats.top_malware && stats.top_malware.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Top Malware Families</h3>
            <div className="flex flex-wrap gap-2">
              {stats.top_malware.slice(0, 12).map(([name, count]) => (
                <span key={name} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded flex items-center gap-1.5">
                  {name}
                  <span className="text-slate-400">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-4 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('iocs')}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'iocs'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            IOCs ({filteredIocs.length})
          </button>
          <button
            onClick={() => setActiveTab('cves')}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'cves'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            CVEs ({filteredCves.length})
          </button>

          {/* Filters */}
          <div className="ml-auto flex items-center gap-3">
            {activeTab === 'iocs' && (
              <select
                value={iocFilter}
                onChange={(e) => setIocFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded px-2 py-1 bg-white"
              >
                <option value="all">All Types</option>
                <option value="ip">IPs</option>
                <option value="url">URLs</option>
                <option value="hash">Hashes</option>
                <option value="domain">Domains</option>
              </select>
            )}
            {activeTab === 'cves' && (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={ransomwareOnly}
                  onChange={(e) => setRansomwareOnly(e.target.checked)}
                  className="rounded"
                />
                Ransomware only
              </label>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading feeds...</div>
        ) : activeTab === 'iocs' ? (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Value</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Threat</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Malware</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Source</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIocs.slice(0, 100).map((ioc) => (
                  <tr key={ioc.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4">
                      <span className="flex items-center gap-1.5">
                        {getIocIcon(ioc.ioc_type)}
                        <span className="text-slate-600 uppercase text-xs">{ioc.ioc_type}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-800 max-w-xs truncate">
                      {ioc.ioc_value}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                        {ioc.threat_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {ioc.malware_family || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 text-xs">
                      {ioc.source}
                    </td>
                    <td className="py-2.5 px-4">
                      <button
                        onClick={() => copyToClipboard(ioc.ioc_value, ioc.id)}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        {copiedId === ioc.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredIocs.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                No IOCs found. Click "Sync All Feeds" to fetch data.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">CVE</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Vulnerability</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Vendor</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Ransomware</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCves.slice(0, 100).map((cve) => (
                  <tr key={cve.cve_id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4">
                      <a
                        href={`https://nvd.nist.gov/vuln/detail/${cve.cve_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {cve.cve_id}
                        <ExternalLink size={10} />
                      </a>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 max-w-sm">
                      <div className="truncate" title={cve.vulnerability_name}>
                        {cve.vulnerability_name}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{cve.vendor}</td>
                    <td className="py-2.5 px-4 text-slate-600">{cve.product}</td>
                    <td className="py-2.5 px-4">
                      {cve.known_ransomware ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded flex items-center gap-1 w-fit">
                          <AlertTriangle size={10} />
                          Yes
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 text-xs">
                      {cve.due_date || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCves.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                No CVEs found. Click "Sync All Feeds" to fetch data.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
