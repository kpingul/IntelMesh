"""
Query parser for Co-Pilot style natural language search.
Translates user queries into structured filters.
"""

import re
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any
from dataclasses import dataclass


@dataclass
class ParsedQuery:
    """Structured representation of a parsed query."""
    query_type: Optional[str] = None  # cve, ioc, threat, item, all
    keywords: List[str] = None
    cve_id: Optional[str] = None
    time_range: Optional[str] = None  # last_24h, 7d, 30d
    source: Optional[str] = None  # bleepingcomputer, gbhackers, pdf
    entity_type: Optional[str] = None  # ip, domain, hash, url
    raw_query: str = ""

    def __post_init__(self):
        if self.keywords is None:
            self.keywords = []

    def to_dict(self) -> Dict:
        return {
            "query_type": self.query_type,
            "keywords": self.keywords,
            "cve_id": self.cve_id,
            "time_range": self.time_range,
            "source": self.source,
            "entity_type": self.entity_type,
            "raw_query": self.raw_query,
        }


# Time range patterns
TIME_PATTERNS = {
    r'\b(today|last\s*24\s*h(ours?)?|past\s*24\s*h(ours?)?)\b': 'last_24h',
    r'\b(last\s*(7|seven)\s*days?|past\s*(7|seven)\s*days?|this\s*week)\b': '7d',
    r'\b(last\s*(30|thirty)\s*days?|past\s*(30|thirty)\s*days?|this\s*month)\b': '30d',
    r'\b(last\s*week)\b': '7d',
    r'\b(last\s*month)\b': '30d',
}

# CVE pattern
CVE_PATTERN = re.compile(r'CVE-\d{4}-\d{4,}', re.IGNORECASE)

# Query type indicators
TYPE_INDICATORS = {
    'cve': [r'\bcves?\b', r'\bvulnerabilit(y|ies)\b'],
    'ioc': [r'\biocs?\b', r'\bindicators?\b', r'\bips?\b', r'\bdomains?\b', r'\bhash(es)?\b', r'\burls?\b'],
    'threat': [r'\bthreats?\b', r'\bmalware\b', r'\bactors?\b', r'\bapts?\b', r'\battack(ers?)?\b'],
    'item': [r'\barticles?\b', r'\breports?\b', r'\bnews\b', r'\bpdfs?\b'],
}

# Entity type indicators
ENTITY_INDICATORS = {
    'ip': [r'\bips?\b', r'\bip\s*address(es)?\b'],
    'domain': [r'\bdomains?\b'],
    'hash': [r'\bhash(es)?\b', r'\bmd5\b', r'\bsha\d+\b'],
    'url': [r'\burls?\b'],
}

# Source indicators
SOURCE_INDICATORS = {
    'bleepingcomputer': [r'\bbleeping\s*computer\b', r'\bbleeping\b'],
    'gbhackers': [r'\bgbhackers?\b', r'\bgb\s*hackers?\b'],
    'pdf': [r'\bpdfs?\b', r'\buploaded?\b', r'\breports?\b'],
}

# Stop words to filter out from keywords
STOP_WORDS = {
    'show', 'find', 'search', 'list', 'get', 'display', 'give', 'me', 'the',
    'all', 'any', 'from', 'for', 'with', 'about', 'related', 'to', 'in',
    'a', 'an', 'and', 'or', 'of', 'are', 'is', 'was', 'were', 'been',
    'what', 'which', 'where', 'when', 'how', 'can', 'could', 'would',
    'please', 'thanks', 'thank', 'you', 'i', 'my', 'we', 'our',
}


def extract_time_range(query: str) -> Optional[str]:
    """Extract time range from query."""
    query_lower = query.lower()
    for pattern, time_range in TIME_PATTERNS.items():
        if re.search(pattern, query_lower):
            return time_range
    return None


def extract_cve_id(query: str) -> Optional[str]:
    """Extract specific CVE ID from query."""
    match = CVE_PATTERN.search(query)
    if match:
        return match.group(0).upper()
    return None


def extract_query_type(query: str) -> Optional[str]:
    """Determine the primary query type."""
    query_lower = query.lower()
    for qtype, patterns in TYPE_INDICATORS.items():
        for pattern in patterns:
            if re.search(pattern, query_lower):
                return qtype
    return 'all'


def extract_entity_type(query: str) -> Optional[str]:
    """Extract specific IoC entity type."""
    query_lower = query.lower()
    for etype, patterns in ENTITY_INDICATORS.items():
        for pattern in patterns:
            if re.search(pattern, query_lower):
                return etype
    return None


def extract_source(query: str) -> Optional[str]:
    """Extract source filter from query."""
    query_lower = query.lower()
    for source, patterns in SOURCE_INDICATORS.items():
        for pattern in patterns:
            if re.search(pattern, query_lower):
                return source
    return None


