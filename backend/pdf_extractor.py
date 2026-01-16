"""
PDF text extraction utilities for threat intelligence reports.
"""

import io
from typing import Optional
from datetime import datetime, timezone

# Try multiple PDF libraries for best compatibility
try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

try:
    from PyPDF2 import PdfReader
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False


def extract_text_with_pdfplumber(file_bytes: bytes) -> str:
    """Extract text using pdfplumber (better for complex layouts)."""
    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n\n".join(text_parts)


def extract_text_with_pypdf2(file_bytes: bytes) -> str:
    """Extract text using PyPDF2 (fallback)."""
    reader = PdfReader(io.BytesIO(file_bytes))
    text_parts = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text)
    return "\n\n".join(text_parts)


def extract_pdf_text(file_bytes: bytes) -> Optional[str]:
    """
    Extract text from PDF file bytes.
    Tries multiple libraries for best results.
    """
    text = None

    # Try pdfplumber first (better quality)
    if HAS_PDFPLUMBER:
        try:
            text = extract_text_with_pdfplumber(file_bytes)
            if text and len(text.strip()) > 100:
                return text
        except Exception as e:
            print(f"pdfplumber extraction failed: {e}")

    # Fallback to PyPDF2
    if HAS_PYPDF2:
        try:
            text = extract_text_with_pypdf2(file_bytes)
            if text:
                return text
        except Exception as e:
            print(f"PyPDF2 extraction failed: {e}")

    return text


def process_pdf_upload(filename: str, file_bytes: bytes) -> dict:
    """
    Process an uploaded PDF and return structured data.
    """
    text = extract_pdf_text(file_bytes)

    if not text:
        return {
            "success": False,
            "error": "Failed to extract text from PDF",
            "filename": filename,
        }

    # Create a basic summary (first 500 chars)
    summary = text[:500].strip()
    if len(text) > 500:
        summary += "..."

    return {
        "success": True,
        "filename": filename,
        "text": text,
        "summary": summary,
        "char_count": len(text),
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
    }
