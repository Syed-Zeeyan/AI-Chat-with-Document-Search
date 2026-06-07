import React from 'react';
import { useRAG } from '../hooks/useRAG';
import { UploadZone } from './upload/UploadZone';
import { ChatContainer } from './chat/ChatContainer';
import { MessageInput } from './chat/MessageInput';
import { CitationViewer } from './sidebar/CitationViewer';
import { ChunkInspector } from './sidebar/ChunkInspector';
import { ShieldCheck, Database, Link2, ServerCrash, Cpu } from 'lucide-react';

export const Layout = () => {
  const { activeTab, setActiveTab, systemStatus } = useRAG();

  const renderStatusBadge = () => {
    if (!systemStatus) {
      return (
        <span className="flex items-center space-x-1.5 text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full border border-slate-700/50">
          <span className="h-2 w-2 rounded-full bg-slate-600 animate-pulse" />
          <span>Status Checking...</span>
        </span>
      );
    }

    if (systemStatus.status === 'offline') {
      return (
        <span className="flex items-center space-x-1.5 text-xs text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
          <ServerCrash className="h-3.5 w-3.5" />
          <span>API Offline</span>
        </span>
      );
    }

    const allOk = systemStatus.status === 'healthy';
    return (
      <span className={`flex items-center space-x-1.5 text-[11px] px-3 py-1 rounded-full border uppercase tracking-wider font-semibold ${
        allOk 
          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-sm shadow-emerald-500/5' 
          : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      }`}>
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>API {systemStatus.status}</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col font-sans text-slate-200">
      
      {/* Top Header navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl text-slate-950 font-bold shadow-lg shadow-emerald-500/10">
              <Cpu className="h-5 w-5 text-slate-950" />
            </div>
            <div className="text-left">
              <h1 className="text-md font-bold tracking-tight text-white flex items-center">
                AI Chat <span className="text-gradient-emerald font-extrabold ml-1">Document Search</span>
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Internship Evaluation RAG</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {renderStatusBadge()}
          </div>
        </div>
      </header>

      {/* Main Grid Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 overflow-hidden">
        
        {/* Left Side: Chat Workspace */}
        <section className="lg:col-span-2 flex flex-col min-h-[400px] lg:h-[calc(100vh-160px)]">
          <ChatContainer />
          <div className="mt-3 sm:mt-4">
            <MessageInput />
          </div>
        </section>

        {/* Right Side: Upload and Inspection Details */}
        <section className="flex flex-col space-y-4 sm:space-y-6 lg:h-[calc(100vh-160px)] overflow-y-auto pr-0.5">

          {/* File Upload Zone */}
          <div className="glass-panel rounded-2xl p-5 shadow-xl shadow-black/30 border border-slate-700/60">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3.5 text-left">Document Management</h3>
            <UploadZone />
          </div>

          {/* Sidebar tabbed navigation */}
          <div className="flex-1 glass-panel rounded-2xl p-5 flex flex-col min-h-[300px] lg:min-h-[350px] shadow-xl shadow-black/30 border border-slate-700/60">

            {/* Tab select header */}
            <div className="flex border-b border-slate-700/60 pb-2 mb-4">
              <button
                onClick={() => setActiveTab('citations')}
                className={`flex-1 pb-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  activeTab === 'citations'
                    ? 'border-emerald-500 text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <Link2 className="h-3.5 w-3.5" />
                <span>Citations</span>
              </button>
              <button
                onClick={() => setActiveTab('inspector')}
                className={`flex-1 pb-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  activeTab === 'inspector'
                    ? 'border-emerald-500 text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <Database className="h-3.5 w-3.5" />
                <span>Chunk Inspector</span>
              </button>
            </div>

            {/* Tab content viewer */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {activeTab === 'citations' ? <CitationViewer /> : <ChunkInspector />}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
export default Layout;
