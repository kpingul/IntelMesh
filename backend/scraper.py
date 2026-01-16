"""
Web scraper for threat intelligence news sources.
Supports BleepingComputer and GBHackers via RSS and HTML parsing.
"""

import httpx
import feedparser
from bs4 import BeautifulSoup
from datetime import datetime, timezone
from typing import List, Dict, Optional
import re
import asyncio
import cloudscraper

# RSS Feed URLs
RSS_FEEDS = {
    # General Security News
    "bleepingcomputer": "https://www.bleepingcomputer.com/feed/",
    "gbhackers": "https://gbhackers.com/feed/",
    "thehackernews": "https://feeds.feedburner.com/TheHackersNews",
    "krebsonsecurity": "https://krebsonsecurity.com/feed/",
    "securityaffairs": "https://securityaffairs.com/feed",
    "threatpost": "https://threatpost.com/feed/",
    "securityweek": "https://feeds.feedburner.com/securityweek",
    # Government Advisories
    "cisa": "https://www.cisa.gov/cybersecurity-advisories/all.xml",
    # Vendor Research
    "talos": "https://feeds.feedburner.com/feedburner/Talos",
    "unit42": "https://unit42.paloaltonetworks.com/feed/",
    "mandiant": "https://www.mandiant.com/resources/blog/rss.xml",
    "recordedfuture": "https://www.recordedfuture.com/feed",
}

# Fallback URLs for HTML scraping
HTML_URLS = {
    "bleepingcomputer": "https://www.bleepingcomputer.com/news/security/",
    "gbhackers": "https://gbhackers.com/category/cyber-security-news/",
    "thehackernews": "https://thehackernews.com/",
    "krebsonsecurity": "https://krebsonsecurity.com/",
    "securityaffairs": "https://securityaffairs.com/",
    "threatpost": "https://threatpost.com/",
    "securityweek": "https://www.securityweek.com/",
    "cisa": "https://www.cisa.gov/news-events/cybersecurity-advisories",
    "talos": "https://blog.talosintelligence.com/",
    "unit42": "https://unit42.paloaltonetworks.com/",
    "mandiant": "https://www.mandiant.com/resources/blog",
    "recordedfuture": "https://www.recordedfuture.com/blog",
}

# User agent to avoid blocks
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
}


# Sites that need cloudscraper (Cloudflare/compression issues)
CLOUDSCRAPER_SITES = ["gbhackers.com", "securityaffairs.com"]


async def fetch_url(url: str, timeout: int = 30) -> Optional[str]:
    """Fetch content from a URL."""
    try:
        # Use cloudscraper for sites with Cloudflare or compression issues
        if any(site in url for site in CLOUDSCRAPER_SITES):
            scraper = cloudscraper.create_scraper()
            response = scraper.get(url, timeout=timeout)
            response.raise_for_status()
            return response.text

        # Use httpx for other sites
        headers = HEADERS.copy()
        headers["Referer"] = "https://www.google.com/"
        async with httpx.AsyncClient(
            timeout=timeout,
            follow_redirects=True,
            http2=True
        ) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.text
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None


def parse_rss_feed(feed_content: str, source: str) -> List[Dict]:
    """Parse RSS feed content and extract articles."""
    feed = feedparser.parse(feed_content)
    articles = []

    for entry in feed.entries:
        try:
            # Parse date
            published = None
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                published = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
            elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                published = datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)
            else:
                published = datetime.now(timezone.utc)

            # Get description/summary
            description = ""
            if hasattr(entry, 'description'):
                # Strip HTML tags from description
                soup = BeautifulSoup(entry.description, 'html.parser')
                description = soup.get_text(separator=' ', strip=True)
            elif hasattr(entry, 'summary'):
                soup = BeautifulSoup(entry.summary, 'html.parser')
                description = soup.get_text(separator=' ', strip=True)

            # Get content if available
            content = description
            if hasattr(entry, 'content') and entry.content:
                soup = BeautifulSoup(entry.content[0].value, 'html.parser')
                content = soup.get_text(separator=' ', strip=True)

            articles.append({
                "title": entry.title,
                "url": entry.link,
                "date": published.isoformat(),
                "date_obj": published,
                "description": description[:500],
                "content": content,
                "source": source,
            })
        except Exception as e:
            print(f"Error parsing RSS entry: {e}")
            continue

    return articles


async def fetch_article_content(url: str) -> Optional[str]:
    """Fetch full article content from URL."""
    html = await fetch_url(url)
    if not html:
        return None

    soup = BeautifulSoup(html, 'html.parser')

    # Remove script and style elements
    for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside']):
        element.decompose()

    # Try to find article content
    article = None

    # BleepingComputer
    article = soup.find('div', class_='article_section')
    if not article:
        article = soup.find('article')
    if not article:
        article = soup.find('div', class_='article-body')
    if not article:
        article = soup.find('div', class_='entry-content')
    if not article:
        article = soup.find('main')

    if article:
        return article.get_text(separator=' ', strip=True)

    # Fallback: get body text
    body = soup.find('body')
    if body:
        return body.get_text(separator=' ', strip=True)[:10000]

    return None


