import logging
from typing import List, Dict, Any
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger(__name__)

class GeminiClient:
    def __init__(self):
        logger.info("Initializing Gemini API client (google.genai SDK)...")
        try:
            if not settings.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY environment variable is not set.")

            # New google.genai SDK uses a Client object instead of module-level configure()
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
            logger.info("Gemini Client successfully initialized.")
        except Exception as e:
            logger.critical(f"Failed to initialize Gemini Client: {str(e)}", exc_info=True)
            raise RuntimeError(f"Gemini API initialization failure: {str(e)}")

    def generate_response(
        self,
        system_instruction: str,
        chat_history: List[Dict[str, str]],
        query: str
    ) -> str:
        """
        Executes model invocation via the new google.genai SDK.
        Stateless: full conversation history is passed per request.
        """
        try:
            # Build content list from history + current query
            contents = []
            for msg in chat_history:
                role = "model" if msg.get("role") in ["model", "assistant"] else "user"
                contents.append(
                    types.Content(
                        role=role,
                        parts=[types.Part(text=msg.get("content", ""))]
                    )
                )

            # Append the current user query
            contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part(text=query)]
                )
            )

            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.1,       # Low temperature for factual grounding
                max_output_tokens=1024,
            )

            logger.info(
                f"Sending content generation request using model: {settings.GEMINI_MODEL}"
            )

            try:
                response = self.client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=contents,
                    config=config,
                )

            except Exception as primary_error:

                if "503" in str(primary_error) or "UNAVAILABLE" in str(primary_error):

                    logger.warning(
                        f"Primary model {settings.GEMINI_MODEL} unavailable. "
                        f"Retrying with fallback model {settings.GEMINI_FALLBACK_MODEL}"
                    )

                    response = self.client.models.generate_content(
                        model=settings.GEMINI_FALLBACK_MODEL,
                        contents=contents,
                        config=config,
                    )

                else:
                    raise primary_error

            if not response or not response.text:
                raise ValueError("Empty response received from Gemini API.")

            return response.text

        except Exception as e:
            logger.error(f"Error during Gemini content generation: {str(e)}", exc_info=True)
            raise RuntimeError(f"Gemini API execution failure: {str(e)}")

    def check_api_status(self) -> bool:
        """
        Lightweight status check for the health probe.
        Lists available models to verify the API key and connectivity.
        """
        try:
            models = list(self.client.models.list())
            return len(models) > 0
        except Exception:
            return False

gemini_client_instance = GeminiClient()
