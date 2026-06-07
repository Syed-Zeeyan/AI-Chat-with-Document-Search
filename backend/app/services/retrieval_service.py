import logging
from typing import List, Dict, Any
from app.services.embedding_engine import EmbeddingEngine
from app.services.vector_store import VectorStoreService

logger = logging.getLogger(__name__)

class RetrievalService:
    def __init__(self, embedding_engine: EmbeddingEngine = None, vector_store: VectorStoreService = None):
        # Fallback to defaults if not provided (allows dependency injection or simple construction)
        self.embedding_engine = embedding_engine or EmbeddingEngine()
        self.vector_store = vector_store or VectorStoreService()

    def retrieve_relevant_context(
        self,
        query: str,
        document_id: str,
        limit: int = 8
    ) -> List[Dict[str, Any]]:
        """
        Coordinates context retrieval.
        1. Embeds query.
        2. Searches vector collection.
        3. Returns mapped chunk data structures.
        """
        logger.info(f"Retrieving context for document_id: {document_id}, query: '{query}'")
        try:
            # 1. Embed query
            query_embedding = self.embedding_engine.get_query_embedding(query)
            
            # 2. Query similarity
            raw_results = self.vector_store.query_similarity(
                query_embedding=query_embedding,
                document_id=document_id,
                limit=limit
            )
            
            logger.info(f"Retrieved {len(raw_results)} chunks from ChromaDB.")
            return raw_results
            
        except Exception as e:
            logger.error(f"Error in RetrievalService: {str(e)}", exc_info=True)
            raise RuntimeError(f"Context retrieval layer failure: {str(e)}")
