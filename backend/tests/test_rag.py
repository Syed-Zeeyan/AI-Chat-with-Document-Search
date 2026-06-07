import unittest
from unittest.mock import MagicMock, patch
import pytest
from app.services.text_splitter import RecursiveCharacterTextSplitter
from app.services.embedding_engine import EmbeddingEngine
from app.services.vector_store import VectorStoreService
from app.services.pdf_parser import PDFParserService

def test_text_splitter_basic():
    """
    Checks that the custom recursive text splitter outputs expected chunks and retains metadata.
    """
    text = "Hello world! This is a simple test text chunker. " * 30
    splitter = RecursiveCharacterTextSplitter(chunk_size=100, chunk_overlap=20)
    
    chunks = splitter.split_page(text, page_number=1)
    
    assert len(chunks) > 0
    for chunk in chunks:
        assert chunk["page_number"] == 1
        assert len(chunk["text"]) <= 100
        assert "text" in chunk
        assert "chunk_index" in chunk

def test_text_splitter_page_awareness():
    """
    Checks that text splitting isolates boundaries to their respective pages.
    """
    page_1_text = "Content of first page."
    page_2_text = "Content of second page."
    
    splitter = RecursiveCharacterTextSplitter(chunk_size=50, chunk_overlap=10)
    
    chunks_1 = splitter.split_page(page_1_text, page_number=1)
    chunks_2 = splitter.split_page(page_2_text, page_number=2)
    
    assert len(chunks_1) == 1
    assert chunks_1[0]["page_number"] == 1
    assert chunks_1[0]["text"] == "Content of first page."
    
    assert len(chunks_2) == 1
    assert chunks_2[0]["page_number"] == 2
    assert chunks_2[0]["text"] == "Content of second page."

@patch('app.services.embedding_engine.SentenceTransformer')
def test_embedding_engine_initialization(mock_sentence_transformer):
    """
    Validates that the EmbeddingEngine properly instantiates the HuggingFace model.
    """
    mock_instance = MagicMock()
    mock_sentence_transformer.return_value = mock_instance
    
    # Reload singleton instance or mock construction
    engine = EmbeddingEngine(model_name="all-MiniLM-L6-v2")
    assert engine.is_model_loaded() is True

@patch('app.services.vector_store.chromadb.PersistentClient')
def test_vector_store_service(mock_chroma_client):
    """
    Verifies that the VectorStoreService interacts correctly with the ChromaDB collection.
    """
    mock_client_instance = MagicMock()
    mock_collection = MagicMock()
    mock_chroma_client.return_value = mock_client_instance
    mock_client_instance.get_or_create_collection.return_value = mock_collection
    
    store = VectorStoreService()
    
    # Test add chunks
    store.add_chunks(
        ids=["doc1_chunk_0"],
        embeddings=[[0.1] * 384],
        documents=["text block"],
        metadatas=[{"document_id": "doc1", "page_number": 1}]
    )
    
    mock_collection.upsert.assert_called_once()
    
    # Test query
    mock_collection.query.return_value = {
        "ids": [["doc1_chunk_0"]],
        "documents": [["text block"]],
        "metadatas": [[{"document_id": "doc1", "page_number": 1}]],
        "distances": [[0.1]]
    }
    
    results = store.query_similarity(
        query_embedding=[0.1] * 384,
        document_id="doc1",
        limit=1
    )
    
    assert len(results) == 1
    assert results[0]["chunk_id"] == "doc1_chunk_0"
    assert results[0]["score"] == 0.9 # 1.0 - 0.1
    assert results[0]["page"] == 1
