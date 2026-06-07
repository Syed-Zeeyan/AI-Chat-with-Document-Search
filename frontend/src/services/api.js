const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const api = {
  /**
   * Diagnostic health check
   */
  async checkHealth() {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error('API server is unreachable');
    return res.json();
  },

  /**
   * PDF document upload
   * @param {File} file
   */
  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(errData.detail || 'Failed to upload document');
    }

    return res.json();
  },

  /**
   * RAG conversational chat session
   * @param {string} message
   * @param {string} documentId
   * @param {Array} history
   */
  async sendMessage(message, documentId, history) {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        document_id: documentId,
        history,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: 'Chat query failed' }));
      throw new Error(errData.detail || 'Failed to query chat assistant');
    }

    return res.json();
  }
};
