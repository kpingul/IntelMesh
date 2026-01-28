"""
Open Source Threat Intelligence Feeds.
Fetches IOCs, malware, vulnerabilities from various free OSINT sources.
"""

import httpx
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field
import json
import csv
from io import StringIO


# ============================================
# FEED CONFIGURATIONS
# ============================================

FEED_SOURCES = {
    # abuse.ch Suite
    "threatfox": {
        "name": "ThreatFox",
        "url": "https://threatfox.abuse.ch/export/csv/recent/",
        "type": "csv",
        "description": "IOCs including C2 servers, malware hashes, domains",
        "provider": "abuse.ch",
    },
    "urlhaus": {
        "name": "URLhaus",
        "url": "https://urlhaus.abuse.ch/downloads/json_recent/",
        "type": "json",
        "description": "Malicious URLs (malware distribution, C2)",
        "provider": "abuse.ch",
    },
    "malwarebazaar": {
        "name": "MalwareBazaar",
        "url": "https://bazaar.abuse.ch/export/csv/recent/",
        "type": "csv",
        "description": "Malware samples and hashes",
        "provider": "abuse.ch",
    },
    "feodotracker": {
        "name": "Feodo Tracker",
        "url": "https://feodotracker.abuse.ch/downloads/ipblocklist.json",
        "type": "json",
        "description": "Botnet C2 servers (Dridex, Emotet, TrickBot, QakBot)",
        "provider": "abuse.ch",
    },
    # Government Sources
    "cisa_kev": {
        "name": "CISA KEV",
        "url": "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
        "type": "json",
        "description": "Known Exploited Vulnerabilities catalog",
        "provider": "CISA",
    },
    # IP Reputation
    "emergingthreats": {
        "name": "Emerging Threats",
        "url": "https://rules.emergingthreats.net/blockrules/compromised-ips.txt",
        "type": "text",
        "description": "Compromised IP addresses",
        "provider": "Proofpoint",
    },
    # Phishing
    "openphish": {
        "name": "OpenPhish",
        "url": "https://openphish.com/feed.txt",
        "type": "text",
        "description": "Phishing URLs (community feed)",
        "provider": "OpenPhish",
    },
    # C2 Intelligence
    "c2_tracker": {
        "name": "C2 IntelFeeds",
        "url": "https://raw.githubusercontent.com/drb-ra/C2IntelFeeds/master/feeds/IPC2s-30day.csv",
        "type": "csv",
        "description": "C2 server IP addresses",
        "provider": "Community",
    },
    # SSL Blocklist
    "sslbl": {
        "name": "SSL Blacklist",
        "url": "https://sslbl.abuse.ch/blacklist/sslipblacklist.json",
        "type": "json",
        "description": "Malicious SSL certificates and IPs",
        "provider": "abuse.ch",
    },
}

HEADERS = {
    "User-Agent": "ThreatIntelDashboard/1.0 (Security Research)",
    "Accept": "application/json, text/plain, */*",
}


# ============================================
# DATA MODELS
# ============================================

@dataclass
class ThreatFeedItem:
    """Individual item from a threat feed."""
    id: str
    ioc_type: str  # ip, domain, url, hash, cve
    ioc_value: str
    threat_type: str  # malware, c2, phishing, botnet, exploit
    malware_family: Optional[str] = None
    confidence: Optional[int] = None  # 0-100
    first_seen: Optional[str] = None
    last_seen: Optional[str] = None
    source: str = ""
    tags: List[str] = field(default_factory=list)
    reference: Optional[str] = None
    raw_data: Optional[Dict] = None

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "ioc_type": self.ioc_type,
            "ioc_value": self.ioc_value,
            "threat_type": self.threat_type,
            "malware_family": self.malware_family,
            "confidence": self.confidence,
            "first_seen": self.first_seen,
            "last_seen": self.last_seen,
            "source": self.source,
            "tags": self.tags,
            "reference": self.reference,
        }


