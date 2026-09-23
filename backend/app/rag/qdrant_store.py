import os
import uuid
import logging
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models as rest_models
from app.config import settings
from app.rag.llm_client import llm_client

logger = logging.getLogger(__name__)

class QdrantVectorStore:
    def __init__(self):
        os.makedirs(settings.QDRANT_PATH, exist_ok=True)
        self.collection_name = settings.QDRANT_COLLECTION_NAME
        self.client = QdrantClient(path=settings.QDRANT_PATH)
        self.vector_size = 768 # Default size for nomic-embed-text / standard embeddings
        self._ensure_collection()

    def _ensure_collection(self):
        collections = self.client.get_collections().collections
        exists = any(c.name == self.collection_name for c in collections)
        if not exists:
            logger.info(f"Creating Qdrant collection: {self.collection_name}")
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=rest_models.VectorParams(
                    size=self.vector_size,
                    distance=rest_models.Distance.COSINE
                )
            )

    async def add_documents(self, chunks: List[Dict[str, Any]], category: str = "General", doc_title: str = "") -> int:
        """
        Embeds and stores document chunks in Qdrant with rich payload.
        """
        if not chunks:
            return 0

        texts = [chunk["text"] for chunk in chunks]
        embeddings = await llm_client.get_batch_embeddings(texts)

        # Check embedding dimension and adjust if needed
        if embeddings and len(embeddings[0]) != self.vector_size:
            self.vector_size = len(embeddings[0])
            try:
                self.client.delete_collection(self.collection_name)
            except Exception:
                pass
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=rest_models.VectorParams(
                    size=self.vector_size,
                    distance=rest_models.Distance.COSINE
                )
            )

        points = []
        for idx, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk["chunk_id"]))
            payload = {
                "chunk_id": chunk["chunk_id"],
                "text": chunk["text"],
                "page": chunk["page"],
                "source_file": chunk["source_file"],
                "document_title": doc_title or chunk["source_file"],
                "category": category,
            }
            points.append(
                rest_models.PointStruct(
                    id=point_id,
                    vector=emb,
                    payload=payload
                )
            )

        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )
        logger.info(f"Upserted {len(points)} chunks into Qdrant collection '{self.collection_name}'.")
        return len(points)

    def delete_documents_by_filename(self, filename: str) -> bool:
        """
        Deletes all vector points associated with a specific document source file.
        """
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=rest_models.FilterSelector(
                    filter=rest_models.Filter(
                        must=[
                            rest_models.FieldCondition(
                                key="source_file",
                                match=rest_models.MatchValue(value=filename)
                            )
                        ]
                    )
                )
            )
            logger.info(f"Deleted vector points for source file '{filename}' from Qdrant.")
            return True
        except Exception as e:
            logger.error(f"Error deleting document '{filename}' from Qdrant: {e}")
            return False

    async def similarity_search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Performs dense semantic vector search in Qdrant.
        """
        query_vector = await llm_client.get_embedding(query)
        
        # Verify vector size matches collection
        if len(query_vector) != self.vector_size:
            if len(query_vector) < self.vector_size:
                query_vector = query_vector + [0.0] * (self.vector_size - len(query_vector))
            else:
                query_vector = query_vector[:self.vector_size]

        results = []
        try:
            # In Qdrant client 1.10+, query_points is the standard API
            if hasattr(self.client, "query_points"):
                response = self.client.query_points(
                    collection_name=self.collection_name,
                    query=query_vector,
                    limit=top_k,
                    with_payload=True
                )
                points = response.points if hasattr(response, "points") else response
                for item in points:
                    payload = item.payload or {}
                    results.append({
                        "chunk_id": payload.get("chunk_id"),
                        "text": payload.get("text"),
                        "page": payload.get("page"),
                        "source_file": payload.get("source_file"),
                        "document_title": payload.get("document_title"),
                        "category": payload.get("category"),
                        "score": float(getattr(item, "score", 1.0))
                    })
            elif hasattr(self.client, "search"):
                search_results = self.client.search(
                    collection_name=self.collection_name,
                    query_vector=query_vector,
                    limit=top_k
                )
                for item in search_results:
                    results.append({
                        "chunk_id": item.payload.get("chunk_id"),
                        "text": item.payload.get("text"),
                        "page": item.payload.get("page"),
                        "source_file": item.payload.get("source_file"),
                        "document_title": item.payload.get("document_title"),
                        "category": item.payload.get("category"),
                        "score": float(item.score)
                    })
        except Exception as e:
            logger.error(f"Error during Qdrant search: {e}")

        return results

    def get_all_payloads(self) -> List[Dict[str, Any]]:
        """
        Retrieve all stored chunk payloads (used for rebuilding BM25 index).
        """
        try:
            records, _ = self.client.scroll(
                collection_name=self.collection_name,
                limit=10000,
                with_payload=True,
                with_vectors=False
            )
            return [r.payload for r in records if r.payload]
        except Exception as e:
            logger.warning(f"Error fetching payloads from Qdrant: {e}")
            return []

    def clear(self):
        try:
            self.client.delete_collection(self.collection_name)
            self._ensure_collection()
        except Exception as e:
            logger.warning(f"Error clearing Qdrant collection: {e}")

qdrant_store = QdrantVectorStore()
