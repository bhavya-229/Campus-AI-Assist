import re
from typing import List, Dict, Any
from rank_bm25 import BM25Okapi

class BM25KeywordRetriever:
    def __init__(self):
        self.bm25: BM25Okapi = None
        self.documents: List[Dict[str, Any]] = []

    def tokenize(self, text: str) -> List[str]:
        # Lowercase and split on non-alphanumeric words/tokens
        tokens = re.findall(r'\b\w+\b', text.lower())
        return tokens

    def index_documents(self, documents: List[Dict[str, Any]]):
        """
        Builds the BM25 index from a list of document chunk payloads.
        Each document must contain 'text', 'chunk_id', 'source_file', etc.
        """
        self.documents = documents
        if not documents:
            self.bm25 = None
            return

        tokenized_corpus = [self.tokenize(doc["text"]) for doc in documents]
        self.bm25 = BM25Okapi(tokenized_corpus)

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Searches the BM25 sparse index and returns top-k ranked chunks.
        """
        if not self.bm25 or not self.documents:
            return []

        query_tokens = self.tokenize(query)
        if not query_tokens:
            return []

        doc_scores = self.bm25.get_scores(query_tokens)
        
        # Sort indices by score descending
        sorted_indices = sorted(range(len(doc_scores)), key=lambda i: doc_scores[i], reverse=True)
        
        results = []
        for idx in sorted_indices[:top_k]:
            score = float(doc_scores[idx])
            if score > 0.0:
                doc = dict(self.documents[idx])
                doc["score"] = score
                results.append(doc)

        return results

bm25_retriever = BM25KeywordRetriever()
