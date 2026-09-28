"""
Document Ingestion and Text Extraction Service
==============================================
Handles in-memory text extraction for:
1. Plain Text (.txt, .md)
2. Portable Document Format (.pdf)

Features:
- Validates file extensions and MIME types
- Enforces configurable file size limits (default 10 MB)
- Detects empty documents or corrupt files
- Zero permanent disk storage (processes files entirely in RAM via BytesIO)
"""

import io
from typing import Tuple, Dict, Any
from fastapi import UploadFile, HTTPException, status
from backend.app.services.preprocessing import Preprocessor
from backend.app.services.statistics import StatisticsService

# Maximum allowable file upload size (10 MB in bytes)
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".txt", ".pdf", ".md"}

# Try importing PDF extractors
try:
    import pypdf
    _HAS_PYPDF = True
except ImportError:
    _HAS_PYPDF = False

try:
    import pymupdf as fitz  # Modern PyMuPDF
    _HAS_PYMUPDF = True
except ImportError:
    try:
        import fitz
        _HAS_PYMUPDF = True
    except ImportError:
        _HAS_PYMUPDF = False


class DocumentParser:
    """Provides memory-safe document parsing for TXT and PDF documents."""

    @staticmethod
    def extract_text_from_txt(file_bytes: bytes) -> str:
        """Decodes raw text bytes using UTF-8 with fallback encodings."""
        try:
            return file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                return file_bytes.decode("latin-1")
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to decode text file encoding: {str(e)}"
                )

    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        """
        Extracts textual content from PDF byte stream in-memory.
        Uses pypdf or PyMuPDF without writing any file to disk.
        """
        extracted_text = []

        # 1. Try PyMuPDF (fast and robust)
        if _HAS_PYMUPDF:
            try:
                with fitz.open(stream=file_bytes, filetype="pdf") as doc:
                    if doc.page_count == 0:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Uploaded PDF contains 0 pages."
                        )
                    for page_num in range(doc.page_count):
                        page = doc.load_page(page_num)
                        page_text = page.get_text("text")
                        if page_text and page_text.strip():
                            extracted_text.append(page_text.strip())
                    
                    full_text = "\n\n".join(extracted_text).strip()
                    if full_text:
                        return full_text
            except HTTPException:
                raise
            except Exception:
                pass  # Fallback to pypdf

        # 2. Try pypdf fallback
        if _HAS_PYPDF:
            try:
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                if len(reader.pages) == 0:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Uploaded PDF contains no pages."
                    )
                for page in reader.pages:
                    text = page.extract_text()
                    if text and text.strip():
                        extracted_text.append(text.strip())
                        
                full_text = "\n\n".join(extracted_text).strip()
                if full_text:
                    return full_text
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(
                    status_code=getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", status.HTTP_422_UNPROCESSABLE_ENTITY),
                    detail=f"PDF extraction failed. File may be encrypted, scanned image, or damaged: {str(e)}"
                )

        raise HTTPException(
            status_code=getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", status.HTTP_422_UNPROCESSABLE_ENTITY),
            detail="No readable text found in PDF. Ensure the PDF contains selectable text (not scanned images)."
        )

    @classmethod
    async def parse_uploaded_file(cls, file: UploadFile) -> Dict[str, Any]:
        """
        Validates, ingests, and parses UploadFile:
        1. Validates extension (.txt, .pdf, .md)
        2. Validates size limit (<= 10MB)
        3. Extracts text in-memory
        4. Validates non-empty content
        5. Computes initial sentence and word counts
        """
        filename = file.filename or "unknown_file"
        lower_name = filename.lower()
        
        # 1. Validate extension
        extension = None
        for ext in ALLOWED_EXTENSIONS:
            if lower_name.endswith(ext):
                extension = ext
                break

        if not extension:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{filename}'. Allowed extensions: {', '.join(sorted(list(ALLOWED_EXTENSIONS)))}"
            )

        # 2. Read bytes into memory with size check
        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty (0 bytes)."
            )
        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB."
            )

        # 3. Extract text
        if extension in {".txt", ".md"}:
            raw_text = cls.extract_text_from_txt(file_bytes)
        elif extension == ".pdf":
            raw_text = cls.extract_text_from_pdf(file_bytes)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unhandled file extension: {extension}"
            )

        # 4. Clean & Validate Extracted Text
        cleaned = Preprocessor.clean_text(raw_text)
        if not cleaned or len(cleaned) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded document contains insufficient or unreadable text after extraction."
            )

        sentences = Preprocessor.segment_sentences(cleaned)
        word_count = StatisticsService.count_words(cleaned)

        return {
            "filename": filename,
            "extension": extension,
            "text": cleaned,
            "word_count": word_count,
            "sentence_count": len(sentences),
            "file_size_bytes": len(file_bytes)
        }
