import React, { useRef, useState } from 'react';
import { useRAG } from '../../hooks/useRAG';
import { Upload, FileText, AlertCircle, RefreshCw } from 'lucide-react';

export const UploadZone = () => {
  const { uploadFile, isLoading, uploadProgress, error, activeDocument, clearAll } = useRAG();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        uploadFile(file);
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full">
      {!activeDocument ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[180px] ${dragActive
              ? 'border-emerald-400 bg-emerald-500/8 shadow-lg shadow-emerald-500/5'
              : 'border-slate-700/80 bg-slate-950/30 hover:border-slate-600 hover:bg-slate-950/50'
            } ${isLoading ? 'pointer-events-none opacity-70' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf"
            onChange={handleChange}
            disabled={isLoading}
          />

          {isLoading ? (
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="h-9 w-9 text-emerald-400 animate-spin" />
              <div className="space-y-1 text-center">
                <p className="text-sm font-semibold text-slate-200">Processing Document…</p>
                <p className="text-xs text-slate-500">Extracting text &amp; indexing vectors</p>
              </div>
              <div className="w-44 bg-slate-800 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-1 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 bg-slate-800/70 rounded-xl mb-4 border border-slate-700/60 shadow-sm">
                <Upload className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-slate-300 mb-1">
                Drop your PDF here, or{' '}
                <button
                  type="button"
                  onClick={onButtonClick}
                  className="text-emerald-400 font-semibold hover:text-emerald-300 hover:underline focus:outline-none transition-colors"
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-slate-600">PDF documents · up to 10 MB</p>
            </>
          )}

          {error && (
            <div className="mt-4 flex items-center space-x-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3.5 py-2 rounded-xl text-xs max-w-xs text-left">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="truncate">{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/60 shadow-lg shadow-black/20 overflow-hidden">
          {/* Emerald accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400" />

          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 text-left">
                  <h4 className="text-sm font-semibold text-slate-100 truncate" title={activeDocument.name}>
                    {activeDocument.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(activeDocument.size / 1024 / 1024).toFixed(2)} MB · {activeDocument.pages} page{activeDocument.pages !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <button
                onClick={clearAll}
                className="shrink-0 text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors border border-slate-700/60"
              >
                Change
              </button>
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-800/60 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Chunks indexed:{' '}
                <span className="text-emerald-400 font-semibold">{activeDocument.chunks}</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold tracking-widest border border-emerald-500/20">
                ✓ Ready
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default UploadZone;
