'use client';

import { useMemo } from 'react';
import {
  X,
  Shield,
  Skull,
  Crosshair,
  Building,
  Zap,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  Target,
  FileText,
} from 'lucide-react';
import { Stats, ThreatItem } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export type EntityType = 'actor' | 'product' | 'sector' | 'cve' | 'malware';

export interface SelectedEntity {
  type: EntityType;
  value: string;
  count?: number;
}

interface EntityDetailPanelProps {
  entity: SelectedEntity;
  items: ThreatItem[];
  stats: Stats | null;
  onClose: () => void;
  onItemClick: (item: ThreatItem) => void;
}

const entityConfig = {
  actor: {
    icon: Skull,
    color: 'slate',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-200',
    title: 'Threat Actor',
  },
  product: {
    icon: Crosshair,
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    title: 'Product',
  },
  sector: {
    icon: Building,
    color: 'emerald',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
    title: 'Sector',
  },
  cve: {
    icon: Shield,
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-600',
    borderColor: 'border-red-200',
    title: 'CVE',
  },
  malware: {
    icon: Zap,
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200',
    title: 'Malware',
  },
};

export default function EntityDetailPanel({
  entity,
  items,
  stats,
  onClose,
  onItemClick,
}: EntityDetailPanelProps) {
  const config = entityConfig[entity.type];
  const Icon = config.icon;

  // Filter items related to this entity
  const relatedItems = useMemo(() => {
    return items.filter((item) => {
      const value = entity.value.toLowerCase();
      switch (entity.type) {
        case 'actor':
          return item.extracted.actors.some((a) => a.toLowerCase() === value);
        case 'product':
          return item.extracted.products.some((p) => p.toLowerCase() === value);
        case 'sector':
          return item.extracted.sectors.some((s) => s.toLowerCase() === value);
        case 'cve':
          return item.extracted.cves.some((c) => c.toLowerCase() === value);
        case 'malware':
          return item.extracted.malware.some((m) => m.toLowerCase() === value);
        default:
          return false;
      }
    });
  }, [items, entity]);

  // Extract related entities from the filtered items
  const relatedEntities = useMemo(() => {
    const actors = new Set<string>();
    const products = new Set<string>();
    const sectors = new Set<string>();
    const cves = new Set<string>();
    const malware = new Set<string>();
    const techniques = new Set<string>();

    relatedItems.forEach((item) => {
      item.extracted.actors.forEach((a) => actors.add(a));
      item.extracted.products.forEach((p) => products.add(p));
      item.extracted.sectors.forEach((s) => sectors.add(s));
      item.extracted.cves.forEach((c) => cves.add(c));
      item.extracted.malware.forEach((m) => malware.add(m));
      item.extracted.tags.forEach((t) => techniques.add(t));
    });

    // Remove the current entity from its own list
    if (entity.type === 'actor') actors.delete(entity.value);
    if (entity.type === 'product') products.delete(entity.value);
    if (entity.type === 'sector') sectors.delete(entity.value);
    if (entity.type === 'cve') cves.delete(entity.value);
    if (entity.type === 'malware') malware.delete(entity.value);

    return {
      actors: Array.from(actors),
      products: Array.from(products),
      sectors: Array.from(sectors),
      cves: Array.from(cves),
      malware: Array.from(malware),
      techniques: Array.from(techniques),
    };
  }, [relatedItems, entity]);

  const renderEntityBadges = (
    entities: string[],
    type: EntityType,
    maxShow: number = 8
  ) => {
    if (entities.length === 0) return null;
    const cfg = entityConfig[type];
    const shown = entities.slice(0, maxShow);
    const remaining = entities.length - maxShow;

    return (
      <div className="flex flex-wrap gap-1.5">
        {shown.map((e) => (
          <span
            key={e}
            className={`text-[10px] px-2 py-1 ${cfg.bgColor} ${cfg.textColor} rounded border ${cfg.borderColor}`}
          >
            {e}
          </span>
        ))}
        {remaining > 0 && (
          <span className="text-[10px] px-2 py-1 bg-stone-100 text-stone-500 rounded border border-stone-200">
            +{remaining} more
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="w-[420px] bg-white border-l border-stone-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className={`p-4 border-b border-stone-200 bg-gradient-to-r from-${config.color}-50 to-white`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <Icon size={18} className={config.textColor} />
            </div>
            <div>
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">
                {config.title} Details
              </p>
              <h2 className="text-lg font-semibold text-stone-900">{entity.value}</h2>
              <p className="text-xs text-stone-500 mt-1">
                Found in {relatedItems.length} intelligence report{relatedItems.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X size={16} className="text-stone-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-center">
            <p className="text-2xl font-semibold text-stone-900 tabular-nums">
              {relatedItems.length}
            </p>
            <p className="text-[10px] text-stone-500 uppercase tracking-wider">Reports</p>
          </div>
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-center">
            <p className="text-2xl font-semibold text-red-600 tabular-nums">
              {relatedEntities.cves.length + (entity.type === 'cve' ? 1 : 0)}
            </p>
            <p className="text-[10px] text-red-500 uppercase tracking-wider">CVEs</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <p className="text-2xl font-semibold text-slate-600 tabular-nums">
              {relatedEntities.actors.length + (entity.type === 'actor' ? 1 : 0)}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Actors</p>
          </div>
        </div>

        {/* Entity-specific sections */}
        {entity.type === 'product' && (
          <>
            {/* Affected Versions/Components */}
            {relatedEntities.cves.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Shield size={12} className="text-red-500" />
                  Associated Vulnerabilities
                </h3>
                <div className="space-y-1">
                  {relatedEntities.cves.slice(0, 6).map((cve) => (
                    <div
                      key={cve}
                      className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-100"
                    >
                      <code className="text-xs text-red-600 font-medium">{cve}</code>
                      <AlertTriangle size={12} className="text-red-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Threat Actors Targeting */}
            {relatedEntities.actors.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Skull size={12} className="text-slate-500" />
                  Threat Actors Targeting This Product
                </h3>
                {renderEntityBadges(relatedEntities.actors, 'actor')}
              </div>
            )}

            {/* Sectors Using */}
            {relatedEntities.sectors.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Building size={12} className="text-emerald-500" />
                  Sectors Affected
                </h3>
                {renderEntityBadges(relatedEntities.sectors, 'sector')}
              </div>
            )}
          </>
        )}

        {entity.type === 'sector' && (
          <>
            {/* Why at Risk */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <h3 className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <AlertTriangle size={12} />
                Why This Sector Is At Risk
              </h3>
              <ul className="text-xs text-amber-700 space-y-1.5">
                {relatedEntities.actors.length > 0 && (
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">-</span>
                    <span>Targeted by {relatedEntities.actors.length} known threat actor{relatedEntities.actors.length !== 1 ? 's' : ''}</span>
                  </li>
                )}
                {relatedEntities.cves.length > 0 && (
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">-</span>
                    <span>{relatedEntities.cves.length} CVE{relatedEntities.cves.length !== 1 ? 's' : ''} affecting sector-specific products</span>
                  </li>
                )}
                {relatedEntities.malware.length > 0 && (
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">-</span>
                    <span>{relatedEntities.malware.length} malware familie{relatedEntities.malware.length !== 1 ? 's' : ''} observed targeting this sector</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Targeted Products */}
            {relatedEntities.products.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Crosshair size={12} className="text-blue-500" />
                  Targeted Products in This Sector
                </h3>
                {renderEntityBadges(relatedEntities.products, 'product')}
              </div>
            )}

            {/* Active Threats */}
            {relatedEntities.actors.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Skull size={12} className="text-slate-500" />
                  Active Threat Actors
                </h3>
                {renderEntityBadges(relatedEntities.actors, 'actor')}
              </div>
            )}
          </>
        )}

        {entity.type === 'cve' && (
          <>
            {/* Affected Products */}
            {relatedEntities.products.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Target size={12} className="text-blue-500" />
                  Affected Products
                </h3>
                {renderEntityBadges(relatedEntities.products, 'product')}
              </div>
            )}

            {/* Exploiting Actors */}
            {relatedEntities.actors.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Skull size={12} className="text-slate-500" />
                  Actors Exploiting This CVE
                </h3>
                {renderEntityBadges(relatedEntities.actors, 'actor')}
              </div>
            )}

            {/* Sectors at Risk */}
            {relatedEntities.sectors.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Building size={12} className="text-emerald-500" />
                  Sectors at Risk
                </h3>
                {renderEntityBadges(relatedEntities.sectors, 'sector')}
              </div>
            )}

            {/* Associated Malware */}
            {relatedEntities.malware.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Zap size={12} className="text-orange-500" />
                  Associated Malware
                </h3>
                {renderEntityBadges(relatedEntities.malware, 'malware')}
              </div>
            )}
          </>
        )}

        {entity.type === 'actor' && (
          <>
            {/* Targeted Products */}
            {relatedEntities.products.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Target size={12} className="text-blue-500" />
                  Targeted Products
                </h3>
                {renderEntityBadges(relatedEntities.products, 'product')}
              </div>
            )}

            {/* Targeted Sectors */}
            {relatedEntities.sectors.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Building size={12} className="text-emerald-500" />
                  Targeted Sectors
                </h3>
                {renderEntityBadges(relatedEntities.sectors, 'sector')}
              </div>
            )}

            {/* Exploited CVEs */}
            {relatedEntities.cves.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Shield size={12} className="text-red-500" />
                  Exploited Vulnerabilities
                </h3>
                <div className="space-y-1">
                  {relatedEntities.cves.slice(0, 6).map((cve) => (
                    <div
                      key={cve}
                      className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-100"
                    >
                      <code className="text-xs text-red-600 font-medium">{cve}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Associated Malware */}
            {relatedEntities.malware.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Zap size={12} className="text-orange-500" />
                  Associated Malware
                </h3>
                {renderEntityBadges(relatedEntities.malware, 'malware')}
              </div>
            )}

            {/* Techniques */}
            {relatedEntities.techniques.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Zap size={12} className="text-cyan-500" />
                  Attack Techniques (TTPs)
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {relatedEntities.techniques.slice(0, 10).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-1 bg-cyan-50 text-cyan-600 rounded border border-cyan-200 capitalize"
                    >
                      {t.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {entity.type === 'malware' && (
          <>
            {/* Associated Actors */}
            {relatedEntities.actors.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Skull size={12} className="text-slate-500" />
                  Associated Threat Actors
                </h3>
                {renderEntityBadges(relatedEntities.actors, 'actor')}
              </div>
            )}

            {/* Targeted Products */}
            {relatedEntities.products.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Target size={12} className="text-blue-500" />
                  Targeted Products
                </h3>
                {renderEntityBadges(relatedEntities.products, 'product')}
              </div>
            )}

            {/* Targeted Sectors */}
            {relatedEntities.sectors.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Building size={12} className="text-emerald-500" />
                  Targeted Sectors
                </h3>
                {renderEntityBadges(relatedEntities.sectors, 'sector')}
              </div>
            )}

            {/* Exploited CVEs */}
            {relatedEntities.cves.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-2">
                  <Shield size={12} className="text-red-500" />
                  Exploited Vulnerabilities
                </h3>
                <div className="space-y-1">
                  {relatedEntities.cves.slice(0, 6).map((cve) => (
                    <div
                      key={cve}
                      className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-100"
                    >
                      <code className="text-xs text-red-600 font-medium">{cve}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Related Reports */}
        <div>
          <h3 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-2">
            <FileText size={12} className="text-stone-500" />
            Related Intelligence Reports
          </h3>
          <div className="space-y-2">
            {relatedItems.length === 0 ? (
              <p className="text-xs text-stone-400 p-3 text-center bg-stone-50 rounded-lg">
                No related reports found
              </p>
            ) : (
              relatedItems.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="w-full p-3 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 hover:border-stone-300 text-left transition-all group"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-stone-700 group-hover:text-stone-900 line-clamp-2">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] text-stone-400">{item.source}</span>
                        <span className="text-[9px] text-stone-300">-</span>
                        <span className="text-[9px] text-stone-400">
                          {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={12} className="text-stone-300 group-hover:text-cyan-500 transition-colors flex-shrink-0 mt-0.5" />
                  </div>
                </button>
              ))
            )}
            {relatedItems.length > 8 && (
              <p className="text-[10px] text-stone-400 text-center">
                +{relatedItems.length - 8} more reports
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