@dataclass
class CVEFeedItem:
    """CVE from vulnerability feeds."""
    cve_id: str
    vendor: str
    product: str
    vulnerability_name: str
    date_added: str
    due_date: Optional[str] = None
    known_ransomware: bool = False
    notes: str = ""
    source: str = ""

    def to_dict(self) -> Dict:
        return {
            "cve_id": self.cve_id,
            "vendor": self.vendor,
            "product": self.product,
            "vulnerability_name": self.vulnerability_name,
            "date_added": self.date_added,
            "due_date": self.due_date,
            "known_ransomware": self.known_ransomware,
            "notes": self.notes,
            "source": self.source,
        }


# ============================================
# FEED FETCHERS
# ============================================

async def fetch_url(url: str, timeout: int = 30) -> Optional[str]:
    """Fetch content from URL."""
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            response = await client.get(url, headers=HEADERS)
            response.raise_for_status()
            return response.text
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None


async def fetch_json(url: str, timeout: int = 30) -> Optional[Any]:
    """Fetch and parse JSON from URL."""
    content = await fetch_url(url, timeout)
    if content:
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            print(f"JSON decode error for {url}: {e}")
    return None


async def post_api(url: str, data: Dict, timeout: int = 30) -> Optional[Any]:
    """POST to API and return JSON response."""
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, json=data, headers=HEADERS)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        print(f"Error posting to {url}: {e}")
        return None


# ============================================
# ABUSE.CH FEEDS
# ============================================

async def fetch_threatfox(days: int = 7, limit: int = 500) -> List[ThreatFeedItem]:
    """Fetch recent IOCs from ThreatFox (CSV format)."""
    items = []

    content = await fetch_url(FEED_SOURCES["threatfox"]["url"])
    if not content:
        return items

    # ThreatFox CSV columns (from comments):
    # first_seen_utc, ioc_id, ioc_value, ioc_type, threat_type, fk_malware,
    # malware_alias, malware_printable, last_seen_utc, confidence_level,
    # is_compromised, reference, tags, anonymous, reporter
    fieldnames = [
        "first_seen_utc", "ioc_id", "ioc_value", "ioc_type", "threat_type",
        "fk_malware", "malware_alias", "malware_printable", "last_seen_utc",
        "confidence_level", "is_compromised", "reference", "tags", "anonymous", "reporter"
    ]

    try:
        # Skip comment lines
        lines = [line for line in content.strip().split('\n') if not line.startswith('#')]
        if not lines:
            return items

        reader = csv.DictReader(lines, fieldnames=fieldnames, quotechar='"')

        count = 0
        for row in reader:
            if count >= limit:
                break

            ioc_value = row.get("ioc_value", "").strip().strip('"')
            if not ioc_value:
                continue

            # Determine IOC type
            raw_ioc_type = row.get("ioc_type", "").strip().strip('"').lower()
            if "ip" in raw_ioc_type:
                ioc_type = "ip"
            elif "domain" in raw_ioc_type:
                ioc_type = "domain"
            elif "url" in raw_ioc_type:
                ioc_type = "url"
            elif "md5" in raw_ioc_type or "sha" in raw_ioc_type:
                ioc_type = "hash"
            else:
                ioc_type = "ip"  # Default for ip:port format

            # Parse tags
            tags_str = row.get("tags", "").strip().strip('"')
            tags = [t.strip() for t in tags_str.split(',') if t.strip()]

            malware = row.get("malware_printable", "").strip().strip('"')
            if malware in ("Unknown malware", "None", ""):
                malware = None

            confidence = None
            try:
                confidence = int(row.get("confidence_level", "0").strip().strip('"'))
            except ValueError:
                pass

            items.append(ThreatFeedItem(
                id=row.get("ioc_id", str(count)).strip().strip('"'),
                ioc_type=ioc_type,
                ioc_value=ioc_value,
                threat_type=row.get("threat_type", "botnet_cc").strip().strip('"'),
                malware_family=malware,
                confidence=confidence,
                first_seen=row.get("first_seen_utc", "").strip().strip('"'),
                last_seen=row.get("last_seen_utc", "").strip().strip('"') or None,
                source="threatfox",
                tags=tags,
                reference=row.get("reference", "").strip().strip('"') or None,
            ))
            count += 1

    except Exception as e:
        print(f"Error parsing ThreatFox CSV: {e}")

    return items


