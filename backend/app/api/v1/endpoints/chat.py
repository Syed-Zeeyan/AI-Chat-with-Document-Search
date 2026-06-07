import logging
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import ChatMessageRequest, ChatAnswerResponse, CitationResponse, RetrievedChunkResponse
from app.services.retrieval_service import RetrievalService
from app.services.generation_service import GenerationService

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("", response_model=ChatAnswerResponse)
def chat_with_document(payload: ChatMessageRequest):
    """
    Executes conversational queries against an indexed document:
    1. Retreives top 4 matching text contexts from ChromaDB via RetrievalService.
    2. Constructs grounded prompt + invokes Gemini via GenerationService.
    3. Resolves and returns citations and retrieval debug logs.
    """
    logger.info(f"Received chat request for document: {payload.document_id}")
    try:
        # 1. Retrieve context chunks
        retrieval_service = RetrievalService()
        retrieved_chunks = retrieval_service.retrieve_relevant_context(
            query=payload.message,
            document_id=payload.document_id,
            limit=4
        )

        if not retrieved_chunks:
            # We don't fail, but let the LLM know there's no context, which triggers the fallback reply.
            logger.warning(f"No document chunks found in database for document: {payload.document_id}")
            
        # Convert Pydantic history objects back to dict list for service processing
        history_list = [{"role": msg.role, "content": msg.content} for msg in payload.history]

        # 2. Generate grounded response and citations
        generation_service = GenerationService()
        rag_output = generation_service.generate_answer(
            query=payload.message,
            retrieved_chunks=retrieved_chunks,
            chat_history=history_list
        )

        # 3. Format response lists
        response_citations = [
            CitationResponse(
                citation_id=c["citation_id"],
                page=c["page"],
                text=c["text"]
            )
            for c in rag_output["citations"]
        ]

        response_chunks = [
            RetrievedChunkResponse(
                chunk_id=chunk["chunk_id"],
                score=chunk["score"],
                page=chunk["page"],
                text=chunk["text"]
            )
            for chunk in retrieved_chunks
        ]

        return ChatAnswerResponse(
            answer=rag_output["answer"],
            citations=response_citations,
            retrieved_chunks=response_chunks
        )

    except Exception as e:
        logger.error(f"Chat execution controller crash: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during conversational RAG inference: {str(e)}"
        )
