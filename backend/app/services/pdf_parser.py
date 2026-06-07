import io
import logging
from typing import List, Dict, Any
import pdfplumber

logger = logging.getLogger(__name__)

class PDFParserService:
    @staticmethod
    def extract_text_by_page(file_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Parses a PDF from bytes, returning a list of dictionaries containing
        the 1-indexed page number and cleaned text content.
        
        Example return: [{"page": 1, "text": "cleaned content..."}]
        """
        extracted_pages = []
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for idx, page in enumerate(pdf.pages):
                    page_number = idx + 1
                    raw_text = page.extract_text()
                    
                    if not raw_text:
                        # Fallback for empty pages / images
                        cleaned_text = ""
                    else:
                        # Clean whitespace and strip leading/trailing spaces
                        cleaned_text = "\n".join(
                            line.strip() for line in raw_text.splitlines() if line.strip()
                        ).strip()
                    
                    extracted_pages.append({
                        "page": page_number,
                        "text": cleaned_text
                    })
            
            logger.info(f"Successfully parsed PDF. Total pages: {len(extracted_pages)}")
            return extracted_pages
            
        except Exception as e:
            logger.error(f"Error during PDF parsing: {str(e)}", exc_info=True)
            raise ValueError(f"Failed to parse PDF document: {str(e)}")
