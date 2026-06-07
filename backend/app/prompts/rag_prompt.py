import os
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class RAGPromptOrchestrator:
    def __init__(self):
        self.prompt_dir = os.path.dirname(os.path.abspath(__file__))
        self.system_prompt_path = os.path.join(self.prompt_dir, "system_prompt.txt")
        self._system_prompt_template = None
        self._load_template()

    def _load_template(self):
        """
        Loads the system prompt from the system_prompt.txt file.
        Caches the template text in memory.
        """
        try:
            if not os.path.exists(self.system_prompt_path):
                logger.error(f"System prompt file not found at: {self.system_prompt_path}")
                # Fallback template
                self._system_prompt_template = (
                    "You are a factual AI assistant. Answer using only this context:\n{context}"
                )
                return
                
            with open(self.system_prompt_path, "r", encoding="utf-8") as f:
                self._system_prompt_template = f.read()
            logger.info("System prompt template successfully loaded from disk.")
        except Exception as e:
            logger.error(f"Error loading system prompt template: {str(e)}", exc_info=True)
            self._system_prompt_template = (
                "You are a factual AI assistant. Answer using only this context:\n{context}"
            )

    def get_system_prompt(self, retrieved_chunks: List[Dict[str, Any]]) -> str:
        """
        Formats the system prompt by inserting the formatted context blocks.
        """
        if not self._system_prompt_template:
            self._load_template()

        # Format context blocks
        context_blocks = []
        for idx, chunk in enumerate(retrieved_chunks):
            page = chunk.get("page", 1)
            text = chunk.get("text", "").strip()
            block = f"---\n[Source page: {page}]\n{text}\n---"
            context_blocks.append(block)

        formatted_context = "\n\n".join(context_blocks) if context_blocks else "No relevant context found."
        
        try:
            return self._system_prompt_template.format(context=formatted_context)
        except Exception as e:
            logger.error(f"Failed to format system prompt: {str(e)}", exc_info=True)
            # Fallback direct concatenation if formatting fails
            return f"Context:\n{formatted_context}\n\nAnswer rules: Cite [Page X] for facts."

# Global singleton instance for prompt formatting
prompt_orchestrator = RAGPromptOrchestrator()
