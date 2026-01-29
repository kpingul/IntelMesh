# IntelMesh

A personal threat intelligence platform for security professionals. Aggregate threat feeds, track vulnerabilities, monitor threat actors, and analyze attack patterns — all in a clean, minimal interface.

## Screenshots

### Dashboard
> Priority intelligence alerts, cyber global heatmap, active threat actors, targeted products, sectors at risk, critical CVEs, and malware classifications — all at a glance.

![IntelMesh Dashboard](screenshots/intel_mash_dashboard.png)

### Threats
> Browse identified threats grouped by malware families and threat actors. Each card shows mention counts and links to the source articles where they were detected.

![Threats View](screenshots/intelmash_2.png)

### Analytics
> Top CVEs ranked by mention frequency, top threats, TTP distribution across your intel sources, and a live feed of recent items tagged with extracted indicators.

![Analytics Overview](screenshots/intelmash_3.png)

### Intelligence Feed
> Scrollable feed of recent articles from 12+ OSINT sources. Each item is tagged with extracted CVEs, TTPs, and threat actors. The sidebar tracks CVE mention velocity and top threat rankings.

![Intelligence Feed](screenshots/intelmash_4.png)

## Features

- **Priority Intelligence** — High-severity items surfaced for immediate attention
- **Cyber Global Map** — Geographic heatmap of threat activity by region
- **Threat Feeds** — ThreatFox, URLhaus, MalwareBazaar, Feodo Tracker, CISA KEV, OpenPhish, C2 Tracker, SSL Blacklist, Emerging Threats
- **Entity Extraction** — Automated extraction of CVEs, IoCs, threat actors, malware families, and TTPs from articles
- **12+ News Sources** — BleepingComputer, The Hacker News, Krebs on Security, CISA, and more
- **PDF Upload** — Upload threat reports and extract structured intelligence
- **Search** — Natural language query parsing across all collected intel
- **TTP Analysis** — Technique distribution charts showing exploitation, persistence, defense evasion, credential theft, and more

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+

### Installation

```bash
# Clone
git clone https://github.com/kpingul/IntelMesh.git
cd IntelMesh

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### Running

```bash
# Terminal 1 — Backend
cd backend && source venv/bin/activate
python -m uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture

```
IntelMesh/
├── backend/
│   ├── main.py           # FastAPI application & API routes
│   ├── scraper.py        # RSS/HTML scraping from 12+ sources
│   ├── extractors.py     # Entity extraction (CVEs, IoCs, TTPs)
│   ├── threat_feeds.py   # OSINT feed integrations
│   ├── pdf_extractor.py  # PDF report processing
│   ├── query_parser.py   # Natural language search parsing
│   └── store.py          # In-memory data store
│
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx      # Main dashboard
        │   └── globals.css   # Global styles
        ├── components/
        │   ├── Sidebar.tsx
        │   ├── TodayView.tsx
        │   ├── BriefingsView.tsx
        │   ├── TrendsView.tsx
        │   ├── ThreadsView.tsx
        │   ├── FeedsView.tsx
        │   ├── SettingsView.tsx
        │   └── ThreadDetailPanel.tsx
        ├── lib/api.ts
        └── types/index.ts
```

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stats` | GET | Dashboard statistics |
| `/api/items` | GET | All intel items |
| `/api/items/{id}` | GET | Specific item details |
| `/api/cves` | GET | CVEs with mention counts |
| `/api/iocs` | GET | IoCs grouped by type |
| `/api/threats` | GET | Malware families + threat actors |
| `/api/sync` | POST | Sync news sources |
| `/api/upload` | POST | Upload PDF reports |
| `/api/search` | POST | Natural language search |
| `/api/feeds/sync` | POST | Sync OSINT threat feeds |
| `/api/feeds/iocs` | GET | Feed IoCs |
| `/api/feeds/cves` | GET | Feed CVEs |

## Tech Stack

- **Backend**: FastAPI, aiohttp, BeautifulSoup4, feedparser, pdfplumber
- **Frontend**: Next.js 14, React 18, Tailwind CSS, Recharts
- **Typography**: Fragment Mono
- **Storage**: In-memory (session-based)

## License

MIT
