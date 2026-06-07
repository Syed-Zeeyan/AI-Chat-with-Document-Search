import React from 'react';
import { useRAG } from '../../hooks/useRAG';
import { User, Cpu, AlertCircle, AlertTriangle } from 'lucide-react';

export const ChatMessage = ({ message }) => {
  const { setActiveCitation, setActiveTab } = useRAG();
  const isUser = message.role === 'user';
  const isSystem = message.isSystem;
  const isError = message.isError;

  const renderContent = () => {
    const content = message.content;
    const citations = message.citations || [];
    
    if (isSystem) {
      return <span className="text-slate-300 italic text-xs">{content}</span>;
    }

    if (isError) {
      // 503 / service unavailable — show a friendlier amber warning
      const is503 = /503|unavailable|service.?unavailable/i.test(content);
      if (is503) {
        return (
          <div className="flex items-start space-x-2 text-amber-400 bg-amber-500/5 px-3 py-2.5 rounded-lg border border-amber-500/15">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-semibold mb-0.5">Gemini is temporarily unavailable</p>
              <p className="text-amber-300/80">The AI service returned a 503 error. This is usually brief — please try again in a moment.</p>
            </div>
          </div>
        );
      }
      return (
        <div className="flex items-center space-x-2 text-rose-400 bg-rose-500/5 px-3 py-2 rounded-lg border border-rose-500/10">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-xs">{content}</span>
        </div>
      );
    }

    if (!content) return null;

    // Regex matching citation format [Page X] or [Page X, Y]
    const regex = /\[Page\s*(\d+(?:\s*,\s*\d+)*)\]/gi;
    const parts = content.split(regex);
    const matches = [...content.matchAll(regex)];

    // Plain text with no citations — apply paragraph + list formatting
    if (matches.length === 0) {
      return <div className="leading-relaxed text-sm space-y-2">{formatText(content)}</div>;
    }

    const elements = [];
    let matchIndex = 0;

    for (let i = 0; i < parts.length; i++) {
      // Add standard text chunk
      elements.push(<span key={`text-${i}`} className="whitespace-pre-line leading-relaxed text-sm">{parts[i]}</span>);

      // Add citation buttons
      if (matchIndex < matches.length && i < parts.length - 1) {
        const match = matches[matchIndex];
        const pageRaw = match[1]; // e.g. "4" or "4, 5"
        const pages = pageRaw.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));

        elements.push(
          <span key={`cite-${matchIndex}`} className="inline-flex items-center mx-1 select-none font-semibold">
            {pages.map((pNum, pIdx) => {
              // Find the mapped grounding source text
              const citation = citations.find(c => c.page === pNum);
              return (
                <button
                  key={`btn-${pNum}-${pIdx}`}
                  onClick={() => {
                    if (citation) {
                      setActiveCitation(citation);
                    } else {
                      setActiveCitation({
                        citation_id: `cite_temp_${pNum}`,
                        page: pNum,
                        text: "Grounding context segment was not returned in search cache."
                      });
                    }
                    setActiveTab('citations');
                  }}
                  className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wide rounded bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 transition mr-0.5 cursor-pointer"
                >
                  Page {pNum}
                </button>
              );
            })}
          </span>
        );
        matchIndex++;
      }
    }

    return <div className="leading-relaxed text-sm space-y-1">{elements}</div>;
  };

  // Renders paragraphs and bullet/numbered list items with improved spacing
  const formatText = (text) => {
    const paragraphs = text.split(/\n{2,}/);
    return paragraphs.map((para, pIdx) => {
      const lines = para.split('\n');
      const listItems = lines.filter(l => /^[-*]\s|^\d+\.\s/.test(l.trim()));
      const isAllList = listItems.length === lines.length && lines.length > 0;

      if (isAllList) {
        return (
          <ul key={pIdx} className="space-y-2 pl-1">
            {lines.map((line, lIdx) => (
              <li key={lIdx} className="flex items-start space-x-2.5">
                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="leading-relaxed">{line.replace(/^[-*]\s|^\d+\.\s/, '')}</span>
              </li>
            ))}
          </ul>
        );
      }

      return <p key={pIdx} className="whitespace-pre-wrap">{para}</p>;
    });
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-3.5 px-4">
        <div className="bg-slate-950/30 border border-slate-800/80 px-4 py-2 rounded-full text-center max-w-lg shadow-sm">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full my-5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start space-x-3 max-w-[85%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        
        {/* Avatar */}
        <div className={`p-2 rounded-2xl shrink-0 border shadow-lg ${
          isUser
            ? 'bg-slate-800 border-slate-700/80 text-slate-300 shadow-black/20'
            : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-emerald-900/20'
        }`}>
          {isUser ? <User className="h-4 w-4" /> : <Cpu className="h-4 w-4" />}
        </div>

        {/* Message Bubble */}
        <div className={`px-4 py-3.5 rounded-2xl border text-left shadow-md ${
          isUser
            ? 'bg-slate-800/90 border-slate-700/70 rounded-tr-none text-slate-100 shadow-black/25'
            : 'bg-slate-900/60 border-slate-700/50 rounded-tl-none text-slate-200 shadow-black/20'
        }`}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
export default ChatMessage;
