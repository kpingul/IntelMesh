"""
Entity extraction utilities for threat intelligence data.
Extracts CVEs, IoCs (IPs, domains, URLs, hashes), threats, and TTP tags.
"""

import re
from typing import List, Dict, Set
from dataclasses import dataclass, field

# CVE pattern: CVE-YYYY-NNNNN (4+ digits)
CVE_PATTERN = re.compile(r'CVE-\d{4}-\d{4,}', re.IGNORECASE)

# IP address pattern (IPv4)
IP_PATTERN = re.compile(
    r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}'
    r'(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b'
)

# Domain pattern (simplified, excludes common false positives)
DOMAIN_PATTERN = re.compile(
    r'\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+'
    r'(?:com|net|org|io|ru|cn|xyz|top|info|biz|cc|tk|ml|ga|cf|pw|ws|su|onion)\b',
    re.IGNORECASE
)

# URL pattern
URL_PATTERN = re.compile(
    r'https?://[^\s<>"\')\]]+',
    re.IGNORECASE
)

# Hash patterns
MD5_PATTERN = re.compile(r'\b[a-fA-F0-9]{32}\b')
SHA1_PATTERN = re.compile(r'\b[a-fA-F0-9]{40}\b')
SHA256_PATTERN = re.compile(r'\b[a-fA-F0-9]{64}\b')

# Known threat actors (sample list - expandable)
THREAT_ACTORS = [
    "APT28", "APT29", "APT38", "APT41", "Lazarus", "Lazarus Group",
    "Cozy Bear", "Fancy Bear", "Sandworm", "Turla", "Equation Group",
    "FIN7", "FIN8", "FIN11", "Carbanak", "Cobalt Group", "TA505",
    "Wizard Spider", "Evil Corp", "DarkSide", "REvil", "Conti",
    "LockBit", "BlackCat", "ALPHV", "Cl0p", "Clop", "Hive",
    "Kimsuky", "Mustang Panda", "Stone Panda", "Charming Kitten",
    "Volt Typhoon", "Salt Typhoon", "Scattered Spider", "LAPSUS$",
    "NoName057", "Killnet", "Anonymous Sudan", "UNC2452", "UNC3886",
    "Midnight Blizzard", "Forest Blizzard", "Star Blizzard",
    "Velvet Ant", "Earth Lusca", "BlackTech", "Cicada", "MuddyWater",
]

# Known malware families (sample list - expandable)
MALWARE_FAMILIES = [
    "Emotet", "TrickBot", "QakBot", "Qbot", "IcedID", "BazarLoader",
    "Cobalt Strike", "Metasploit", "Mimikatz", "BloodHound",
    "Ryuk", "Maze", "REvil", "Sodinokibi", "WannaCry", "NotPetya",
    "Agent Tesla", "FormBook", "Remcos", "AsyncRAT", "NjRAT",
    "RedLine", "Raccoon", "Vidar", "Lumma", "StealC",
    "BlackMatter", "DarkSide", "LockBit", "BlackCat", "Hive",
    "SmokeLoader", "Amadey", "SystemBC", "Bumblebee", "PikaBot",
    "Raspberry Robin", "SocGholish", "FakeUpdates", "Gootloader",
    "XWorm", "PlugX", "ShadowPad", "Gh0st RAT", "China Chopper",
    "Sliver", "Brute Ratel", "Havoc", "Nighthawk", "Mythic",
    "SUNBURST", "TEARDROP", "Raindrop", "NOBELIUM",
]

# TTP keyword mappings
TTP_KEYWORDS = {
    "phishing": ["phishing", "spear-phishing", "spearphishing", "credential harvesting",
                 "social engineering", "malicious email", "phish"],
    "ransomware": ["ransomware", "ransom", "encrypt", "decryptor", "double extortion",
                   "data leak site", "extortion"],
    "credential_theft": ["credential", "password", "stealer", "infostealer", "keylogger",
                        "mimikatz", "dump", "lsass", "ntds"],
    "lateral_movement": ["lateral movement", "psexec", "wmi", "rdp", "smb", "pass the hash",
                        "pass the ticket", "pivoting"],
    "c2": ["command and control", "c2", "c&c", "beacon", "callback", "implant"],
    "persistence": ["persistence", "scheduled task", "registry", "startup", "service",
                   "backdoor", "webshell"],
    "exploitation": ["exploit", "vulnerability", "zero-day", "0day", "rce", "remote code execution",
                    "buffer overflow", "injection"],
    "data_exfiltration": ["exfiltration", "data theft", "data leak", "exfil", "staging"],
    "initial_access": ["initial access", "drive-by", "watering hole", "supply chain",
                      "compromised", "trojanized"],
    "defense_evasion": ["evasion", "obfuscation", "packing", "anti-analysis", "sandbox",
                       "disable", "bypass"],
}

# Common false positive domains to exclude
FALSE_POSITIVE_DOMAINS = {
    "example.com", "microsoft.com", "google.com", "github.com",
    "twitter.com", "facebook.com", "linkedin.com", "youtube.com",
    "bleepingcomputer.com", "gbhackers.com", "virustotal.com",
}


