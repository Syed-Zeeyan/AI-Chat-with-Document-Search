import os
import logging
from typing import List, Dict, Any
import chromadb
from app.core.config import settings

logger = logging.getLogger(__name__)

class VectorStoreService:
    def __init__(self):
        logger.info(f"Initializing ChromaDB persistent client at path: {settings.CHROMA_PERSIST_DIR}")
        try:
            # Ensure path exists
            os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
            self.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
            self.collection = self.client.get_or_create_collection(
                name="pdf_documents",
                metadata={"hnsw:space": "cosine"} # Use cosine similarity for text comparison
            )
            logger.info("ChromaDB persistent client successfully initialized.")
        except Exception as e:
            logger.critical(f"Failed to initialize ChromaDB client: {str(e)}", exc_info=True)
            raise RuntimeError(f"ChromaDB initialization failure: {str(e)}")

    def add_chunks(
        self,
        ids: List[str],
        embeddings: List[List[float]],
        documents: List[str],
        metadatas: List[Dict[str, Any]]
    ) -> bool:
        """
        Adds or updates a batch of text chunks, embeddings, and associated metadata.
        """
        try:
            # chroma.add takes care of persisting the write
            self.collection.upsert(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas
            )
            logger.info(f"Successfully upserted {len(ids)} chunks to ChromaDB.")
            return True
        except Exception as e:
            logger.error(f"Error upserting chunks to ChromaDB: {str(e)}", exc_info=True)
            raise RuntimeError(f"Failed to write vector store entries: {str(e)}")

    def query_similarity(
        self,
        query_embedding: List[float],
        document_id: str,
        limit: int = 4
    ) -> List[Dict[str, Any]]:
        """
        Queries ChromaDB for similar chunks belonging to a specific document ID.
        Returns a list of structured dictionaries with metadata and scores.
        """
        try:
            # Query chroma collection using metadata filtering on document_id
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=limit,
                where={"document_id": document_id}
            )

            formatted_results = []
            if not results or "ids" not in results or not results["ids"][0]:
                return formatted_results

            # ChromaDB returns nested arrays for batch queries; we fetch the 0th item since query count = 1
            ids = results["ids"][0]
            documents = results["documents"][0]
            metadatas = results["metadatas"][0]
            # ChromaDB returns distance scores (Cosine distance is 1 - CosineSimilarity)
            # A score closer to 0 means higher similarity (i.e. distance is low)
            distances = results["distances"][0] if "distances" in results else [0.0] * len(ids)

            for i in range(len(ids)):
                formatted_results.append({
                    "chunk_id": ids[i],
                    "text": documents[i],
                    "page": metadatas[i].get("page_number", 1),
                    "score": round(1.0 - distances[i], 4), # Convert cosine distance to cosine similarity
                    "metadata": metadatas[i]
                })

            # Sort by similarity score descending
            formatted_results.sort(key=lambda x: x["score"], reverse=True)
            return formatted_results

        except Exception as e:
            logger.error(f"Error querying ChromaDB: {str(e)}", exc_info=True)
            raise RuntimeError(f"Vector store search failure: {str(e)}")

    def delete_document(self, document_id: str) -> bool:
        """
        Removes all chunks associated with a specific document ID.
        """
        try:
            self.collection.delete(where={"document_id": document_id})
            logger.info(f"Successfully deleted all chunks for document_id: {document_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting document {document_id} from ChromaDB: {str(e)}", exc_info=True)
            raise RuntimeError(f"Failed to clear document vectors: {str(e)}")

    def is_connected(self) -> bool:
        """
        Validates ChromaDB client is accessible.
        """
        try:
            # Try to query total collections count as a lightweight heart-beat
            self.client.heartbeat()
            return True
        except Exception:
            return False
