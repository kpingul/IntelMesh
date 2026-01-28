"""
FastAPI backend for Threat Intelligence Dashboard.
Provides endpoints for scraping, PDF upload, search, and data retrieval.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio

from store import store
from scraper import scrape_all_sources, scrape_source, RSS_FEEDS
from extractors import extract_all, get_evidence_snippets
from pdf_extractor import process_pdf_upload
from query_parser import parse_query, filter_items, generate_answer_summary
from threat_feeds import (
    fetch_all_ioc_feeds, fetch_all_cve_feeds,
    fetch_threatfox, fetch_urlhaus, fetch_malwarebazaar,
    fetch_feodotracker, fetch_sslbl, fetch_emergingthreats,
    fetch_c2_tracker, fetch_openphish, fetch_cisa_kev,
    FEED_SOURCES
)

app = FastAPI(
    title="Threat Intel Dashboard API",
    description="Backend API for threat intelligence aggregation and search",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SyncRequest(BaseModel):
    """Request model for syncing news."""
    sources: Optional[List[str]] = None  # None means all sources
    limit_per_source: int = 15
    fetch_full_content: bool = True


class SearchRequest(BaseModel):
    """Request model for Co-Pilot search."""
    query: str


class SearchResponse(BaseModel):
    """Response model for search results."""
    query: str
    parsed_query: dict
    answer_summary: str
    result_count: int
    results: List[dict]


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "Threat Intel Dashboard API"}


@app.get("/api/stats")
async def get_stats():
    """Get dashboard statistics."""
    return store.get_stats()


@app.get("/api/items")
async def get_items(
    source: Optional[str] = Query(None, description="Filter by source"),
    limit: int = Query(50, description="Maximum items to return"),
):
    """Get all items, optionally filtered by source."""
    if source:
        items = store.get_items_by_source(source)
    else:
        items = store.get_all_items()
    return {"items": items[:limit], "total": len(items)}


@app.get("/api/items/{item_id}")
async def get_item(item_id: str):
    """Get a specific item by ID."""
    item = store.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Add evidence snippets
    if item.get('content') and item.get('extracted'):
        from extractors import ExtractedEntities
        entities = ExtractedEntities(**item['extracted'])
        item['evidence'] = get_evidence_snippets(item['content'], entities)

    return item


@app.get("/api/cves")
async def get_cves():
    """Get all CVEs with counts and sources."""
    return {"cves": store.get_all_cves()}


@app.get("/api/iocs")
async def get_iocs():
    """Get all IoCs grouped by type."""
    return store.get_all_iocs()


@app.get("/api/threats")
async def get_threats():
    """Get all threats (malware + actors)."""
    return {"threats": store.get_all_threats()}


@app.post("/api/sync")
async def sync_news(request: SyncRequest):
    """
    Sync news from configured sources.
    Scrapes articles, extracts entities, and stores in memory.
    """
    sources = request.sources or list(RSS_FEEDS.keys())
    all_articles = []

    for source in sources:
        try:
            articles = await scrape_source(
                source,
                limit=request.limit_per_source,
                fetch_full_content=request.fetch_full_content
            )
            all_articles.extend(articles)
        except Exception as e:
            print(f"Error scraping {source}: {e}")

    # Extract entities from each article
    processed = 0
    for article in all_articles:
        content = article.get('content', '') or article.get('description', '')
        if content:
            entities = extract_all(content)
            article['extracted'] = entities.to_dict()
            store.add_item(article)
            processed += 1

    return {
        "success": True,
        "message": f"Synced {processed} articles from {len(sources)} sources",
        "articles_processed": processed,
        "sources": sources,
        "stats": store.get_stats(),
    }


@app.post("/api/upload")
async def upload_pdfs(files: List[UploadFile] = File(...)):
    """
    Upload and process PDF files.
    Extracts text and threat intelligence entities.
    """
    results = []

    for file in files:
        if not file.filename.lower().endswith('.pdf'):
            results.append({
                "filename": file.filename,
                "success": False,
                "error": "Not a PDF file"
            })
            continue

        try:
            file_bytes = await file.read()
            pdf_result = process_pdf_upload(file.filename, file_bytes)

            if pdf_result["success"]:
                # Extract entities from PDF text
                entities = extract_all(pdf_result["text"])

                # Create item for store
                item = {
                    "title": file.filename,
                    "source": "pdf",
                    "date": pdf_result["uploaded_at"],
                    "description": pdf_result["summary"],
                    "content": pdf_result["text"],
                    "extracted": entities.to_dict(),
                    "filename": file.filename,
                }

                item_id = store.add_item(item)

                results.append({
                    "filename": file.filename,
                    "success": True,
                    "id": item_id,
                    "char_count": pdf_result["char_count"],
                    "entities": {
                        "cves": len(entities.cves),
                        "iocs": entities.ioc_count,
                        "threats": len(entities.threats),
                        "tags": entities.tags,
                    }
                })
            else:
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": pdf_result.get("error", "Unknown error")
                })

        except Exception as e:
            results.append({
                "filename": file.filename,
                "success": False,
                "error": str(e)
            })

    successful = sum(1 for r in results if r.get("success"))
    return {
        "success": True,
        "message": f"Processed {successful}/{len(files)} PDFs",
        "results": results,
        "stats": store.get_stats(),
    }


@app.post("/api/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    """
    Co-Pilot style search endpoint.
    Parses natural language query and returns filtered results.
    """
    parsed = parse_query(request.query)
    items = store.get_all_items()
    results = filter_items(items, parsed)

    # Generate answer summary
    answer = generate_answer_summary(results, parsed)

    return SearchResponse(
        query=request.query,
        parsed_query=parsed.to_dict(),
        answer_summary=answer,
        result_count=len(results),
        results=results[:50],  # Limit results
    )


@app.get("/api/search")
async def search_get(q: str = Query(..., description="Search query")):
    """GET version of search for convenience."""
    return await search(SearchRequest(query=q))


@app.delete("/api/clear")
async def clear_data():
    """Clear all stored data."""
    store.clear()
    store.clear_feeds()
    return {"success": True, "message": "All data cleared"}


# ============================================
# THREAT FEED ENDPOINTS
# ============================================

class FeedSyncRequest(BaseModel):
    """Request model for syncing threat feeds."""
    sources: Optional[List[str]] = None  # None means all feeds
    limit_per_feed: int = 300


@app.get("/api/feeds/sources")
async def get_feed_sources():
    """Get list of available threat feed sources."""
    return {
        "sources": FEED_SOURCES,
        "last_updated": store.feed_last_updated,
    }


@app.post("/api/feeds/sync")
async def sync_feeds(request: FeedSyncRequest):
    """
    Sync threat intelligence feeds.
    Fetches IOCs and CVEs from configured OSINT sources.
    """
    sources = request.sources or list(FEED_SOURCES.keys())
    results = {
        "success": True,
        "synced_sources": [],
        "errors": [],
        "stats": {},
    }

    # Define feed fetchers
    fetchers = {
        "threatfox": lambda: fetch_threatfox(days=7, limit=request.limit_per_feed),
        "urlhaus": lambda: fetch_urlhaus(limit=request.limit_per_feed),
        "malwarebazaar": lambda: fetch_malwarebazaar(limit=request.limit_per_feed),
        "feodotracker": fetch_feodotracker,
        "sslbl": fetch_sslbl,
        "emergingthreats": fetch_emergingthreats,
        "c2_tracker": fetch_c2_tracker,
        "openphish": lambda: fetch_openphish(limit=request.limit_per_feed),
        "cisa_kev": fetch_cisa_kev,
    }

    for source in sources:
        if source not in fetchers:
            results["errors"].append(f"Unknown source: {source}")
            continue

        try:
            items = await fetchers[source]()

            if source == "cisa_kev":
                # CVE feed
                item_dicts = [item.to_dict() for item in items]
                count = store.update_feed_cves(source, item_dicts)
            else:
                # IOC feed
                item_dicts = [item.to_dict() for item in items]
                count = store.update_feed_iocs(source, item_dicts)

            results["synced_sources"].append({
                "source": source,
                "count": count,
                "name": FEED_SOURCES.get(source, {}).get("name", source),
            })
            results["stats"][source] = count

        except Exception as e:
            results["errors"].append(f"{source}: {str(e)}")

    results["total_iocs"] = store.get_feed_stats()["total_feed_iocs"]
    results["total_cves"] = store.get_feed_stats()["total_feed_cves"]

    return results


@app.get("/api/feeds/iocs")
async def get_feed_iocs(
    source: Optional[str] = Query(None, description="Filter by source"),
    ioc_type: Optional[str] = Query(None, description="Filter by IOC type (ip, domain, url, hash)"),
    threat_type: Optional[str] = Query(None, description="Filter by threat type"),
    limit: int = Query(500, description="Maximum items to return"),
):
    """Get IOCs from threat feeds."""
    iocs = store.get_feed_iocs(source=source, ioc_type=ioc_type, threat_type=threat_type, limit=limit)
    return {
        "iocs": iocs,
        "total": len(iocs),
        "filters": {
            "source": source,
            "ioc_type": ioc_type,
            "threat_type": threat_type,
        }
    }


@app.get("/api/feeds/cves")
async def get_feed_cves(
    source: Optional[str] = Query(None, description="Filter by source"),
    ransomware_only: bool = Query(False, description="Only show CVEs used in ransomware"),
    limit: int = Query(500, description="Maximum items to return"),
):
    """Get CVEs from vulnerability feeds (CISA KEV)."""
    cves = store.get_feed_cves(source=source, ransomware_only=ransomware_only, limit=limit)
    return {
        "cves": cves,
        "total": len(cves),
        "ransomware_count": len([c for c in cves if c.get("known_ransomware")]),
    }


@app.get("/api/feeds/stats")
async def get_feed_stats():
    """Get statistics about threat feed data."""
    return store.get_feed_stats()


@app.get("/api/feeds/search")
async def search_feeds(
    q: str = Query(..., description="Search query"),
    limit: int = Query(100, description="Maximum items to return"),
):
    """Search across all threat feed data."""
    results = store.search_feeds(q, limit=limit)
    return {
        "query": q,
        "results": results,
        "ioc_count": len(results["iocs"]),
        "cve_count": len(results["cves"]),
    }


@app.get("/api/feeds/malware")
async def get_malware_families():
    """Get top malware families from feeds."""
    stats = store.get_feed_stats()
    return {
        "top_malware": stats.get("top_malware", []),
        "total_families": len(stats.get("malware_families", {})),
    }


@app.get("/api/feeds/ips")
async def get_malicious_ips(
    limit: int = Query(200, description="Maximum IPs to return"),
):
    """Get malicious IP addresses from all feeds."""
    ips = store.get_feed_iocs(ioc_type="ip", limit=limit)
    return {
        "ips": ips,
        "total": len(ips),
        "sources": list(set(ip.get("source") for ip in ips)),
    }


@app.get("/api/feeds/urls")
async def get_malicious_urls(
    threat_type: Optional[str] = Query(None, description="Filter: phishing, malware, c2"),
    limit: int = Query(200, description="Maximum URLs to return"),
):
    """Get malicious URLs from feeds."""
    urls = store.get_feed_iocs(ioc_type="url", threat_type=threat_type, limit=limit)
    return {
        "urls": urls,
        "total": len(urls),
    }


@app.get("/api/feeds/hashes")
async def get_malware_hashes(
    limit: int = Query(200, description="Maximum hashes to return"),
):
    """Get malware hashes from feeds."""
    hashes = store.get_feed_iocs(ioc_type="hash", limit=limit)
    return {
        "hashes": hashes,
        "total": len(hashes),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
