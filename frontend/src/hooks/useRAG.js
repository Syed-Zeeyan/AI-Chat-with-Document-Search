import { useApp } from '../context/AppContext';

/**
 * Custom React hook summarizing all ingestion, retrieval, and chat functions.
 */
export const useRAG = () => {
  const context = useApp();
  if (!context) {
    throw new Error('useRAG must be consumed within an AppProvider');
  }
  return context;
};
export default useRAG;
