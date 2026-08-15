import os
import re
from typing import List, Dict, Any
from pypdf import PdfReader

class DocumentProcessor:
    @staticmethod
    def extract_text_from_file(file_path: str) -> List[Dict[str, Any]]:
        """
        Extracts text from PDF, TXT, MD files with page/section numbers.
        Returns a list of dicts: [{"text": ..., "page": int, "source": file_path}]
        """
        ext = os.path.splitext(file_path)[1].lower()
        pages_content = []

        if ext == ".pdf":
            reader = PdfReader(file_path)
            for idx, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                cleaned = DocumentProcessor.clean_text(text)
                if cleaned:
                    pages_content.append({
                        "text": cleaned,
                        "page": idx + 1,
                        "source": os.path.basename(file_path)
                    })
        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            cleaned = DocumentProcessor.clean_text(content)
            if cleaned:
                pages_content.append({
                    "text": cleaned,
                    "page": 1,
                    "source": os.path.basename(file_path)
                })

        return pages_content

    @staticmethod
    def clean_text(text: str) -> str:
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    @staticmethod
    def chunk_documents(pages: List[Dict[str, Any]], chunk_size: int = 500, overlap: int = 80) -> List[Dict[str, Any]]:
        """
        Splits pages into overlapping chunks while preserving metadata.
        """
        chunks = []
        chunk_id = 0

        for page_data in pages:
            text = page_data["text"]
            page_num = page_data["page"]
            source = page_data["source"]

            words = text.split(" ")
            if not words:
                continue

            i = 0
            while i < len(words):
                chunk_words = words[i : i + chunk_size]
                chunk_text = " ".join(chunk_words)

                if len(chunk_text.strip()) > 30:
                    chunks.append({
                        "chunk_id": f"{source}_p{page_num}_c{chunk_id}",
                        "text": chunk_text,
                        "page": page_num,
                        "source_file": source,
                        "token_estimate": len(chunk_words)
                    })
                    chunk_id += 1

                if i + chunk_size >= len(words):
                    break
                i += (chunk_size - overlap)

        return chunks
