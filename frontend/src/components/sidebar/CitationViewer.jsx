import React, { useState } from 'react';
import { useRAG } from '../../hooks/useRAG';
import { Link2, Quote, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

const PREVIEW_LENGTH = 150;

export const CitationViewer = () => {
  const { activeCitation } = useRAG();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    if (!activeCitation?.text) return;
    navigator.clipboard.writeText(activeCitation.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset expanded state whenever the active citation changes
  React.useEffect(() => {
    setExpanded(false);
  }, [activeCitation?.citation_id]);

  if (!activeCitation) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 min-h-[300px]">
        <div className="p-3 bg-slate-800/50 rounded-2xl mb-4 border border-slate-700/50">
          <Quote className="h-7 w-7 text-slate-600" />
        </div>
        <p className="text-sm font-medium text-slate-400 mb-1.5">No citation selected</p>
        <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">
          Click any{' '}
          <span className="text-emerald-400 font-semibold px-1 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] mx-0.5">
            Page X
          </span>{' '}
          tag in a chat message to inspect its source context.
        </p>
      </div>
    );
  }

  const fullText = activeCitation.text || '';
  const needsTruncation = fullText.length > PREVIEW_LENGTH;
  const displayText = needsTruncation && !expanded
    ? fullText.slice(0, PREVIEW_LENGTH).trimEnd() + '…'
    : fullText;

  return (
    <div className="flex flex-col h-full space-y-3 text-left p-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-950/60 border border-slate-700/60 p-3 rounded-xl shadow-md shadow-black/20 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-emerald-500/15 text-emerald-400 rounded-lg border border-emerald-500/25">
            <Link2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-none mb-1">
              Grounded Citation
            </p>
            <p className="text-sm font-semibold text-slate-100 leading-none">Page {activeCitation.page}</p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
          title="Copy full citation text"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Quote body — bounded height, internal scroll */}
      <div className="flex flex-col min-h-0 bg-slate-950/60 border border-slate-700/50 rounded-xl shadow-inner shadow-black/30 overflow-hidden shrink-0" style={{ maxHeight: '220px' }}>
        <div className="overflow-y-auto flex-1 p-4 relative select-text">
          <Quote className="absolute top-2.5 right-3 h-10 w-10 text-slate-800/25 pointer-events-none" />
          <p className="text-[13px] text-slate-300 leading-[1.75] font-sans relative z-10 italic tracking-wide">
            "{displayText}"
          </p>
        </div>
      </div>

      {/* Show More / Less — always visible outside the scroll area */}
      {needsTruncation && (
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="shrink-0 flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer self-start px-1"
        >
          {expanded ? (
            <><ChevronUp className="h-3.5 w-3.5" /><span>Show Less</span></>
          ) : (
            <><ChevronDown className="h-3.5 w-3.5" /><span>Show More</span></>
          )}
        </button>
      )}
    </div>
  );
};
export default CitationViewer;