async def fetch_urlhaus(limit: int = 500) -> List[ThreatFeedItem]:
    """Fetch malicious URLs from URLhaus."""
    items = []

    data = await fetch_json(FEED_SOURCES["urlhaus"]["url"])
    if not data:
        return items

    # URLhaus returns dict: {"id": [entry], ...} format
    count = 0
    for url_id, entries in data.items():
        if count >= limit:
            break

        try:
            # Each value is a list with one entry
            entry = entries[0] if isinstance(entries, list) and entries else entries
            if not isinstance(entry, dict):
                continue

            tags = entry.get("tags", []) or []
            if entry.get("threat"):
                tags.append(entry["threat"])

            malware_family = None
            for tag in tags:
                if tag and tag not in ["32-bit", "64-bit", "elf", "exe", "mips", "arm", "x86"]:
                    malware_family = tag
                    break

            items.append(ThreatFeedItem(
                id=url_id,
                ioc_type="url",
                ioc_value=entry.get("url", ""),
                threat_type=entry.get("threat", "malware_download"),
                malware_family=malware_family,
                first_seen=entry.get("dateadded"),
                last_seen=entry.get("last_online"),
                source="urlhaus",
                tags=tags,
                reference=entry.get("urlhaus_link"),
                raw_data={
                    "status": entry.get("url_status"),
                    "reporter": entry.get("reporter"),
                },
            ))
            count += 1
        except Exception as e:
            print(f"Error parsing URLhaus entry: {e}")
            continue

    return items


async def fetch_malwarebazaar(limit: int = 200) -> List[ThreatFeedItem]:
    """Fetch recent malware samples from MalwareBazaar (CSV format)."""
    items = []

    content = await fetch_url(FEED_SOURCES["malwarebazaar"]["url"])
    if not content:
        return items

    # MalwareBazaar CSV columns (from comments):
    # first_seen_utc, sha256_hash, md5_hash, sha1_hash, reporter, file_name,
    # file_type_guess, mime_type, signature, clamav, vtpercent, imphash, ssdeep, tlsh
    fieldnames = [
        "first_seen_utc", "sha256_hash", "md5_hash", "sha1_hash", "reporter",
        "file_name", "file_type_guess", "mime_type", "signature", "clamav",
        "vtpercent", "imphash", "ssdeep", "tlsh"
    ]

    try:
        # Skip comment lines
        lines = [line for line in content.strip().split('\n') if not line.startswith('#')]
        if not lines:
            return items

        reader = csv.DictReader(lines, fieldnames=fieldnames, quotechar='"')

        count = 0
        for row in reader:
            if count >= limit:
                break

            sha256 = row.get("sha256_hash", "").strip().strip('"').strip()
            if not sha256 or len(sha256) != 64:
                continue

            signature = row.get("signature", "").strip().strip('"').strip()
            file_type = row.get("file_type_guess", "").strip().strip('"').strip()

            tags = []
            if signature and signature != "n/a":
                tags.append(signature)
            if file_type and file_type != "n/a":
                tags.append(file_type)

            items.append(ThreatFeedItem(
                id=sha256[:12],
                ioc_type="hash",
                ioc_value=sha256,
                threat_type="malware",
                malware_family=signature if signature and signature != "n/a" else None,
                first_seen=row.get("first_seen_utc", "").strip().strip('"'),
                source="malwarebazaar",
                tags=tags,
                reference=f"https://bazaar.abuse.ch/sample/{sha256}/",
                raw_data={
                    "sha256": sha256,
                    "md5": row.get("md5_hash", "").strip().strip('"'),
                    "sha1": row.get("sha1_hash", "").strip().strip('"'),
                    "file_name": row.get("file_name", "").strip().strip('"'),
                    "file_type": file_type,
                    "mime_type": row.get("mime_type", "").strip().strip('"'),
                    "reporter": row.get("reporter", "").strip().strip('"'),
                },
            ))
            count += 1

    except Exception as e:
        print(f"Error parsing MalwareBazaar CSV: {e}")

    return items


