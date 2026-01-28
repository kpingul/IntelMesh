"""
In-memory data store for threat intelligence items.
No persistence - data lives for the session only.
"""

from typing import Dict, List, Optional, Set, Any
from dataclasses import dataclass, field
from datetime import datetime, timezone
import uuid
from collections import Counter


@dataclass
class ThreatIntelStore:
    """In-memory store for threat intelligence data."""
    items: List[Dict] = field(default_factory=list)
    _id_index: Dict[str, Dict] = field(default_factory=dict)

    # Feed data storage
    feed_iocs: Dict[str, List[Dict]] = field(default_factory=dict)
    feed_cves: Dict[str, List[Dict]] = field(default_factory=dict)
    feed_last_updated: Dict[str, str] = field(default_factory=dict)

    def add_item(self, item: Dict) -> str:
        """Add an item to the store. Returns the item ID."""
        # Generate ID if not present
        if 'id' not in item:
            item['id'] = str(uuid.uuid4())[:8]

        # Add timestamp if not present
        if 'added_at' not in item:
            item['added_at'] = datetime.now(timezone.utc).isoformat()

        # Check for duplicates by URL or title+source
        for existing in self.items:
            if item.get('url') and existing.get('url') == item.get('url'):
                return existing['id']  # Already exists
            if (item.get('title') == existing.get('title') and
                item.get('source') == existing.get('source')):
                return existing['id']

        self.items.append(item)
        self._id_index[item['id']] = item
        return item['id']

    def add_items(self, items: List[Dict]) -> List[str]:
        """Add multiple items. Returns list of IDs."""
        return [self.add_item(item) for item in items]

    def get_item(self, item_id: str) -> Optional[Dict]:
        """Get an item by ID."""
        return self._id_index.get(item_id)

    def get_all_items(self) -> List[Dict]:
        """Get all items, sorted by date (newest first)."""
        return sorted(
            self.items,
            key=lambda x: x.get('date', x.get('added_at', '')),
            reverse=True
        )

    def get_items_by_source(self, source: str) -> List[Dict]:
        """Get items from a specific source."""
        return [i for i in self.items if i.get('source') == source]

    def clear(self):
        """Clear all items."""
        self.items = []
        self._id_index = {}

    def get_stats(self) -> Dict:
        """Get aggregated statistics."""
        total_items = len(self.items)
        articles = len([i for i in self.items if i.get('source') in ['bleepingcomputer', 'gbhackers']])
        pdfs = len([i for i in self.items if i.get('source') == 'pdf'])

        all_cves: Set[str] = set()
        all_ips: Set[str] = set()
        all_domains: Set[str] = set()
        all_hashes: Set[str] = set()
        all_urls: Set[str] = set()
        all_threats: Set[str] = set()
        all_malware: Set[str] = set()
        all_actors: Set[str] = set()
        all_tags: List[str] = []
        all_products: List[str] = []
        all_geography: List[str] = []
        all_sectors: List[str] = []

        cve_counter: Counter = Counter()
        threat_counter: Counter = Counter()

        for item in self.items:
            extracted = item.get('extracted', {})

            cves = extracted.get('cves', [])
            all_cves.update(cves)
            cve_counter.update(cves)

            all_ips.update(extracted.get('ips', []))
            all_domains.update(extracted.get('domains', []))
            all_urls.update(extracted.get('urls', []))

            for h in extracted.get('hashes', []):
                all_hashes.add(h.get('value', ''))

            threats = extracted.get('threats', [])
            all_threats.update(threats)
            threat_counter.update(threats)

            all_malware.update(extracted.get('malware', []))
            all_actors.update(extracted.get('actors', []))
            all_tags.extend(extracted.get('tags', []))
            all_products.extend(extracted.get('products', []))
            all_geography.extend(extracted.get('geography', []))
            all_sectors.extend(extracted.get('sectors', []))

        total_iocs = len(all_ips) + len(all_domains) + len(all_hashes) + len(all_urls)

        # Count sources dynamically
        source_counts = Counter(item.get('source', 'unknown') for item in self.items)

        return {
            "total_items": total_items,
            "articles": articles,
            "pdfs": pdfs,
            "total_cves": len(all_cves),
            "total_iocs": total_iocs,
            "total_threats": len(all_threats),
            "ioc_breakdown": {
                "ips": len(all_ips),
                "domains": len(all_domains),
                "hashes": len(all_hashes),
                "urls": len(all_urls),
            },
            "top_cves": cve_counter.most_common(10),
            "top_threats": threat_counter.most_common(10),
            "all_cves": list(all_cves),
            "all_threats": list(all_threats),
            "all_malware": list(all_malware),
            "all_actors": list(all_actors),
            "tag_counts": dict(Counter(all_tags)),
            "product_counts": dict(Counter(all_products)),
            "geography_counts": dict(Counter(all_geography)),
            "sector_counts": dict(Counter(all_sectors)),
            "sources": dict(source_counts),
        }

    def get_all_cves(self) -> List[Dict]:
        """Get all CVEs with their sources and counts."""
        cve_data: Dict[str, Dict] = {}

        for item in self.items:
            for cve in item.get('extracted', {}).get('cves', []):
                if cve not in cve_data:
                    cve_data[cve] = {
                        "id": cve,
                        "count": 0,
                        "sources": [],
                        "items": [],
                    }
                cve_data[cve]["count"] += 1
                cve_data[cve]["sources"].append(item.get('source'))
                cve_data[cve]["items"].append({
                    "id": item.get('id'),
                    "title": item.get('title'),
                    "source": item.get('source'),
                })

        # Sort by count descending
        return sorted(cve_data.values(), key=lambda x: x['count'], reverse=True)

    def get_all_iocs(self) -> Dict[str, List]:
        """Get all IoCs grouped by type."""
        iocs = {
            "ips": [],
            "domains": [],
            "urls": [],
            "hashes": [],
        }

        ip_set, domain_set, url_set, hash_set = set(), set(), set(), set()

        for item in self.items:
            extracted = item.get('extracted', {})
            item_ref = {"id": item.get('id'), "title": item.get('title'), "source": item.get('source')}

            for ip in extracted.get('ips', []):
                if ip not in ip_set:
                    ip_set.add(ip)
                    iocs["ips"].append({"value": ip, "source_item": item_ref})

            for domain in extracted.get('domains', []):
                if domain not in domain_set:
                    domain_set.add(domain)
                    iocs["domains"].append({"value": domain, "source_item": item_ref})

            for url in extracted.get('urls', []):
                if url not in url_set:
                    url_set.add(url)
                    iocs["urls"].append({"value": url, "source_item": item_ref})

            for h in extracted.get('hashes', []):
                val = h.get('value', '')
                if val and val not in hash_set:
                    hash_set.add(val)
                    iocs["hashes"].append({
                        "value": val,
                        "type": h.get('type'),
                        "source_item": item_ref
                    })

        return iocs

    def get_all_threats(self) -> List[Dict]:
        """Get all threats (malware + actors) with counts."""
        threat_data: Dict[str, Dict] = {}

        for item in self.items:
            extracted = item.get('extracted', {})

            for malware in extracted.get('malware', []):
                if malware not in threat_data:
                    threat_data[malware] = {"name": malware, "type": "malware", "count": 0, "items": []}
                threat_data[malware]["count"] += 1
                threat_data[malware]["items"].append({
                    "id": item.get('id'),
                    "title": item.get('title'),
                })

            for actor in extracted.get('actors', []):
                if actor not in threat_data:
                    threat_data[actor] = {"name": actor, "type": "actor", "count": 0, "items": []}
                threat_data[actor]["count"] += 1
                threat_data[actor]["items"].append({
                    "id": item.get('id'),
                    "title": item.get('title'),
                })

        return sorted(threat_data.values(), key=lambda x: x['count'], reverse=True)

    # ============================================
    # FEED DATA METHODS
    # ============================================

    def update_feed_iocs(self, source: str, items: List[Dict]) -> int:
        """Update IOCs from a feed source."""
        self.feed_iocs[source] = items
        self.feed_last_updated[source] = datetime.now(timezone.utc).isoformat()
        return len(items)

    def update_feed_cves(self, source: str, items: List[Dict]) -> int:
        """Update CVEs from a feed source."""
        self.feed_cves[source] = items
        self.feed_last_updated[source] = datetime.now(timezone.utc).isoformat()
        return len(items)

    def get_feed_iocs(self, source: Optional[str] = None, ioc_type: Optional[str] = None,
                      threat_type: Optional[str] = None, limit: int = 500) -> List[Dict]:
        """Get IOCs from feeds with optional filtering."""
        all_iocs = []

        sources = [source] if source else list(self.feed_iocs.keys())

        for src in sources:
            for ioc in self.feed_iocs.get(src, []):
                if ioc_type and ioc.get("ioc_type") != ioc_type:
                    continue
                if threat_type and ioc.get("threat_type") != threat_type:
                    continue
                all_iocs.append(ioc)

        return all_iocs[:limit]

    def get_feed_cves(self, source: Optional[str] = None,
                      ransomware_only: bool = False, limit: int = 500) -> List[Dict]:
        """Get CVEs from feeds with optional filtering."""
        all_cves = []

        sources = [source] if source else list(self.feed_cves.keys())

        for src in sources:
            for cve in self.feed_cves.get(src, []):
                if ransomware_only and not cve.get("known_ransomware"):
                    continue
                all_cves.append(cve)

        # Sort by date_added (newest first)
        all_cves.sort(key=lambda x: x.get("date_added", ""), reverse=True)
        return all_cves[:limit]

    def get_feed_stats(self) -> Dict:
        """Get statistics about feed data."""
        stats = {
            "total_feed_iocs": 0,
            "total_feed_cves": 0,
            "by_source": {},
            "by_ioc_type": {
                "ip": 0,
                "domain": 0,
                "url": 0,
                "hash": 0,
            },
            "by_threat_type": {},
            "malware_families": Counter(),
            "ransomware_cves": 0,
            "last_updated": self.feed_last_updated,
        }

        # IOC stats
        for source, items in self.feed_iocs.items():
            stats["by_source"][source] = len(items)
            stats["total_feed_iocs"] += len(items)

            for item in items:
                ioc_type = item.get("ioc_type")
                if ioc_type in stats["by_ioc_type"]:
                    stats["by_ioc_type"][ioc_type] += 1

                threat_type = item.get("threat_type")
                if threat_type:
                    stats["by_threat_type"][threat_type] = \
                        stats["by_threat_type"].get(threat_type, 0) + 1

                malware = item.get("malware_family")
                if malware:
                    stats["malware_families"][malware] += 1

        # CVE stats
        for source, items in self.feed_cves.items():
            stats["by_source"][source] = len(items)
            stats["total_feed_cves"] += len(items)

            for item in items:
                if item.get("known_ransomware"):
                    stats["ransomware_cves"] += 1

        # Top malware
        stats["top_malware"] = stats["malware_families"].most_common(20)
        stats["malware_families"] = dict(stats["malware_families"])

        return stats

    def search_feeds(self, query: str, limit: int = 100) -> Dict[str, List[Dict]]:
        """Search across all feed data."""
        query_lower = query.lower()
        results = {
            "iocs": [],
            "cves": [],
        }

        # Search IOCs
        for items in self.feed_iocs.values():
            for item in items:
                if (query_lower in item.get("ioc_value", "").lower() or
                    query_lower in (item.get("malware_family") or "").lower() or
                    query_lower in str(item.get("tags", [])).lower()):
                    results["iocs"].append(item)
                    if len(results["iocs"]) >= limit:
                        break

        # Search CVEs
        for items in self.feed_cves.values():
            for item in items:
                if (query_lower in item.get("cve_id", "").lower() or
                    query_lower in item.get("vulnerability_name", "").lower() or
                    query_lower in item.get("vendor", "").lower() or
                    query_lower in item.get("product", "").lower()):
                    results["cves"].append(item)
                    if len(results["cves"]) >= limit:
                        break

        return results

    def clear_feeds(self):
        """Clear all feed data."""
        self.feed_iocs = {}
        self.feed_cves = {}
        self.feed_last_updated = {}


# Global store instance
store = ThreatIntelStore()
