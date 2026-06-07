import React from 'react';
import { useRAG } from '../../hooks/useRAG';
import { Database, HelpCircle } from 'lucide-react';

export const ChunkInspector = () => {
  const { lastRetrievedChunks } = useRAG();

  if (!lastRetrievedChunks || lastRetrievedChunks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 min-h-[300px]">
        <div className="p-3 bg-slate-800/50 rounded-2xl mb-4 border border-slate-700/50">
          <Database className="h-7 w-7 text-slate-600" />
        </div>
        <p className="text-sm font-medium text-slate-400 mb-1.5">No chunks retrieved yet</p>
        <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">
          Send a query to see the top vector-matched document segments and their cosine similarity scores.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-3 text-left p-1">
      {/* Info banner */}
      <div className="flex items-center space-x-2 bg-slate-950/30 border border-slate-700/40 px-3 py-2.5 rounded-lg text-xs text-slate-400 shrink-0">
        <HelpCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        <span className="leading-relaxed">
          Retrieved top{' '}
          <span className="text-emerald-400 font-semibold">{lastRetrievedChunks.length}</span>{' '}
          nearest neighbor{lastRetrievedChunks.length !== 1 ? 's' : ''} · Cosine similarity
        </span>
      </div>

      {/* Chunk card list */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {lastRetrievedChunks.map((chunk, index) => (
          <div
            key={chunk.chunk_id || index}
            className="bg-slate-950/50 border border-slate-700/60 rounded-xl shadow-md shadow-black/20 hover:border-slate-600/60 transition-colors"
          >
            {/* Meta row */}
            <div className="flex items-center justify-between text-[10px] px-3.5 py-2.5 border-b border-slate-800/60">
              <span className="font-mono text-slate-500 truncate max-w-[120px]" title={chunk.chunk_id}>
                {chunk.chunk_id?.split('_').pop() || `chunk_${index}`}
              </span>
              <div className="flex items-center space-x-1.5">
                <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/40">
                  Page {chunk.page}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  {chunk.score.toFixed(3)}
                </span>
              </div>
            </div>

            {/* Chunk text — constrained height with internal scroll */}
            <div className="overflow-y-auto px-3.5 py-3" style={{ maxHeight: '140px' }}>
              <p className="text-[11px] text-slate-400 leading-relaxed font-mono whitespace-pre-wrap select-all">
                {chunk.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ChunkInspector;
