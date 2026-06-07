import React, { useEffect, useRef } from 'react';
import { useRAG } from '../../hooks/useRAG';
import { ChatMessage } from './ChatMessage';
import { Sparkles, Loader2 } from 'lucide-react';

export const ChatContainer = () => {
  const { messages, isLoading, activeDocument } = useRAG();
  const bottomRef = useRef(null);

  // Auto-scroll on new messages or loading state change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-900/40 rounded-2xl border border-slate-800/60 p-4 shadow-inner">
      <div className="flex-1 overflow-y-auto px-1 pr-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 animate-pulse">
              <Sparkles className="h-8 w-8" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-base font-semibold text-slate-200">Start Your Conversational Search</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload a financial statement, contract, or textbook on the right panel. 
                I'll parse it page-by-page, convert it to vector embeddings, and help you query it with grounded page citations.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {messages.map((msg, index) => (
              <ChatMessage key={`msg-${index}`} message={msg} />
            ))}
            
            {/* Loading / Generating Indicator */}
            {isLoading && (
              <div className="flex justify-start my-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800/80 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400 font-medium">Generating answer</span>
                      <span className="flex space-x-1">
                        <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </span>
                    </div>
                    {/* Shimmer skeleton line */}
                    <div className="h-2 w-40 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-slate-800 via-emerald-900/40 to-slate-800 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
};
export default ChatContainer;
