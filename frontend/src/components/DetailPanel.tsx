'use client';

import {
  X, ExternalLink, Clock, Shield, Target, Skull, Tag,
  Copy, CheckCircle, FileText, Globe, Hash, Link2, AlertTriangle
} from 'lucide-react';
import { ThreatItem, Evidence } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import { useState } from 'react';

interface DetailPanelProps {
  item: ThreatItem | null;
  onClose: () => void;
}

export default function DetailPanel({ item, onClose }: DetailPanelProps) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  if (!item) return null;

  const copyToClipboard = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    setTimeout(() => setCopiedValue(null), 2000);
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
      onClick={() => copyToClipboard(value)}
      className="p-1.5 text-dark-200 hover:text-accent-cyan hover:bg-accent-cyan/10 rounded-lg transition-all duration-200"
      title="Copy to clipboard"
    >
      {copiedValue === value ? (
        <CheckCircle size={14} className="text-accent-emerald" />
      ) : (
        <Copy size={14} />
      )}
    </button>
  );

  const Section = ({
    title,
    icon,
    iconColor,
    count,
    children
  }: {
    title: string;
    icon: React.ReactNode;
    iconColor: string;
    count?: number;
    children: React.ReactNode
  }) => (
    <div className="animate-fadeInUp">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-1.5 rounded-lg ${iconColor}`}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
          {title}
        </h3>
        {count !== undefined && (
          <span className="text-xs font-mono text-dark-200 px-2 py-0.5 rounded-lg bg-dark-600/50">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <div className="w-[480px] bg-dark-800/95 backdrop-blur-xl border-l border-dark-700/50 h-full overflow-y-auto animate-slideIn relative z-10">
      {/* Header */}
      <div className="sticky top-0 bg-dark-800/95 backdrop-blur-xl border-b border-dark-700/50 p-5 z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-semibold text-white text-lg leading-tight">
              {item.title}
            </h2>
            <div className="flex items-center gap-3 mt-3 text-sm text-dark-200">
              <span className="capitalize font-medium text-dark-100">{item.source}</span>
              <span className="w-1 h-1 rounded-full bg-dark-400" />
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                {formatDate(item.date)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-dark-200 hover:text-white hover:bg-dark-600/50 rounded-xl transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan/20 text-sm font-medium transition-all duration-200"
          >
            <ExternalLink size={14} />
            View Original Source
          </a>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-8">
        {/* Summary */}
        {item.description && (
          <Section
            title="Summary"
            icon={<FileText size={14} />}
            iconColor="bg-dark-600/50 text-dark-100"
          >
            <p className="text-sm text-dark-100 leading-relaxed bg-dark-700/30 rounded-xl p-4 border border-dark-600/30">
              {item.description}
            </p>
          </Section>
        )}

        {/* CVEs */}
        {item.extracted.cves.length > 0 && (
          <Section
            title="CVEs"
            icon={<Shield size={14} />}
            iconColor="bg-accent-red/15 text-accent-red"
            count={item.extracted.cves.length}
          >
            <div className="space-y-2">
              {item.extracted.cves.map((cve, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-dark-700/40 hover:bg-dark-700/60 rounded-xl px-4 py-3 border border-dark-600/30 transition-colors duration-200 group"
                >
                  <code className="text-accent-red font-mono text-sm font-medium">{cve}</code>
                  <div className="flex items-center gap-1">
                    <CopyButton value={cve} />
                    <a
                      href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-dark-200 hover:text-accent-cyan hover:bg-accent-cyan/10 rounded-lg transition-all duration-200"
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
            title="Indicators of Compromise"
            icon={<Target size={14} />}
            iconColor="bg-accent-amber/15 text-accent-amber"
          >
            <div className="space-y-5">
              {/* IPs */}
              {item.extracted.ips.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Globe size={13} className="text-dark-200" />
                    <span className="text-xs font-medium text-dark-200 uppercase tracking-wide">
                      IP Addresses ({item.extracted.ips.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {item.extracted.ips.slice(0, 10).map((ip, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-dark-700/40 rounded-lg px-3 py-2 border border-dark-600/30"
                      >
                        <code className="text-accent-amber font-mono text-sm">{ip}</code>
                        <CopyButton value={ip} />
                      </div>
                    ))}
                    {item.extracted.ips.length > 10 && (
                      <p className="text-xs text-dark-300 mt-2 pl-1">
                        +{item.extracted.ips.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Domains */}
              {item.extracted.domains.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 size={13} className="text-dark-200" />
                    <span className="text-xs font-medium text-dark-200 uppercase tracking-wide">
                      Domains ({item.extracted.domains.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {item.extracted.domains.slice(0, 10).map((domain, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-dark-700/40 rounded-lg px-3 py-2 border border-dark-600/30"
                      >
                        <code className="text-accent-cyan font-mono text-sm truncate">{domain}</code>
                        <CopyButton value={domain} />
                      </div>
                    ))}
                    {item.extracted.domains.length > 10 && (
                      <p className="text-xs text-dark-300 mt-2 pl-1">
                        +{item.extracted.domains.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Hashes */}
              {item.extracted.hashes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Hash size={13} className="text-dark-200" />
                    <span className="text-xs font-medium text-dark-200 uppercase tracking-wide">
                      File Hashes ({item.extracted.hashes.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {item.extracted.hashes.slice(0, 5).map((hash, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-dark-700/40 rounded-lg px-3 py-2 border border-dark-600/30"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-dark-300 uppercase font-mono">{hash.type}</span>
                          <code className="block text-accent-emerald font-mono text-xs truncate mt-0.5">
                            {hash.value}
                          </code>
                        </div>
                        <CopyButton value={hash.value} />
                      </div>
                    ))}
                    {item.extracted.hashes.length > 5 && (
                      <p className="text-xs text-dark-300 mt-2 pl-1">
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
            title="Threats"
            icon={<Skull size={14} />}
            iconColor="bg-accent-violet/15 text-accent-violet"
            count={item.extracted.threats.length}
          >
            <div className="flex flex-wrap gap-2">
              {item.extracted.malware.map((m, i) => (
                <span
                  key={`m-${i}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-red/10 text-accent-red border border-accent-red/20 text-sm font-medium"
                >
                  <AlertTriangle size={12} />
                  {m}
                </span>
              ))}
              {item.extracted.actors.map((a, i) => (
                <span
                  key={`a-${i}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-violet/10 text-accent-violet border border-accent-violet/20 text-sm font-medium"
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
            title="TTP Tags"
            icon={<Tag size={14} />}
            iconColor="bg-accent-cyan/15 text-accent-cyan"
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
            title="Evidence Snippets"
            icon={<FileText size={14} />}
            iconColor="bg-dark-600/50 text-dark-100"
          >
            <div className="space-y-3">
              {item.evidence.map((ev, i) => (
                <div
                  key={i}
                  className="bg-dark-700/40 rounded-xl p-4 border border-dark-600/30"
                >
                  <span className={`tag mb-3 ${
                    ev.type === 'cve' ? 'tag-cve' :
                    ev.type === 'ioc' ? 'tag-ioc' : 'tag-threat'
                  }`}>
                    {ev.entity}
                  </span>
                  <p className="text-sm text-dark-100 italic leading-relaxed">
                    "{ev.snippet}"
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Decorative gradient line */}
      <div className="absolute left-0 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-accent-cyan/20 to-transparent" />
    </div>
  );
}
