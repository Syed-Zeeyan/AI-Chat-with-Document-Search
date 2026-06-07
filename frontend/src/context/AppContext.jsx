import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [activeDocument, setActiveDocument] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [activeCitation, setActiveCitation] = useState(null);
  const [lastRetrievedChunks, setLastRetrievedChunks] = useState([]);
  const [activeTab, setActiveTab] = useState('citations'); // 'citations' | 'inspector'
  const [systemStatus, setSystemStatus] = useState(null);

  // Perform a status check on startup
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const health = await api.checkHealth();
        setSystemStatus(health);
      } catch (err) {
        console.error('System health degraded:', err);
        setSystemStatus({ status: 'offline' });
      }
    };
    fetchStatus();
  }, []);

  /**
   * Triggers file upload and registers document
   */
  const uploadFile = async (file) => {
    setIsLoading(true);
    setError(null);
    setUploadProgress(20);
    try {
      setUploadProgress(50);
      const res = await api.uploadDocument(file);
      setUploadProgress(90);
      
      setActiveDocument({
        id: res.document_id,
        name: res.file_name,
        size: res.file_size_bytes,
        pages: res.total_pages,
        chunks: res.total_chunks,
        createdAt: res.created_at
      });
      
      // Reset chat state for the new document
      setMessages([
        {
          role: 'model',
          content: `Successfully uploaded and indexed "${res.file_name}" (${res.total_pages} pages, ${res.total_chunks} semantic context chunks). Feel free to ask me questions about this document!`,
          isSystem: true
        }
      ]);
      setLastRetrievedChunks([]);
      setActiveCitation(null);
      setUploadProgress(100);
    } catch (err) {
      setError(err.message || 'File upload failed');
      setUploadProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Submits user message to the RAG chat backend
   */
  const sendQuery = async (text) => {
    if (!activeDocument) {
      setError('Please upload a PDF document before starting the chat.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Add user message to history immediately
    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    
    try {
      // Assemble standard history payload, ignoring system notifications
      const activeHistory = messages
        .filter(m => !m.isSystem)
        .map(m => ({ role: m.role, content: m.content }));
        
      const res = await api.sendMessage(text, activeDocument.id, activeHistory);
      
      const assistantMessage = {
        role: 'model',
        content: res.answer,
        citations: res.citations,
        retrieved_chunks: res.retrieved_chunks
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      setLastRetrievedChunks(res.retrieved_chunks || []);
      
      // Auto-focus the first citation if any are returned
      if (res.citations && res.citations.length > 0) {
        setActiveCitation(res.citations[0]);
        setActiveTab('citations');
      }
    } catch (err) {
      setError(err.message || 'Conversational inference request failed');
      
      // Add error message to chat window
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: `Failed to generate answer. Error: ${err.message}`,
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    setActiveDocument(null);
    setMessages([]);
    setError(null);
    setActiveCitation(null);
    setLastRetrievedChunks([]);
    setUploadProgress(0);
  };

  return (
    <AppContext.Provider
      value={{
        activeDocument,
        messages,
        isLoading,
        uploadProgress,
        error,
        activeCitation,
        lastRetrievedChunks,
        activeTab,
        systemStatus,
        uploadFile,
        sendQuery,
        clearAll,
        setActiveCitation,
        setActiveTab,
        setError
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
