import re
import logging
from typing import List, Dict, Any
from app.prompts.rag_prompt import prompt_orchestrator
from app.services.gemini_client import GeminiClient

logger = logging.getLogger(__name__)

class GenerationService:
    def __init__(self, gemini_client: GeminiClient = None):
        self.gemini_client = gemini_client or GeminiClient()

    def generate_answer(
        self,
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        chat_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Orchestrates RAG text generation:
        1. Formats dynamic system prompt with retrieval context.
        2. Queries the Gemini model.
        3. Parses response text for page citations and extracts source grounding text.
        
        Returns a dict: {"answer": str, "citations": List[Dict]}
        """
        logger.info(f"Generating grounded response for query: '{query}'")
        try:
            # 1. Format prompt
            system_instruction = prompt_orchestrator.get_system_prompt(retrieved_chunks)
            
            # 2. Get Gemini response text
            raw_answer = self.gemini_client.generate_response(
                system_instruction=system_instruction,
                chat_history=chat_history,
                query=query
            )
            
            # 3. Resolve citations by mapping [Page X] markers to retrieved context text
            resolved_citations = self._resolve_citations_from_text(raw_answer, retrieved_chunks)
            
            return {
                "answer": raw_answer,
                "citations": resolved_citations
            }
            
        except Exception as e:
            logger.error(f"Error in GenerationService: {str(e)}", exc_info=True)
            raise RuntimeError(f"Grounded generation layer failure: {str(e)}")

    def _resolve_citations_from_text(
        self,
        answer_text: str,
        retrieved_chunks: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Parses text for page citations like [Page 3] or [Page 4, Page 5].
        Maps the page number back to retrieved context chunks to verify and extract
        the exact source text.
        """
        # Regex to find tags like [Page 4] or [Page 4, 5] or [Page 4, Page 5]
        # Match standard page tags
        matches = re.findall(r'\[Page\s*(\d+(?:\s*,\s*\d+)*)\]', answer_text, re.IGNORECASE)
        
        pages_referenced = set()
        for match in matches:
            # Match can be "4" or "4, 5" or "4,5"
            parts = re.split(r'\s*,\s*', match)
            for part in parts:
                if part.isdigit():
                    pages_referenced.add(int(part))
        
        logger.info(f"Answer referenced pages: {pages_referenced}")
        
        resolved_citations = []
        citation_counter = 1
        
        # Build citations mapping
        for page_num in sorted(pages_referenced):
            # Find retrieved chunks for this page
            matching_chunks = [c for c in retrieved_chunks if c.get("page") == page_num]
            
            if matching_chunks:
                # Merge the texts of matching chunks for this page to represent the source citation
                source_text = " ... ".join([c.get("text", "").strip() for c in matching_chunks])
                
                resolved_citations.append({
                    "citation_id": f"cite_{citation_counter}",
                    "page": page_num,
                    "text": source_text
                })
                citation_counter += 1
            else:
                # Fallback: page is referenced but not explicitly found in top retrieved chunks
                # We still note it, but flag that direct snippet text is unavailable
                resolved_citations.append({
                    "citation_id": f"cite_{citation_counter}",
                    "page": page_num,
                    "text": "[Grounding text not found in local context cache]"
                })
                citation_counter += 1
                
        return resolved_citations
