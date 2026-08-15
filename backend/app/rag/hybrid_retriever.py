import logging
from typing import List, Dict, Any
from app.rag.qdrant_store import qdrant_store
from app.rag.bm25_retriever import bm25_retriever

logger = logging.getLogger(__name__)

class HybridRetriever:
    def __init__(self, rrf_k: int = 60):
        self.rrf_k = rrf_k

    def sync_bm25_from_qdrant(self):
        """
        Synchronizes the BM25 index with documents currently stored in Qdrant.
        """
        payloads = qdrant_store.get_all_payloads()
        bm25_retriever.index_documents(payloads)
        logger.info(f"BM25 index synchronized with {len(payloads)} documents from Qdrant.")

    async def search(self, query: str, top_k: int = 4, alpha: float = 0.5) -> List[Dict[str, Any]]:
        """
        Executes Hybrid Search:
        1. Dense Vector Search via Qdrant
        2. Sparse Lexical Search via BM25
        3. Reciprocal Rank Fusion (RRF) to merge and rerank
        """
        # Ensure BM25 has data
        if not bm25_retriever.documents:
            self.sync_bm25_from_qdrant()

        # 1. Vector Dense Search
        dense_results = await qdrant_store.similarity_search(query, top_k=top_k * 2)

        # 2. BM25 Sparse Search
        sparse_results = bm25_retriever.search(query, top_k=top_k * 2)

        # 3. Reciprocal Rank Fusion (RRF)
        # RRF Score = sum( 1 / (k + rank_i) )
        doc_scores: Dict[str, Dict[str, Any]] = {}

        for rank, doc in enumerate(dense_results):
            cid = doc["chunk_id"]
            rrf_score = 1.0 / (self.rrf_k + rank + 1)
            if cid not in doc_scores:
                doc_scores[cid] = {"doc": doc, "dense_rank": rank + 1, "sparse_rank": None, "score": 0.0}
            doc_scores[cid]["score"] += rrf_score * (1 - alpha)

        for rank, doc in enumerate(sparse_results):
            cid = doc["chunk_id"]
            rrf_score = 1.0 / (self.rrf_k + rank + 1)
            if cid not in doc_scores:
                doc_scores[cid] = {"doc": doc, "dense_rank": None, "sparse_rank": rank + 1, "score": 0.0}
            doc_scores[cid]["score"] += rrf_score * alpha

        # Sort combined results by fusion score
        ranked = sorted(doc_scores.values(), key=lambda x: x["score"], reverse=True)

        final_chunks = []
        for item in ranked[:top_k]:
            doc = dict(item["doc"])
            doc["fusion_score"] = round(item["score"], 4)
            doc["retrieval_types"] = []
            if item["dense_rank"] is not None:
                doc["retrieval_types"].append("Dense/Vector")
            if item["sparse_rank"] is not None:
                doc["retrieval_types"].append("BM25/Keyword")
            final_chunks.append(doc)

        return final_chunks

hybrid_retriever = HybridRetriever()
