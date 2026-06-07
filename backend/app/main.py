import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.services.embedding_engine import EmbeddingEngine
from app.services.vector_store import VectorStoreService

# Set up logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Asynchronous lifespan manager handling startup and shutdown behaviors:
    - Pre-loads HuggingFace sentence-transformers locally during container boot
    - Warm up connections to ChromaDB persistence
    """
    logger.info("Initializing system services on startup...")
    try:
        # Pre-load local embedding model to memory
        EmbeddingEngine()
        # Ping ChromaDB to verify schema is ready
        VectorStoreService()
        logger.info("Startup complete. All microservices are ready.")
    except Exception as e:
        logger.critical(f"System startup crash: {str(e)}", exc_info=True)
        # Note: we let it boot to allow logging, but endpoints will report degraded health
    
    yield
    
    logger.info("Shutting down application...")

# Initialize FastAPI with metadata
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach aggregate routing
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the AI Chat with Document Search API",
        "docs_url": "/docs",
        "health_check": f"{settings.API_V1_STR}/health"
    }
