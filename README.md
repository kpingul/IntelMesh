# IntelMesh

A lightweight web application for aggregating and searching threat intelligence from news sources and PDF reports. Features a Mandiant TI-inspired dark dashboard with Co-Pilot style natural language search.

## Features

- **News Scraping**: Automatically fetches articles from BleepingComputer and GBHackers via RSS feeds
- **PDF Upload**: Extract threat intelligence from uploaded PDF reports
- **Entity Extraction**: Automatically extracts CVEs, IoCs (IPs, domains, hashes, URLs), malware names, threat actors, and TTP tags
- **Co-Pilot Search**: Natural language search bar supporting queries like:
  - "CVEs from last 7 days"
  - "show IoCs for CVE-2025-1234"
  - "find articles about ransomware"
  - "search Emotet"
- **Dashboard Views**: Overview, CVEs, IoCs, Threats, and Items views
- **Detail Panel**: Click any item to see extracted entities with evidence snippets
- **No Database**: All data lives in memory for the session

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd threat-intel-dashboard
   ```

2. **Set up the backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set up the frontend:**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

**Terminal 1 - Start the backend:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Start the frontend:**
```bash
cd frontend
npm run dev
```

**Open your browser to:** http://localhost:3000

## Usage

1. **Sync News**: Click "Sync News" to fetch the latest articles from BleepingComputer and GBHackers
2. **Upload PDFs**: Click "Upload PDFs" to upload threat intelligence reports
3. **Browse**: Use the sidebar to navigate between Overview, CVEs, IoCs, Threats, and Items views
4. **Search**: Use the Co-Pilot search bar to query your data with natural language
5. **View Details**: Click any item to see the detail panel with extracted entities

## Architecture

```
threat-intel-dashboard/
├── backend/
│   ├── main.py           # FastAPI application
│   ├── scraper.py        # RSS/HTML scraping for news sources
│   ├── extractors.py     # Entity extraction (CVEs, IoCs, threats, TTPs)
│   ├── pdf_extractor.py  # PDF text extraction
│   ├── query_parser.py   # Natural language query parsing
│   ├── store.py          # In-memory data store
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx      # Main dashboard page
    │   │   ├── layout.tsx    # Root layout
    │   │   └── globals.css   # Global styles
    │   ├── components/
    │   │   ├── Sidebar.tsx
    │   │   ├── TopBar.tsx
    │   │   ├── SearchBar.tsx
    │   │   ├── StatsCards.tsx
    │   │   ├── ItemsList.tsx
    │   │   ├── DetailPanel.tsx
    │   │   ├── CVEsView.tsx
    │   │   ├── IoCsView.tsx
    │   │   ├── ThreatsView.tsx
    │   │   └── OverviewCharts.tsx
    │   ├── lib/
    │   │   └── api.ts        # API client utilities
    │   └── types/
    │       └── index.ts      # TypeScript type definitions
    ├── package.json
    └── tailwind.config.js
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stats` | GET | Get dashboard statistics |
| `/api/items` | GET | Get all items (with optional source filter) |
| `/api/items/{id}` | GET | Get specific item with evidence snippets |
| `/api/cves` | GET | Get all CVEs with counts and sources |
| `/api/iocs` | GET | Get all IoCs grouped by type |
| `/api/threats` | GET | Get all threats (malware + actors) |
| `/api/sync` | POST | Sync news from configured sources |
| `/api/upload` | POST | Upload and process PDF files |
| `/api/search` | POST | Co-Pilot style natural language search |
| `/api/clear` | DELETE | Clear all stored data |

## Search Query Examples

- `CVEs from last 7 days` - Filter CVEs by time range
- `show IoCs for CVE-2025-1234` - Find IoCs associated with a specific CVE
- `find articles about ransomware` - Search for keyword in articles
- `search Emotet` - Search for a specific malware family
- `threats from bleepingcomputer` - Filter by source
- `list IPs` - Show IP addresses
- `domains from last 24 hours` - Combined filters

## Customization

### Adding New News Sources

Edit `backend/scraper.py` to add new RSS feeds:

```python
RSS_FEEDS = {
    "bleepingcomputer": "https://www.bleepingcomputer.com/feed/",
    "gbhackers": "https://gbhackers.com/feed/",
    # Add new sources here
}
```

### Extending Entity Extraction

Edit `backend/extractors.py` to add:
- New malware families to `MALWARE_FAMILIES`
- New threat actors to `THREAT_ACTORS`
- New TTP keywords to `TTP_KEYWORDS`

## Tech Stack

- **Backend**: FastAPI, httpx, BeautifulSoup4, feedparser, pdfplumber
- **Frontend**: Next.js 14, React, Tailwind CSS, Recharts, Lucide Icons
- **No Database**: In-memory storage only

## License

MIT