async def fetch_feodotracker() -> List[ThreatFeedItem]:
    """Fetch botnet C2 IPs from Feodo Tracker."""
    items = []

    data = await fetch_json(FEED_SOURCES["feodotracker"]["url"])
    if not data:
        return items

    for entry in data:
        try:
            items.append(ThreatFeedItem(
                id=f"feodo-{entry.get('ip_address', '')}",
                ioc_type="ip",
                ioc_value=entry.get("ip_address", ""),
                threat_type="botnet",
                malware_family=entry.get("malware"),
                first_seen=entry.get("first_seen"),
                last_seen=entry.get("last_online"),
                source="feodotracker",
                tags=[entry.get("malware", ""), "c2", "botnet"],
                raw_data={
                    "port": entry.get("port"),
                    "status": entry.get("status"),
                    "as_number": entry.get("as_number"),
                    "as_name": entry.get("as_name"),
                    "country": entry.get("country"),
                },
            ))
        except Exception as e:
            print(f"Error parsing Feodo entry: {e}")
            continue

    return items


async def fetch_sslbl() -> List[ThreatFeedItem]:
    """Fetch malicious SSL certificates from SSL Blacklist."""
    items = []

    data = await fetch_json(FEED_SOURCES["sslbl"]["url"])
    if not data:
        return items

    for entry in data:
        try:
            items.append(ThreatFeedItem(
                id=f"ssl-{entry.get('ip_address', '')}",
                ioc_type="ip",
                ioc_value=entry.get("ip_address", ""),
                threat_type="c2",
                malware_family=entry.get("malware"),
                first_seen=entry.get("first_seen"),
                source="sslbl",
                tags=[entry.get("malware", ""), "ssl", "c2"],
                raw_data={
                    "port": entry.get("port"),
                    "sha1_fingerprint": entry.get("sha1_fingerprint"),
                },
            ))
        except Exception as e:
            print(f"Error parsing SSLBL entry: {e}")
            continue

    return items


# ============================================
# CISA KEV FEED
# ============================================

async def fetch_cisa_kev() -> List[CVEFeedItem]:
    """Fetch CISA Known Exploited Vulnerabilities catalog."""
    items = []

    data = await fetch_json(FEED_SOURCES["cisa_kev"]["url"])
    if not data or "vulnerabilities" not in data:
        return items

    for vuln in data.get("vulnerabilities", []):
        try:
            items.append(CVEFeedItem(
                cve_id=vuln.get("cveID", ""),
                vendor=vuln.get("vendorProject", ""),
                product=vuln.get("product", ""),
                vulnerability_name=vuln.get("vulnerabilityName", ""),
                date_added=vuln.get("dateAdded", ""),
                due_date=vuln.get("dueDate"),
                known_ransomware=vuln.get("knownRansomwareCampaignUse", "Unknown") == "Known",
                notes=vuln.get("shortDescription", ""),
                source="cisa_kev",
            ))
        except Exception as e:
            print(f"Error parsing CISA KEV entry: {e}")
            continue

    return items


# ============================================
# IP REPUTATION FEEDS
# ============================================

