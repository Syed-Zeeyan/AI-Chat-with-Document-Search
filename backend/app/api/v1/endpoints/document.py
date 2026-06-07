import uuid
from datetime import datetime
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.models.schemas import DocumentUploadResponse
from app.services.pdf_parser import PDFParserService
from app.services.text_splitter import RecursiveCharacterTextSplitter
from app.services.embedding_engine import EmbeddingEngine
from app.services.vector_store import VectorStoreService

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(file: UploadFile = File(...)):
    """
    Handles PDF document ingestion:
    1. Validates file signature (must be application/pdf).
    2. Extracts clean text page-by-page.
    3. Splits text using a page-aware Recursive Character Splitter.
    4. Generates batch vector embeddings using local sentence-transformers.
    5. Persists vectors and metadata filters in ChromaDB.
    """
    # 1. Validate file format
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF documents are allowed."
        )
        
    try:
        file_bytes = await file.read()
        file_size = len(file_bytes)
        
        # Guard against zero-byte files
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty file uploaded."
            )
            
        # 2. Extract text page-by-page
        pages_data = PDFParserService.extract_text_by_page(file_bytes)
        total_pages = len(pages_data)
        
        if total_pages == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to extract text from the PDF. The file may be empty or encrypted."
            )
            
        # 3. Chunk text per page to maintain citation boundaries
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        all_chunks = []
        for page in pages_data:
            chunks = splitter.split_page(page["text"], page["page"])
            all_chunks.extend(chunks)
            
        total_chunks = len(all_chunks)
        if total_chunks == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No readable text chunks could be parsed from the PDF."
            )

        # Generate unique document ID
        document_id = str(uuid.uuid4())
        
        # 4. Prepare data for embeddings & vector store
        chunk_texts = [c["text"] for c in all_chunks]
        
        # Batch generate embeddings locally (CPU-optimized)
        embedding_engine = EmbeddingEngine()
        embeddings = embedding_engine.get_embeddings(chunk_texts)
        
        # Prepare vectors schema structures
        ids = []
        metadatas = []
        for idx, chunk in enumerate(all_chunks):
            chunk_id = f"{document_id}_chunk_{idx}"
            ids.append(chunk_id)
            metadatas.append({
                "document_id": document_id,
                "file_name": file.filename,
                "page_number": chunk["page_number"],
                "chunk_index": chunk["chunk_index"]
            })
            
        # 5. Insert into ChromaDB persistent index
        vector_store = VectorStoreService()
        vector_store.add_chunks(
            ids=ids,
            embeddings=embeddings,
            documents=chunk_texts,
            metadatas=metadatas
        )
        
        logger.info(f"Ingested file: {file.filename} (Size: {file_size} bytes), document_id: {document_id}")
        
        return DocumentUploadResponse(
            status="success",
            document_id=document_id,
            file_name=file.filename,
            file_size_bytes=file_size,
            total_pages=total_pages,
            total_chunks=total_chunks,
            created_at=datetime.utcnow().isoformat() + "Z"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ingestion pipeline crash: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during document ingestion: {str(e)}"
        )
