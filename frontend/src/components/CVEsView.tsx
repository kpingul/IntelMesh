'use client';

import { Shield, ExternalLink, ChevronRight, AlertCircle } from 'lucide-react';
import { CVEEntry } from '@/types';

interface CVEsViewProps {
  cves: CVEEntry[];
  isLoading: boolean;
  onItemClick: (itemId: string) => void;
}

export default function CVEsView({ cves, isLoading, onItemClick }: CVEsViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="skeleton h-8 w-8 rounded-lg" />
          <div className="skeleton h-7 w-32" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl p-5 bg-dark-700/30 border border-dark-600/30">
            <div className="flex items-center justify-between">
              <div className="skeleton h-6 w-36" />
              <div className="skeleton h-6 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (cves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-5 rounded-2xl bg-accent-red/10 border border-accent-red/20 mb-5">
          <Shield size={48} className="text-accent-red" />
        </div>
        <h3 className="text-xl font-display font-semibold text-white">No CVEs Found</h3>
        <p className="text-dark-200 mt-2 max-w-sm">
          Sync news or upload PDFs containing CVE references to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent-red/15">
            <Shield size={22} className="text-accent-red" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">CVEs</h2>
            <p className="text-sm text-dark-200">{cves.length} vulnerabilities tracked</p>
          </div>
        </div>
      </div>

      {/* CVE Table */}
      <div className="rounded-2xl overflow-hidden border border-dark-600/30 bg-dark-800/30 backdrop-blur-sm">
        <table className="data-table">
          <thead>
            <tr>
              <th>CVE ID</th>
              <th>Mentions</th>
              <th>Sources</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cves.map((cve, i) => (
              <tr
                key={cve.id}
                className="animate-fadeInUp group"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <td>
                  <code className="text-accent-red font-mono font-semibold">{cve.id}</code>
                </td>
                <td>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-dark-600/50 text-sm font-medium text-dark-100">
                    <AlertCircle size={12} className="text-accent-red" />
                    {cve.count} {cve.count === 1 ? 'mention' : 'mentions'}
                  </span>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set(cve.sources)).map((source, j) => (
                      <span
                        key={j}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${
                          source === 'bleepingcomputer'
                            ? 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20'
                            : source === 'gbhackers'
                            ? 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20'
                            : 'bg-accent-violet/10 text-accent-violet border-accent-violet/20'
                        }`}
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <a
                      href={`https://nvd.nist.gov/vuln/detail/${cve.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-dark-200 hover:text-accent-cyan hover:bg-accent-cyan/10 rounded-lg transition-all duration-200"
                      title="View on NVD"
                    >
                      <ExternalLink size={16} />
                    </a>
                    {cve.items.length > 0 && (
                      <button
                        onClick={() => onItemClick(cve.items[0].id)}
                        className="p-2 text-dark-200 hover:text-white hover:bg-dark-600/50 rounded-lg transition-all duration-200"
                        title="View related item"
                      >
                        <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Related Articles Section */}
      <div className="mt-10">
        <h3 className="text-lg font-display font-semibold text-white mb-5 flex items-center gap-2">
          Related Articles
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {cves.slice(0, 4).map((cve) => (
            <div
              key={cve.id}
              className="rounded-2xl p-5 bg-dark-700/30 border border-dark-600/30 hover:border-accent-red/30 transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-4">
                <code className="text-accent-red font-mono font-semibold">{cve.id}</code>
                <span className="text-dark-300">appears in:</span>
              </div>
              <div className="space-y-2">
                {cve.items.slice(0, 3).map((item, i) => (
                  <button
                    key={i}
                    onClick={() => onItemClick(item.id)}
                    className="w-full text-left px-4 py-3 bg-dark-600/30 hover:bg-dark-600/50 rounded-xl transition-all duration-200 group"
                  >
                    <p className="text-sm text-dark-100 group-hover:text-white truncate transition-colors">
                      {item.title}
                    </p>
                    <p className="text-xs text-dark-300 capitalize mt-1">{item.source}</p>
                  </button>
                ))}
                {cve.items.length > 3 && (
                  <p className="text-xs text-dark-300 pl-4">+{cve.items.length - 3} more articles</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