async def scrape_html_bleepingcomputer(limit: int = 20) -> List[Dict]:
    """Scrape articles from BleepingComputer HTML page."""
    html = await fetch_url(HTML_URLS["bleepingcomputer"])
    if not html:
        return []

    soup = BeautifulSoup(html, 'html.parser')
    articles = []

    # Find article links
    article_elements = soup.find_all('li', class_='bc_news_item') or soup.find_all('article')

    for elem in article_elements[:limit]:
        try:
            link = elem.find('a')
            if not link:
                continue

            title = link.get_text(strip=True)
            url = link.get('href', '')

            if not url.startswith('http'):
                url = f"https://www.bleepingcomputer.com{url}"

            # Find date if available
            date_elem = elem.find('time') or elem.find(class_='bc_news_date')
            date = datetime.now(timezone.utc)
            if date_elem:
                date_str = date_elem.get('datetime') or date_elem.get_text(strip=True)
                try:
                    date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                except:
                    pass

            articles.append({
                "title": title,
                "url": url,
                "date": date.isoformat(),
                "date_obj": date,
                "description": "",
                "content": "",
                "source": "bleepingcomputer",
            })
        except Exception as e:
            print(f"Error parsing HTML article: {e}")
            continue

    return articles


async def scrape_html_gbhackers(limit: int = 20) -> List[Dict]:
    """Scrape articles from GBHackers HTML page."""
    html = await fetch_url(HTML_URLS["gbhackers"])
    if not html:
        return []

    soup = BeautifulSoup(html, 'html.parser')
    articles = []

    # Find article elements - GBHackers uses article tags with class 'post'
    article_elements = soup.find_all('article') or soup.find_all('div', class_='post')

    # Also try common WordPress theme patterns
    if not article_elements:
        article_elements = soup.find_all('div', class_='entry')
    if not article_elements:
        article_elements = soup.select('.post-item, .blog-post, .news-item')

    for elem in article_elements[:limit]:
        try:
            # Find the title link
            link = elem.find('h2', class_='entry-title')
            if link:
                link = link.find('a')
            if not link:
                link = elem.find('h3')
                if link:
                    link = link.find('a')
            if not link:
                link = elem.find('a', class_='entry-title-link')
            if not link:
                # Fallback: find first link with substantial text
                for a in elem.find_all('a'):
                    text = a.get_text(strip=True)
                    if len(text) > 20 and not text.startswith('Read'):
                        link = a
                        break

            if not link:
                continue

            title = link.get_text(strip=True)
            url = link.get('href', '')

            if not title or len(title) < 10:
                continue

            if not url.startswith('http'):
                url = f"https://gbhackers.com{url}"

            # Find date
            date = datetime.now(timezone.utc)
            date_elem = elem.find('time')
            if not date_elem:
                date_elem = elem.find(class_='entry-date')
            if not date_elem:
                date_elem = elem.find(class_='post-date')
            if not date_elem:
                date_elem = elem.find('span', class_='date')

            if date_elem:
                date_str = date_elem.get('datetime') or date_elem.get_text(strip=True)
                try:
                    date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                except:
                    # Try common date formats
                    for fmt in ['%B %d, %Y', '%Y-%m-%d', '%d %B %Y', '%b %d, %Y']:
                        try:
                            date = datetime.strptime(date_str.strip(), fmt).replace(tzinfo=timezone.utc)
                            break
                        except:
                            continue

            # Find description/excerpt
            description = ""
            excerpt = elem.find('div', class_='entry-content') or elem.find('p', class_='excerpt')
            if not excerpt:
                excerpt = elem.find('div', class_='post-excerpt')
            if not excerpt:
                # Get first paragraph
                excerpt = elem.find('p')
            if excerpt:
                description = excerpt.get_text(strip=True)[:500]

            articles.append({
                "title": title,
                "url": url,
                "date": date.isoformat(),
                "date_obj": date,
                "description": description,
                "content": "",
                "source": "gbhackers",
            })
        except Exception as e:
            print(f"Error parsing GBHackers HTML article: {e}")
            continue

    return articles


async def scrape_source(source: str, limit: int = 20, fetch_full_content: bool = True) -> List[Dict]:
    """
    Scrape articles from a news source.
    Tries RSS first, falls back to HTML scraping.
    """
    articles = []

    # Try RSS first
    if source in RSS_FEEDS:
        feed_content = await fetch_url(RSS_FEEDS[source])
        if feed_content:
            articles = parse_rss_feed(feed_content, source)

    # Fallback to HTML if RSS failed or returned no results
    if not articles and source == "bleepingcomputer":
        articles = await scrape_html_bleepingcomputer(limit)
    elif not articles and source == "gbhackers":
        articles = await scrape_html_gbhackers(limit)

    # Limit results
    articles = articles[:limit]

    # Fetch full content for articles if needed
    if fetch_full_content:
        for i, article in enumerate(articles):
            if not article.get("content") or len(article["content"]) < 200:
                full_content = await fetch_article_content(article["url"])
                if full_content:
                    articles[i]["content"] = full_content
                # Small delay to avoid rate limiting
                await asyncio.sleep(0.5)

    return articles


async def scrape_all_sources(limit_per_source: int = 15, fetch_full_content: bool = True) -> List[Dict]:
    """Scrape articles from all configured sources."""
    all_articles = []

    for source in RSS_FEEDS.keys():
        articles = await scrape_source(source, limit_per_source, fetch_full_content)
        all_articles.extend(articles)

    # Sort by date (newest first)
    all_articles.sort(key=lambda x: x.get("date_obj", datetime.min.replace(tzinfo=timezone.utc)), reverse=True)

    # Remove date_obj (not JSON serializable)
    for article in all_articles:
        article.pop("date_obj", None)

    return all_articles
