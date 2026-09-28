"""
Unit & Integration Tests for Document Ingestion and Text Extraction (TXT & PDF)
==============================================================================
"""

import io
import unittest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.document_parser import DocumentParser

# Create a sample PDF in memory for testing
import fitz

client = TestClient(app)


class TestDocumentParser(unittest.TestCase):

    def setUp(self):
        # Create in-memory PDF sample with a proper bounding box
        doc = fitz.open()
        page = doc.new_page()
        self.sample_text = (
            "Extractive text summarization extracts existing sentences from documents. "
            "PDF document parsing enables seamless processing of academic papers and reports. "
            "Natural Language Processing algorithms compute mathematical importance scores."
        )
        rect = fitz.Rect(50, 50, 550, 750)
        page.insert_textbox(rect, self.sample_text)
        self.pdf_bytes = doc.write()
        doc.close()


    def test_extract_text_from_txt(self):
        txt_content = "This is a plain text file test. It contains multiple sentences for summarization."
        extracted = DocumentParser.extract_text_from_txt(txt_content.encode("utf-8"))
        self.assertEqual(extracted, txt_content)

    def test_extract_text_from_pdf(self):
        extracted = DocumentParser.extract_text_from_pdf(self.pdf_bytes)
        self.assertIn("Extractive text summarization", extracted)
        self.assertIn("PDF document parsing", extracted)
        self.assertIn("Natural Language Processing", extracted)


    def test_api_extract_document_txt(self):
        txt_data = "Natural Language Processing transforms unstructured text. Extractive methods preserve original sentences."
        files = {
            "file": ("sample.txt", io.BytesIO(txt_data.encode("utf-8")), "text/plain")
        }
        response = client.post("/api/extract_document", files=files)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["filename"], "sample.txt")
        self.assertEqual(data["extension"], ".txt")
        self.assertEqual(data["sentence_count"], 2)
        self.assertGreater(data["word_count"], 10)
        self.assertIn("Natural Language Processing", data["text"])

    def test_api_extract_document_pdf(self):
        files = {
            "file": ("research_paper.pdf", io.BytesIO(self.pdf_bytes), "application/pdf")
        }
        response = client.post("/api/extract_document", files=files)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["filename"], "research_paper.pdf")
        self.assertEqual(data["extension"], ".pdf")
        self.assertEqual(data["sentence_count"], 3)
        self.assertGreater(data["word_count"], 15)
        self.assertIn("Extractive text summarization", data["text"])

    def test_api_extract_document_unsupported_format(self):
        files = {
            "file": ("image.png", io.BytesIO(b"fake_image_bytes"), "image/png")
        }
        response = client.post("/api/extract_document", files=files)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Unsupported file format", response.json()["detail"])

    def test_api_extract_document_empty_file(self):
        files = {
            "file": ("empty.txt", io.BytesIO(b""), "text/plain")
        }
        response = client.post("/api/extract_document", files=files)
        self.assertEqual(response.status_code, 400)
        self.assertIn("empty", response.json()["detail"].lower())


if __name__ == "__main__":
    unittest.main()
