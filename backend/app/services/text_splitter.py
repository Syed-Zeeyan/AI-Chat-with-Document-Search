import re
from typing import List, Dict, Any

class RecursiveCharacterTextSplitter:
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        separators: List[str] = None
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or ["\n\n", "\n", " ", ""]

    def _split_text(self, text: str, separators: List[str]) -> List[str]:
        """
        Recursively splits text using a list of separator priority.
        """
        final_chunks = []
        
        # Base case: text is already within chunk size limit
        if len(text) <= self.chunk_size:
            return [text]

        # Select the next separator
        separator = separators[0] if separators else ""
        
        # Split text by separator
        if separator:
            splits = text.split(separator)
        else:
            # Fallback if no separators are left: split character by character
            splits = list(text)

        current_doc = []
        current_len = 0
        
        for part in splits:
            part_len = len(part)
            
            # If a single part exceeds the chunk size, recursively split it using remaining separators
            if part_len > self.chunk_size:
                if len(separators) > 1:
                    sub_splits = self._split_text(part, separators[1:])
                    # Add remaining buffered items
                    if current_doc:
                        final_chunks.append(separator.join(current_doc))
                        current_doc = []
                        current_len = 0
                    final_chunks.extend(sub_splits)
                else:
                    # No separators left, hard slice the string
                    if current_doc:
                        final_chunks.append(separator.join(current_doc))
                        current_doc = []
                        current_len = 0
                    
                    start = 0
                    while start < len(part):
                        final_chunks.append(part[start : start + self.chunk_size])
                        start += self.chunk_size - self.chunk_overlap
            
            # Normal buffering logic
            elif current_len + part_len + (len(separator) if current_doc else 0) <= self.chunk_size:
                current_doc.append(part)
                current_len += part_len + (len(separator) if len(current_doc) > 1 else 0)
            else:
                # Flush buffer
                if current_doc:
                    final_chunks.append(separator.join(current_doc))
                
                # Setup next buffer with overlap. We build it backwards to maintain context.
                overlap_doc = []
                overlap_len = 0
                for old_part in reversed(current_doc):
                    old_part_len = len(old_part)
                    if overlap_len + old_part_len + (len(separator) if overlap_doc else 0) <= self.chunk_overlap:
                        overlap_doc.insert(0, old_part)
                        overlap_len += old_part_len + (len(separator) if len(overlap_doc) > 1 else 0)
                    else:
                        break
                
                current_doc = overlap_doc + [part]
                current_len = sum(len(p) for p in current_doc) + (len(separator) * (len(current_doc) - 1))
        
        if current_doc:
            final_chunks.append(separator.join(current_doc))
            
        return final_chunks

    def split_page(self, text: str, page_number: int) -> List[Dict[str, Any]]:
        """
        Splits a page text into chunks and records the page number in structural dictionary.
        """
        if not text.strip():
            return []
            
        raw_chunks = self._split_text(text, self.separators)
        chunks_data = []
        
        for idx, chunk in enumerate(raw_chunks):
            # Clean double spaces or excessive newlines in chunk for database neatness
            cleaned_chunk = re.sub(r'\s+', ' ', chunk).strip()
            if cleaned_chunk:
                chunks_data.append({
                    "page_number": page_number,
                    "text": cleaned_chunk,
                    "chunk_index": idx
                })
                
        return chunks_data
