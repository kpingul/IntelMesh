'use client';

import { useState } from 'react';
import {
  X, ExternalLink, Clock, Shield, Target, Skull, Tag,
  Copy, CheckCircle, FileText, Globe, Hash, Link2, AlertTriangle,
  ChevronDown, ChevronRight, BookOpen, Plus, Eye, Bookmark
} from 'lucide-react';
import { ThreatItem, Evidence } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';

interface ThreadDetailPanelProps {
  item: ThreatItem | null;
  onClose: () => void;
  onAddToLearning?: (item: ThreatItem) => void;
}

export default function ThreadDetailPanel({ item, onClose, onAddToLearning }: ThreadDetailPanelProps) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'cves', 'threats']));

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

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'PPpp');
    } catch {
      return dateStr;
    }
  };

  const CopyButton = ({ value }: { value: string }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        copyToClipboard(value);
      }}
      className="p-1.5 text-ink-400 hover:text-accent-coral hover:bg-accent-coral/10 rounded-lg transition-all duration-200"
      title="Copy to clipboard"
    >
      {copiedValue === value ? (
        <CheckCircle size={14} className="text-emerald-500" />
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
    defaultExpanded = true
  }: {
    id: string;
    title: string;
    icon: React.ReactNode;
    iconColor: string;
    count?: number;
    children: React.ReactNode;
    defaultExpanded?: boolean;
  }) => {
    const isExpanded = expandedSections.has(id);

    return (
      <div className="border-b border-ink-100 last:border-0">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between py-4 hover:bg-paper-50 transition-colors px-1"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${iconColor}`}>
              {icon}
            </div>
            <h3 className="font-semibold text-ink-900 text-sm">
              {title}
            </h3>
            {count !== undefined && (
              <span className="text-xs font-mono text-ink-500 bg-paper-200 px-2 py-0.5 rounded-lg">
                {count}
              </span>
            )}
          </div>
          {isExpanded ? <ChevronDown size={18} className="text-ink-400" /> : <ChevronRight size={18} className="text-ink-400" />}
        </button>
        {isExpanded && (
          <div className="pb-4 animate-slideDown">
            {children}
          </div>
        )}
      </div>
    );
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      bleepingcomputer: 'bg-blue-100 text-blue-700',
      gbhackers: 'bg-emerald-100 text-emerald-700',
      thehackernews: 'bg-orange-100 text-orange-700',
      krebsonsecurity: 'bg-purple-100 text-purple-700',
      securityaffairs: 'bg-rose-100 text-rose-700',
      cisa: 'bg-red-100 text-red-700',
      pdf: 'bg-ink-100 text-ink-700',
    };
    return colors[source] || 'bg-ink-100 text-ink-600';
  };

  return (
    <div className="w-[520px] bg-white border-l border-ink-100 h-full overflow-y-auto animate-slideIn relative flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-ink-100 p-5 z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Source & Date */}
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg capitalize ${getSourceColor(item.source)}`}>
                {item.source}
              </span>
              <span className="text-xs text-ink-400 flex items-center gap-1">
                <Clock size={12} />
                {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
              </span>
            </div>

            <h2 className="font-display font-semibold text-ink-900 text-xl leading-tight">
              {item.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-ink-400 hover:text-ink-600 hover:bg-paper-100 rounded-xl transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4">
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary text-sm"
            >
              <ExternalLink size={14} />
              View Source
            </a>
          )}
          {onAddToLearning && (
            <button
              onClick={() => onAddToLearning(item)}
              className="btn btn-ghost text-sm"
            >
              <Plus size={14} />
              Add to Learning
            </button>
          )}
          <button className="btn btn-ghost text-sm">
            <Bookmark size={14} />
            Save
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5">
        {/* Summary */}
        {item.description && (
          <Section
            id="summary"
            title="Summary"
            icon={<FileText size={16} />}
            iconColor="bg-paper-200 text-ink-600"
          >
            <p className="text-ink-700 leading-relaxed text-sm bg-paper-50 rounded-xl p-4 border border-ink-100">
              {item.description}
            </p>
          </Section>
        )}

        {/* CVEs */}
        {item.extracted.cves.length > 0 && (
          <Section
            id="cves"
            title="CVEs"
            icon={<Shield size={16} />}
            iconColor="bg-red-50 text-red-600"
            count={item.extracted.cves.length}
          >
            <div className="space-y-2">
              {item.extracted.cves.map((cve, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-paper-50 hover:bg-paper-100 rounded-xl px-4 py-3 border border-ink-100 transition-colors duration-200 group"
                >
                  <code className="text-red-600 font-mono text-sm font-medium">{cve}</code>
                  <div className="flex items-center gap-1">
                    <CopyButton value={cve} />
                    <a
                      href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-ink-400 hover:text-accent-ocean hover:bg-accent-ocean/10 rounded-lg transition-all duration-200"
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
            icon={<Target size={16} />}
            iconColor="bg-amber-50 text-amber-600"
          >
            <div className="space-y-5">
              {/* IPs */}
              {item.extracted.ips.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Globe size={14} className="text-ink-400" />
                    <span className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                      IP Addresses ({item.extracted.ips.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {item.extracted.ips.slice(0, 8).map((ip, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-paper-50 rounded-lg px-3 py-2 border border-ink-100"
                      >
                        <code className="text-amber-600 font-mono text-sm">{ip}</code>
                        <CopyButton value={ip} />
                      </div>
                    ))}
                    {item.extracted.ips.length > 8 && (
                      <p className="text-xs text-ink-400 mt-2 pl-1">
                        +{item.extracted.ips.length - 8} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Domains */}
              {item.extracted.domains.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 size={14} className="text-ink-400" />
                    <span className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                      Domains ({item.extracted.domains.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {item.extracted.domains.slice(0, 8).map((domain, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-paper-50 rounded-lg px-3 py-2 border border-ink-100"
                      >
                        <code className="text-accent-ocean font-mono text-sm truncate">{domain}</code>
                        <CopyButton value={domain} />
                      </div>
                    ))}
                    {item.extracted.domains.length > 8 && (
                      <p className="text-xs text-ink-400 mt-2 pl-1">
                        +{item.extracted.domains.length - 8} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Hashes */}
              {item.extracted.hashes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Hash size={14} className="text-ink-400" />
                    <span className="text-xs font-semibold text-ink-500 uppercase tracking-wide">
                      File Hashes ({item.extracted.hashes.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {item.extracted.hashes.slice(0, 5).map((hash, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-paper-50 rounded-lg px-3 py-2 border border-ink-100"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-ink-400 uppercase font-mono">{hash.type}</span>
                          <code className="block text-emerald-600 font-mono text-xs truncate mt-0.5">
                            {hash.value}
                          </code>
                        </div>
                        <CopyButton value={hash.value} />
                      </div>
                    ))}
                    {item.extracted.hashes.length > 5 && (
                      <p className="text-xs text-ink-400 mt-2 pl-1">
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
            title="Threats"
            icon={<Skull size={16} />}
            iconColor="bg-violet-50 text-violet-600"
            count={item.extracted.threats.length}
          >
            <div className="flex flex-wrap gap-2">
              {item.extracted.malware.map((m, i) => (
                <span
                  key={`m-${i}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-medium"
                >
                  <AlertTriangle size={12} />
                  {m}
                </span>
              ))}
              {item.extracted.actors.map((a, i) => (
                <span
                  key={`a-${i}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 text-sm font-medium"
                >
                  <Skull size={12} />
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
            icon={<Tag size={16} />}
            iconColor="bg-teal-50 text-teal-600"
          >
            <div className="flex flex-wrap gap-2">
              {item.extracted.tags.map((tag, i) => (
                <span key={i} className="tag tag-ttp capitalize">
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
            icon={<Eye size={16} />}
            iconColor="bg-paper-200 text-ink-600"
          >
            <div className="space-y-3">
              {item.evidence.map((ev, i) => (
                <div
                  key={i}
                  className="bg-paper-50 rounded-xl p-4 border border-ink-100"
                >
                  <span className={`tag mb-3 ${
                    ev.type === 'cve' ? 'tag-cve' :
                    ev.type === 'ioc' ? 'tag-ioc' : 'tag-threat'
                  }`}>
                    {ev.entity}
                  </span>
                  <p className="text-sm text-ink-600 italic leading-relaxed">
                    "{ev.snippet}"
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
