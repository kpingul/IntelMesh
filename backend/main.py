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
    return {"success": True, "message": "All data cleared"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
