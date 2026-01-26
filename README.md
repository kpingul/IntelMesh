# Cyber Threat Radar

A personal threat intelligence briefing platform designed for security professionals. Get daily briefings, track trends, study attack patterns, and build your defensive knowledge—all in a clean, learning-first interface.

## Features

### Daily Briefings
- **Today's Briefing**: 5-10 bullet summary of what matters today
- **Briefing Modes**: Executive (impact-focused), Analyst (investigation angles), Engineer (mitigation steps)
- **Daily/Weekly/Monthly Views**: Curated summaries that emphasize patterns and learning

### Trends & Patterns
- **Category Trends**: Track ransomware, phishing, exploitation, and other threat categories
- **Technique Frequency**: See which TTPs are appearing most often
- **Insight Cards**: AI-generated observations like "OAuth abuse is rising"

### Threat Threads
- **Deduplicated Stories**: Multiple articles clustered into single threat topics
- **Rich Entity Extraction**: CVEs, IoCs, threat actors, malware families, TTPs
- **Attack Flow Indicators**: See which threads have step-by-step attack breakdowns

### Attack Playbooks
- **Visual Attack Flows**: Step-by-step breakdown of how attacks work
- **Defender Guidance**: What to look for, mitigations, and detection ideas
- **Difficulty Levels**: Beginner, intermediate, and advanced playbooks

### Learning Queue
- **Personal Study List**: Track what you're learning
- **Progress Tracking**: Not started, in progress, learned
- **Notes & Takeaways**: Capture your insights

### 12 News Sources
- BleepingComputer, GBHackers, The Hacker News, Krebs on Security
- Security Affairs, Threatpost, SecurityWeek, CISA
- Cisco Talos, Palo Alto Unit42, Mandiant, Recorded Future

## Quick Start

### Prerequisites

- Python 3.9+ (3.11 recommended)
- Node.js 18+
- npm

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd threat-intel-dashboard
   ```

2. **Set up the backend:**
   ```bash
   cd backend
   python3.11 -m venv venv
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
source venv/bin/activate
python -m uvicorn main:app --reload --port 8000
```

**Terminal 2 - Start the frontend:**
```bash
cd frontend
npm run dev
```

**Open your browser to:** http://localhost:3000

## Usage

1. **Sync News**: Click "Sync News" in the sidebar to fetch the latest articles
2. **Daily Briefing**: Start on the Today view for a quick situational awareness check
3. **Explore Trends**: Use the Trends view to identify patterns and shifts
4. **Study Threads**: Browse deduplicated threat stories in the Threads view
5. **Learn Playbooks**: Study attack flows with defender guidance
6. **Track Learning**: Add items to your learning queue and capture notes

## Architecture

```
threat-intel-dashboard/
├── backend/
│   ├── main.py           # FastAPI application (11 endpoints)
│   ├── scraper.py        # RSS/HTML scraping for 12 news sources
│   ├── extractors.py     # Entity extraction (CVEs, IoCs, threats, TTPs)
│   ├── pdf_extractor.py  # PDF text extraction
│   ├── query_parser.py   # Natural language query parsing
│   ├── store.py          # In-memory data store
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx      # Main dashboard
    │   │   ├── layout.tsx    # Root layout
    │   │   └── globals.css   # Global styles
    │   ├── components/
    │   │   ├── Sidebar.tsx
    │   │   ├── TodayView.tsx
    │   │   ├── BriefingsView.tsx
    │   │   ├── TrendsView.tsx
    │   │   ├── ThreadsView.tsx
    │   │   ├── PlaybooksView.tsx
    │   │   ├── LearningView.tsx
    │   │   ├── SettingsView.tsx
    │   │   └── ThreadDetailPanel.tsx
    │   ├── lib/api.ts
    │   └── types/index.ts
    ├── package.json
    └── tailwind.config.js
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stats` | GET | Dashboard statistics |
| `/api/items` | GET | All items (with optional source filter) |
| `/api/items/{id}` | GET | Specific item with evidence snippets |
| `/api/cves` | GET | All CVEs with counts and sources |
| `/api/iocs` | GET | All IoCs grouped by type |
| `/api/threats` | GET | All threats (malware + actors) |
| `/api/sync` | POST | Sync news from configured sources |
| `/api/upload` | POST | Upload and process PDF files |
| `/api/search` | POST | Natural language search |
| `/api/clear` | DELETE | Clear all stored data |

## Design Philosophy

- **Signal over noise**: Deduplicate stories into threads
- **Learning-first**: Every item teaches "how it works" + "what to do"
- **Fast scanning**: Briefings readable in minutes
- **Visual understanding**: Attack flow diagrams make threats memorable

## Tech Stack

- **Backend**: FastAPI, httpx, BeautifulSoup4, feedparser, pdfplumber
- **Frontend**: Next.js 14, React 18, Tailwind CSS, Recharts, Lucide Icons
- **Typography**: Fraunces (display), Source Sans 3 (body), JetBrains Mono (code)
- **No Database**: In-memory storage only (session-based)

## License

MIT
