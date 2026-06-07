from fastapi import APIRouter
from datetime import datetime
from app.models.schemas import HealthResponse, HealthServicesStatus
from app.services.vector_store import VectorStoreService
from app.services.embedding_engine import EmbeddingEngine
from app.services.gemini_client import GeminiClient

router = APIRouter()

@router.get("", response_model=HealthResponse)
def get_health():
    """
    Performs quick health diagnostics on core external and internal dependencies:
    - ChromaDB connection
    - sentence-transformers initialization
    - Gemini API credentials / connection
    """
    # Instantiate or reference singleton dependencies
    vector_store = VectorStoreService()
    embedding_engine = EmbeddingEngine()
    gemini_client = GeminiClient()

    chroma_ok = vector_store.is_connected()
    embed_ok = embedding_engine.is_model_loaded()
    gemini_ok = gemini_client.check_api_status()

    all_healthy = chroma_ok and embed_ok and gemini_ok
    status = "healthy" if all_healthy else "degraded"

    return HealthResponse(
        status=status,
        timestamp=datetime.utcnow().isoformat() + "Z",
        services=HealthServicesStatus(
            chroma_db="connected" if chroma_ok else "disconnected",
            embedding_model="loaded" if embed_ok else "uninitialized",
            gemini_api="available" if gemini_ok else "unavailable"
        )
    )
