'use client';

import { useState } from 'react';
import {
  X, ExternalLink, Clock, Shield, Target,
  Copy, CheckCircle, Globe, Hash, Link2, AlertTriangle,
  ChevronDown, ChevronRight, FileText, Eye, Bookmark,
  Share2, Zap
} from 'lucide-react';
import { ThreatItem } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';

interface ThreadDetailPanelProps {
  item: ThreatItem | null;
  onClose: () => void;
  onAddToLearning?: (item: ThreatItem) => void;
}

export default function ThreadDetailPanel({ item, onClose }: ThreadDetailPanelProps) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'cves', 'threats', 'iocs']));

  if (!item) return null;

  const copyToClipboard = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getSeverityScore = () => {
    let score = 0;
    score += item.extracted.cves.length * 3;
    score += item.extracted.actors.length * 2;
    score += item.extracted.malware.length * 2;
    if (item.extracted.tags.includes('ransomware')) score += 3;
    return score;
  };

  const getSeverityLevel = () => {
    const score = getSeverityScore();
    if (score >= 6) return { level: 'CRITICAL', color: 'text-red-700', bg: 'bg-red-100' };
    if (score >= 4) return { level: 'HIGH', color: 'text-orange-700', bg: 'bg-orange-100' };
    if (score >= 2) return { level: 'MEDIUM', color: 'text-amber-700', bg: 'bg-amber-100' };
    return { level: 'LOW', color: 'text-green-700', bg: 'bg-green-100' };
  };

  const severity = getSeverityLevel();

  const CopyButton = ({ value }: { value: string }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        copyToClipboard(value);
      }}
      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
      title="Copy to clipboard"
    >
      {copiedValue === value ? (
        <CheckCircle size={14} className="text-green-500" />
      ) : (
        <Copy size={14} />
      )}
    </button>
  );

  const Section = ({
    id,
    title,
    icon,
    iconColor,
    count,
    children,
  }: {
    id: string;
    title: string;
    icon: React.ReactNode;
    iconColor: string;
    count?: number;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSections.has(id);

    return (
      <div className="border-b border-slate-200 last:border-0">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between py-3 hover:bg-slate-50 transition-colors px-1"
        >
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg ${iconColor}`}>
              {icon}
            </div>
            <span className="font-medium text-slate-700 text-sm">{title}</span>
            {count !== undefined && (
              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {count}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronDown size={16} className="text-slate-400" />
          ) : (
            <ChevronRight size={16} className="text-slate-400" />
          )}
        </button>
        {isExpanded && (
          <div className="pb-4 animate-slide-up">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-[520px] bg-white border-l border-slate-200 h-full flex flex-col animate-slide-up">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-200 p-5 bg-slate-50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Meta row */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-medium px-2 py-1 rounded bg-slate-200 text-slate-600 capitalize">
                {item.source}
              </span>
              <span className={`text-[10px] font-medium px-2 py-1 rounded ${severity.bg} ${severity.color}`}>
                {severity.level}
              </span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock size={10} />
                {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
              </span>
            </div>

            <h2 className="font-semibold text-slate-900 text-lg leading-snug">
              {item.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4">
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg hover:bg-slate-800 flex items-center gap-1.5"
            >
              <ExternalLink size={14} />
              View Source
            </a>
          )}
          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <Bookmark size={14} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <Share2 size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Summary */}
        {item.description && (
          <Section
            id="summary"
            title="Summary"
            icon={<FileText size={14} />}
            iconColor="bg-slate-100"
          >
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-4 border border-slate-200">
              {item.description}
            </p>
          </Section>
        )}

        {/* CVEs */}
        {item.extracted.cves.length > 0 && (
          <Section
            id="cves"
            title="CVEs"
            icon={<Shield size={14} className="text-red-500" />}
            iconColor="bg-red-50"
            count={item.extracted.cves.length}
          >
            <div className="space-y-2">
              {item.extracted.cves.map((cve, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-200 hover:border-red-300 transition-colors group"
                >
                  <code className="text-sm text-red-600">{cve}</code>
                  <div className="flex items-center gap-1">
                    <CopyButton value={cve} />
                    <a
                      href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* IoCs */}
        {(item.extracted.ips.length > 0 || item.extracted.domains.length > 0 ||
          item.extracted.hashes.length > 0 || item.extracted.urls.length > 0) && (
          <Section
            id="iocs"
            title="Indicators of Compromise"
            icon={<Target size={14} className="text-amber-500" />}
            iconColor="bg-amber-50"
          >
            <div className="space-y-4">
              {/* IPs */}
              {item.extracted.ips.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Globe size={12} className="text-slate-400" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      IP Addresses ({item.extracted.ips.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {item.extracted.ips.slice(0, 8).map((ip, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-slate-200 group"
                      >
                        <code className="text-xs text-amber-600">{ip}</code>
                        <CopyButton value={ip} />
                      </div>
                    ))}
                    {item.extracted.ips.length > 8 && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        +{item.extracted.ips.length - 8} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Domains */}
              {item.extracted.domains.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 size={12} className="text-slate-400" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Domains ({item.extracted.domains.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {item.extracted.domains.slice(0, 8).map((domain, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-slate-200 group"
                      >
                        <code className="text-xs text-blue-600 truncate max-w-[300px]">{domain}</code>
                        <CopyButton value={domain} />
                      </div>
                    ))}
                    {item.extracted.domains.length > 8 && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        +{item.extracted.domains.length - 8} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Hashes */}
              {item.extracted.hashes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Hash size={12} className="text-slate-400" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      File Hashes ({item.extracted.hashes.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {item.extracted.hashes.slice(0, 5).map((hash, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-slate-200 group"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] text-slate-400 uppercase">{hash.type}</span>
                          <code className="block text-[10px] text-cyan-600 truncate mt-0.5">
                            {hash.value}
                          </code>
                        </div>
                        <CopyButton value={hash.value} />
                      </div>
                    ))}
                    {item.extracted.hashes.length > 5 && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        +{item.extracted.hashes.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Threats */}
        {item.extracted.threats.length > 0 && (
          <Section
            id="threats"
            title="Threat Intelligence"
            icon={<AlertTriangle size={14} className="text-slate-500" />}
            iconColor="bg-slate-50"
            count={item.extracted.threats.length}
          >
            <div className="flex flex-wrap gap-2">
              {item.extracted.malware.map((m, i) => (
                <span
                  key={`m-${i}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-medium"
                >
                  <AlertTriangle size={12} />
                  {m}
                </span>
              ))}
              {item.extracted.actors.map((a, i) => (
                <span
                  key={`a-${i}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 text-xs font-medium"
                >
                  {a}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* TTP Tags */}
        {item.extracted.tags.length > 0 && (
          <Section
            id="techniques"
            title="Techniques & Tactics"
            icon={<Zap size={14} className="text-blue-500" />}
            iconColor="bg-blue-50"
          >
            <div className="flex flex-wrap gap-2">
              {item.extracted.tags.map((tag, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded capitalize">
                  {tag.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Evidence Snippets */}
        {item.evidence && item.evidence.length > 0 && (
          <Section
            id="evidence"
            title="Evidence Snippets"
            icon={<Eye size={14} />}
            iconColor="bg-slate-100"
          >
            <div className="space-y-3">
              {item.evidence.map((ev, i) => (
                <div
                  key={i}
                  className="bg-slate-50 rounded-lg p-3 border border-slate-200"
                >
                  <span className={`text-[10px] px-1.5 py-0.5 rounded mb-2 inline-block ${
                    ev.type === 'cve' ? 'bg-red-100 text-red-600' :
                    ev.type === 'ioc' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {ev.entity}
                  </span>
                  <p className="text-xs text-slate-500 italic leading-relaxed">
                    "{ev.snippet}"
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>ID: {item.id.slice(0, 12)}...</span>
          <span>Added: {format(new Date(item.added_at), 'yyyy-MM-dd HH:mm')}</span>
        </div>
      </div>
    </div>
  );
}
