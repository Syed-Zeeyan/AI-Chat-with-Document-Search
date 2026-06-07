import logging
from typing import List
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

class EmbeddingEngine:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(EmbeddingEngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        if self._initialized:
            return
        
        logger.info(f"Initializing EmbeddingEngine with local model: {model_name}...")
        try:
            # sentence-transformers will load the model from cache or download it on first boot
            self.model = SentenceTransformer(model_name)
            self._initialized = True
            logger.info("EmbeddingEngine successfully initialized.")
        except Exception as e:
            logger.critical(f"Failed to load embedding model: {str(e)}", exc_info=True)
            raise RuntimeError(f"Could not load local embedding model: {str(e)}")

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generates dense vector embeddings for a list of string blocks.
        Outputs 384-dimensional list of floats for each string.
        """
        try:
            embeddings = self.model.encode(texts, convert_to_numpy=True)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {str(e)}", exc_info=True)
            raise RuntimeError(f"Embedding generation error: {str(e)}")

    def get_query_embedding(self, query: str) -> List[float]:
        """
        Generates a dense vector embedding for a query.
        """
        try:
            embedding = self.model.encode(query, convert_to_numpy=True)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Failed to generate query embedding: {str(e)}", exc_info=True)
            raise RuntimeError(f"Query embedding generation error: {str(e)}")
            
    def is_model_loaded(self) -> bool:
        return self._initialized
