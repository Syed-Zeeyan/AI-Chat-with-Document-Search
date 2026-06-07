from pydantic import BaseModel, Field
from typing import List, Dict, Any

class DocumentUploadResponse(BaseModel):
    status: str = Field(..., description="Success or failure status")
    document_id: str = Field(..., description="Unique generated UUID for the document")
    file_name: str = Field(..., description="Name of the uploaded PDF file")
    file_size_bytes: int = Field(..., description="Size of the file in bytes")
    total_pages: int = Field(..., description="Total pages extracted from the PDF")
    total_chunks: int = Field(..., description="Total database chunks generated")
    created_at: str = Field(..., description="Ingestion ISO timestamp")

class ChatHistoryMessage(BaseModel):
    role: str = Field(..., description="Role of the sender: 'user' or 'model'")
    content: str = Field(..., description="Text content of the message")

class ChatMessageRequest(BaseModel):
    message: str = Field(..., description="The user's query question")
    document_id: str = Field(..., description="The unique ID of the document to chat with")
    history: List[ChatHistoryMessage] = Field(default=[], description="List of previous messages in the chat session")

class CitationResponse(BaseModel):
    citation_id: str = Field(..., description="Unique inline citation identifier")
    page: int = Field(..., description="1-indexed page number of the source document")
    text: str = Field(..., description="Exact context text snippet of the source")

class RetrievedChunkResponse(BaseModel):
    chunk_id: str = Field(..., description="ChromaDB unique chunk identifier")
    score: float = Field(..., description="Distance similarity score (lower is closer / higher similarity depends on metric)")
    page: int = Field(..., description="Source page number")
    text: str = Field(..., description="Retrieved chunk text content")

class ChatAnswerResponse(BaseModel):
    answer: str = Field(..., description="Synthesized answer text from Gemini API")
    citations: List[CitationResponse] = Field(..., description="Grounded citations referenced in the response")
    retrieved_chunks: List[RetrievedChunkResponse] = Field(..., description="Raw retrieval matches for debug/developer view")

class HealthServicesStatus(BaseModel):
    chroma_db: str
    embedding_model: str
    gemini_api: str

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: HealthServicesStatus
