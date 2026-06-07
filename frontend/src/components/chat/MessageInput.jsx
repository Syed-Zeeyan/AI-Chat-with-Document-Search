import React, { useState } from 'react';
import { useRAG } from '../../hooks/useRAG';
import { Send, CornerDownLeft } from 'lucide-react';

export const MessageInput = () => {
  const { sendQuery, isLoading, activeDocument } = useRAG();
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || isLoading || !activeDocument) return;

    sendQuery(text.trim());
    setText('');
  };

  const handleKeyDown = (e) => {
    // Submit on Enter, unless Shift is held down (which types a newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative flex items-center bg-slate-950/50 border border-slate-800/80 focus-within:border-emerald-500/30 rounded-2xl p-1.5 transition-all duration-300 shadow-lg shadow-slate-950/20">
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            activeDocument 
              ? "Ask a question about the document..." 
              : "Please upload a PDF document above to start"
          }
          disabled={!activeDocument || isLoading}
          className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-sm py-2.5 pl-3.5 pr-12 text-slate-100 placeholder-slate-500 resize-none h-10 max-h-32 scrollbar-none"
        />

        <button
          type="submit"
          disabled={!text.trim() || isLoading || !activeDocument}
          className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
            text.trim() && !isLoading && activeDocument
              ? 'bg-emerald-500 border-emerald-400 hover:bg-emerald-600 text-white cursor-pointer shadow-md shadow-emerald-500/10'
              : 'bg-slate-800 border-slate-700/50 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      
      {activeDocument && (
        <div className="hidden md:flex items-center space-x-1.5 text-[10px] text-slate-500 mt-2 px-1 text-left select-none">
          <CornerDownLeft className="h-3 w-3" />
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>
      )}
    </form>
  );
};
export default MessageInput;