@dataclass
class ExtractedEntities:
    """Container for extracted threat intelligence entities."""
    cves: List[str] = field(default_factory=list)
    ips: List[str] = field(default_factory=list)
    domains: List[str] = field(default_factory=list)
    urls: List[str] = field(default_factory=list)
    hashes: List[Dict[str, str]] = field(default_factory=list)  # {"type": "md5/sha1/sha256", "value": "..."}
    threats: List[str] = field(default_factory=list)  # malware + actors
    malware: List[str] = field(default_factory=list)
    actors: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)  # TTP tags

    def to_dict(self) -> Dict:
        return {
            "cves": self.cves,
            "ips": self.ips,
            "domains": self.domains,
            "urls": self.urls,
            "hashes": self.hashes,
            "threats": self.threats,
            "malware": self.malware,
            "actors": self.actors,
            "tags": self.tags,
        }

    @property
    def iocs(self) -> Dict:
        """Return all IoCs grouped."""
        return {
            "ips": self.ips,
            "domains": self.domains,
            "urls": self.urls,
            "hashes": self.hashes,
        }

    @property
    def ioc_count(self) -> int:
        """Total number of IoCs."""
        return len(self.ips) + len(self.domains) + len(self.urls) + len(self.hashes)


def extract_cves(text: str) -> List[str]:
    """Extract CVE identifiers from text."""
    matches = CVE_PATTERN.findall(text)
    # Normalize to uppercase and deduplicate while preserving order
    seen = set()
    result = []
    for cve in matches:
        cve_upper = cve.upper()
        if cve_upper not in seen:
            seen.add(cve_upper)
            result.append(cve_upper)
    return result


def extract_ips(text: str) -> List[str]:
    """Extract IPv4 addresses from text."""
    matches = IP_PATTERN.findall(text)
    # Filter out common false positives (version numbers, etc.)
    filtered = []
    seen = set()
    for ip in matches:
        if ip not in seen:
            # Skip version-like patterns (x.x.x.x where all octets are small)
            octets = [int(o) for o in ip.split('.')]
            if not (all(o < 10 for o in octets)):  # Skip patterns like 1.2.3.4
                seen.add(ip)
                filtered.append(ip)
    return filtered


def extract_domains(text: str) -> List[str]:
    """Extract domain names from text."""
    matches = DOMAIN_PATTERN.findall(text)
    seen = set()
    result = []
    for domain in matches:
        domain_lower = domain.lower()
        if domain_lower not in seen and domain_lower not in FALSE_POSITIVE_DOMAINS:
            seen.add(domain_lower)
            result.append(domain_lower)
    return result


def extract_urls(text: str) -> List[str]:
    """Extract URLs from text."""
    matches = URL_PATTERN.findall(text)
    seen = set()
    result = []
    for url in matches:
        # Clean up trailing punctuation
        url = url.rstrip('.,;:)')
        if url not in seen:
            seen.add(url)
            result.append(url)
    return result


def extract_hashes(text: str) -> List[Dict[str, str]]:
    """Extract file hashes (MD5, SHA1, SHA256) from text."""
    result = []
    seen = set()

    # SHA256 first (longest)
    for match in SHA256_PATTERN.findall(text):
        hash_lower = match.lower()
        if hash_lower not in seen:
            seen.add(hash_lower)
            result.append({"type": "sha256", "value": hash_lower})

    # SHA1
    for match in SHA1_PATTERN.findall(text):
        hash_lower = match.lower()
        if hash_lower not in seen:
            seen.add(hash_lower)
            result.append({"type": "sha1", "value": hash_lower})

    # MD5
    for match in MD5_PATTERN.findall(text):
        hash_lower = match.lower()
        if hash_lower not in seen:
            seen.add(hash_lower)
            result.append({"type": "md5", "value": hash_lower})

    return result


def extract_threats(text: str) -> tuple[List[str], List[str], List[str]]:
    """
    Extract threat actors and malware families from text.
    Returns (all_threats, malware_list, actor_list)
    """
    text_lower = text.lower()

    malware_found = []
    actors_found = []

    for malware in MALWARE_FAMILIES:
        if malware.lower() in text_lower:
            malware_found.append(malware)

    for actor in THREAT_ACTORS:
        if actor.lower() in text_lower:
            actors_found.append(actor)

    all_threats = list(set(malware_found + actors_found))
    return all_threats, malware_found, actors_found


def extract_ttp_tags(text: str) -> List[str]:
    """Extract TTP-related tags based on keyword matching."""
    text_lower = text.lower()
    tags = []

    for tag, keywords in TTP_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                tags.append(tag)
                break  # One match is enough for this tag

    return tags


def extract_all(text: str) -> ExtractedEntities:
    """Extract all threat intelligence entities from text."""
    entities = ExtractedEntities()

    entities.cves = extract_cves(text)
    entities.ips = extract_ips(text)
    entities.domains = extract_domains(text)
    entities.urls = extract_urls(text)
    entities.hashes = extract_hashes(text)

    threats, malware, actors = extract_threats(text)
    entities.threats = threats
    entities.malware = malware
    entities.actors = actors

    entities.tags = extract_ttp_tags(text)

    return entities


def get_evidence_snippets(text: str, entities: ExtractedEntities, max_snippets: int = 5) -> List[Dict]:
    """
    Extract text snippets containing the found entities as evidence.
    Returns list of {"entity": "...", "snippet": "...", "type": "cve|ioc|threat"}
    """
    snippets = []
    sentences = re.split(r'(?<=[.!?])\s+', text)

    # Get snippets for CVEs
    for cve in entities.cves[:3]:
        for sentence in sentences:
            if cve.upper() in sentence.upper():
                snippets.append({
                    "entity": cve,
                    "snippet": sentence[:300] + ("..." if len(sentence) > 300 else ""),
                    "type": "cve"
                })
                break

    # Get snippets for threats
    for threat in entities.threats[:3]:
        for sentence in sentences:
            if threat.lower() in sentence.lower():
                snippets.append({
                    "entity": threat,
                    "snippet": sentence[:300] + ("..." if len(sentence) > 300 else ""),
                    "type": "threat"
                })
                break

    return snippets[:max_snippets]