async def fetch_emergingthreats() -> List[ThreatFeedItem]:
    """Fetch compromised IPs from Emerging Threats."""
    items = []

    content = await fetch_url(FEED_SOURCES["emergingthreats"]["url"])
    if not content:
        return items

    for line in content.strip().split('\n'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue

        # Basic IP validation
        parts = line.split('.')
        if len(parts) == 4:
            try:
                items.append(ThreatFeedItem(
                    id=f"et-{line}",
                    ioc_type="ip",
                    ioc_value=line,
                    threat_type="compromised",
                    source="emergingthreats",
                    tags=["compromised", "reputation"],
                ))
            except Exception:
                continue

    return items[:1000]  # Limit to 1000 IPs


async def fetch_c2_tracker() -> List[ThreatFeedItem]:
    """Fetch C2 IPs from community tracker."""
    items = []

    content = await fetch_url(FEED_SOURCES["c2_tracker"]["url"])
    if not content:
        return items

    try:
        reader = csv.DictReader(StringIO(content))
        for row in reader:
            ip = row.get("ip", "").strip()
            if not ip:
                continue

            items.append(ThreatFeedItem(
                id=f"c2t-{ip}",
                ioc_type="ip",
                ioc_value=ip,
                threat_type="c2",
                malware_family=row.get("family"),
                first_seen=row.get("first_seen"),
                last_seen=row.get("last_seen"),
                source="c2_tracker",
                tags=["c2", row.get("family", "")],
                raw_data={
                    "port": row.get("port"),
                    "url": row.get("url"),
                },
            ))
    except Exception as e:
        print(f"Error parsing C2 tracker CSV: {e}")

    return items


# ============================================
# PHISHING FEEDS
# ============================================

async def fetch_openphish(limit: int = 500) -> List[ThreatFeedItem]:
    """Fetch phishing URLs from OpenPhish."""
    items = []

    content = await fetch_url(FEED_SOURCES["openphish"]["url"])
    if not content:
        return items

    for line in content.strip().split('\n')[:limit]:
        url = line.strip()
        if not url or not url.startswith('http'):
            continue

        items.append(ThreatFeedItem(
            id=f"phish-{hash(url) & 0xFFFFFF:06x}",
            ioc_type="url",
            ioc_value=url,
            threat_type="phishing",
            source="openphish",
            tags=["phishing", "credential-theft"],
        ))

    return items


# ============================================
# AGGREGATE FETCHERS
# ============================================

async def fetch_all_ioc_feeds(limit_per_feed: int = 300) -> Dict[str, List[ThreatFeedItem]]:
    """Fetch all IOC feeds concurrently."""
    results = {}

    # Run fetchers concurrently
    tasks = {
        "threatfox": fetch_threatfox(days=7, limit=limit_per_feed),
        "urlhaus": fetch_urlhaus(limit=limit_per_feed),
        "malwarebazaar": fetch_malwarebazaar(limit=limit_per_feed),
        "feodotracker": fetch_feodotracker(),
        "sslbl": fetch_sslbl(),
        "emergingthreats": fetch_emergingthreats(),
        "c2_tracker": fetch_c2_tracker(),
        "openphish": fetch_openphish(limit=limit_per_feed),
    }

    for name, task in tasks.items():
        try:
            results[name] = await task
            print(f"Fetched {len(results[name])} items from {name}")
        except Exception as e:
            print(f"Error fetching {name}: {e}")
            results[name] = []

    return results


async def fetch_all_cve_feeds() -> Dict[str, List[CVEFeedItem]]:
    """Fetch all CVE/vulnerability feeds."""
    results = {}

    try:
        results["cisa_kev"] = await fetch_cisa_kev()
        print(f"Fetched {len(results['cisa_kev'])} CVEs from CISA KEV")
    except Exception as e:
        print(f"Error fetching CISA KEV: {e}")
        results["cisa_kev"] = []

    return results


# ============================================
# FEED STATISTICS
# ============================================

def get_feed_stats(
    ioc_feeds: Dict[str, List[ThreatFeedItem]],
    cve_feeds: Dict[str, List[CVEFeedItem]]
) -> Dict:
    """Get statistics about fetched feeds."""
    stats = {
        "total_iocs": 0,
        "total_cves": 0,
        "by_source": {},
        "by_ioc_type": {
            "ip": 0,
            "domain": 0,
            "url": 0,
            "hash": 0,
        },
        "by_threat_type": {},
        "malware_families": {},
        "ransomware_cves": 0,
    }

    # IOC stats
    for source, items in ioc_feeds.items():
        stats["by_source"][source] = len(items)
        stats["total_iocs"] += len(items)

        for item in items:
            # By type
            if item.ioc_type in stats["by_ioc_type"]:
                stats["by_ioc_type"][item.ioc_type] += 1

            # By threat type
            if item.threat_type:
                stats["by_threat_type"][item.threat_type] = \
                    stats["by_threat_type"].get(item.threat_type, 0) + 1

            # Malware families
            if item.malware_family:
                stats["malware_families"][item.malware_family] = \
                    stats["malware_families"].get(item.malware_family, 0) + 1

    # CVE stats
    for source, items in cve_feeds.items():
        stats["by_source"][source] = len(items)
        stats["total_cves"] += len(items)

        for item in items:
            if item.known_ransomware:
                stats["ransomware_cves"] += 1

    # Sort malware families by count
    stats["top_malware"] = sorted(
        stats["malware_families"].items(),
        key=lambda x: x[1],
        reverse=True
    )[:20]

    return stats