def extract_keywords(query: str, parsed: ParsedQuery) -> List[str]:
    """Extract meaningful keywords from query after removing parsed elements."""
    # Remove CVE IDs
    text = CVE_PATTERN.sub('', query)

    # Remove time patterns
    for pattern in TIME_PATTERNS.keys():
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)

    # Remove type indicators
    for patterns in TYPE_INDICATORS.values():
        for pattern in patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)

    # Remove source indicators
    for patterns in SOURCE_INDICATORS.values():
        for pattern in patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)

    # Tokenize and filter
    words = re.findall(r'\b[a-zA-Z0-9_-]+\b', text)
    keywords = [w for w in words if w.lower() not in STOP_WORDS and len(w) > 1]

    return keywords


def parse_query(query: str) -> ParsedQuery:
    """
    Parse a natural language query into structured filters.

    Examples:
        "CVEs from last 7 days" -> ParsedQuery(query_type='cve', time_range='7d')
        "show IoCs for CVE-2025-1234" -> ParsedQuery(query_type='ioc', cve_id='CVE-2025-1234')
        "find articles about ransomware" -> ParsedQuery(query_type='item', keywords=['ransomware'])
        "search Emotet" -> ParsedQuery(keywords=['Emotet'])
    """
    parsed = ParsedQuery(raw_query=query)

    # Extract structured elements
    parsed.time_range = extract_time_range(query)
    parsed.cve_id = extract_cve_id(query)
    parsed.query_type = extract_query_type(query)
    parsed.entity_type = extract_entity_type(query)
    parsed.source = extract_source(query)

    # Extract remaining keywords
    parsed.keywords = extract_keywords(query, parsed)

    return parsed


def get_time_filter_date(time_range: str) -> datetime:
    """Convert time range to cutoff datetime."""
    now = datetime.now(timezone.utc)
    if time_range == 'last_24h':
        return now - timedelta(hours=24)
    elif time_range == '7d':
        return now - timedelta(days=7)
    elif time_range == '30d':
        return now - timedelta(days=30)
    return datetime.min.replace(tzinfo=timezone.utc)


def filter_items(items: List[Dict], parsed: ParsedQuery) -> List[Dict]:
    """
    Filter items based on parsed query.
    """
    results = items.copy()

    # Filter by source
    if parsed.source:
        results = [i for i in results if i.get('source', '').lower() == parsed.source.lower()]

    # Filter by time range
    if parsed.time_range:
        cutoff = get_time_filter_date(parsed.time_range)
        filtered = []
        for item in results:
            item_date = item.get('date')
            if item_date:
                try:
                    if isinstance(item_date, str):
                        item_dt = datetime.fromisoformat(item_date.replace('Z', '+00:00'))
                    else:
                        item_dt = item_date
                    if item_dt >= cutoff:
                        filtered.append(item)
                except:
                    filtered.append(item)  # Include if can't parse date
            else:
                filtered.append(item)
        results = filtered

    # Filter by CVE ID
    if parsed.cve_id:
        cve_upper = parsed.cve_id.upper()
        results = [i for i in results if cve_upper in [c.upper() for c in i.get('extracted', {}).get('cves', [])]]

    # Filter by keywords (search in title, content, and extracted entities)
    if parsed.keywords:
        filtered = []
        for item in results:
            text_to_search = ' '.join([
                item.get('title', ''),
                item.get('content', ''),
                item.get('description', ''),
                ' '.join(item.get('extracted', {}).get('threats', [])),
                ' '.join(item.get('extracted', {}).get('tags', [])),
            ]).lower()

            if any(kw.lower() in text_to_search for kw in parsed.keywords):
                filtered.append(item)
        results = filtered

    return results


def generate_answer_summary(results: List[Dict], parsed: ParsedQuery) -> str:
    """Generate a natural language summary of the search results."""
    if not results:
        return f"No results found for '{parsed.raw_query}'"

    count = len(results)
    item_word = "item" if count == 1 else "items"

    # Count entities across results
    total_cves = set()
    total_iocs = 0
    total_threats = set()

    for item in results:
        extracted = item.get('extracted', {})
        total_cves.update(extracted.get('cves', []))
        total_iocs += len(extracted.get('ips', []))
        total_iocs += len(extracted.get('domains', []))
        total_iocs += len(extracted.get('hashes', []))
        total_iocs += len(extracted.get('urls', []))
        total_threats.update(extracted.get('threats', []))

    parts = [f"Found {count} {item_word}"]

    if parsed.cve_id:
        parts.append(f"related to {parsed.cve_id}")
    elif parsed.keywords:
        parts.append(f"mentioning '{', '.join(parsed.keywords)}'")

    if parsed.time_range:
        time_desc = {'last_24h': 'last 24 hours', '7d': 'last 7 days', '30d': 'last 30 days'}
        parts.append(f"from {time_desc.get(parsed.time_range, parsed.time_range)}")

    summary = ' '.join(parts) + '.'

    # Add entity counts
    extras = []
    if total_cves:
        extras.append(f"{len(total_cves)} CVE{'s' if len(total_cves) > 1 else ''}")
    if total_iocs:
        extras.append(f"{total_iocs} IoC{'s' if total_iocs > 1 else ''}")
    if total_threats:
        extras.append(f"{len(total_threats)} threat{'s' if len(total_threats) > 1 else ''}")

    if extras:
        summary += f" Contains {', '.join(extras)}."

    return summary
