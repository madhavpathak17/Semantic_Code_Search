import React, { useState, useRef, useCallback } from "react";
import { Upload, FileArchive, CheckCircle2, AlertCircle, Loader2, FolderOpen, X, Zap } from "lucide-react";

const SUPPORTED_EXTS = [".py",".js",".jsx",".ts",".tsx",".java",".cpp",".c",".html",".css",".json",".md"];

export default function UploadCard({ apiBase, onIndexed }) {
  const [file, setFile]         = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus]     = useState("idle");
  const [message, setMessage]   = useState("");
  const [stats, setStats]       = useState(null);
  const [progress, setProgress] = useState(0);
  const inputRef    = useRef(null);
  const progressRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!f.name.endsWith(".zip")) { setStatus("error"); setMessage("Only .zip files are accepted."); return; }
    setFile(f); setStatus("idle"); setMessage(""); setStats(null);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading"); setMessage(""); setProgress(0);
    let p = 0;
    progressRef.current = setInterval(() => { p = Math.min(p + Math.random() * 8, 85); setProgress(p); }, 300);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res  = await fetch(`${apiBase}/upload`, { method: "POST", body: formData });
      clearInterval(progressRef.current); setProgress(100);
      const data = await res.json();
      if (!res.ok) { setStatus("error"); setMessage(data.error || "Upload failed."); return; }
      setStatus("success"); setMessage(data.message || "Repository indexed.");
      setStats({ files: data.files_processed, chunks: data.chunks_indexed });
      setTimeout(() => onIndexed({ indexed: true, chunks_count: data.chunks_indexed }), 1200);
    } catch {
      clearInterval(progressRef.current);
      setStatus("error"); setMessage("Could not reach the backend. Is Flask running on port 5000?");
    }
  };

  const clearFile = (e) => {
    e.stopPropagation(); setFile(null); setStatus("idle"); setMessage(""); setStats(null); setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const fmt = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Index a Repository</h1>
        <p className="text-surface-400 text-sm leading-relaxed">
          Upload a ZIP archive of your codebase. The system scans, chunks, and embeds all supported source files into ChromaDB for semantic search.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {SUPPORTED_EXTS.map(ext => (
          <span key={ext} className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-surface-400">{ext}</span>
        ))}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
          ${dragOver ? "border-brand-400 bg-brand-500/10 scale-[1.01]"
            : file  ? "border-brand-600/50 bg-brand-600/5"
            : "border-white/15 hover:border-white/30 bg-white/3"}`}
      >
        <input ref={inputRef} type="file" accept=".zip" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
              <FileArchive size={26} className="text-brand-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">{file.name}</p>
              <p className="text-surface-500 text-xs mt-0.5">{fmt(file.size)}</p>
            </div>
            <button onClick={clearFile} className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-surface-500 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Upload size={24} className="text-surface-500" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">Drop your ZIP here, or <span className="text-brand-400">browse</span></p>
              <p className="text-surface-600 text-xs mt-1">Max 500 KB per file inside the archive</p>
            </div>
          </div>
        )}
      </div>

      {status === "uploading" && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-surface-500 mb-1.5">
            <span>Processing repository…</span><span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 animate-slide-up">
          <AlertCircle size={16} className="text-rose-400 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-300">{message}</p>
        </div>
      )}

      {status === "success" && stats && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">{message}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white font-mono">{stats.files}</p>
              <p className="text-xs text-surface-500 mt-0.5">Files scanned</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white font-mono">{stats.chunks.toLocaleString()}</p>
              <p className="text-xs text-surface-500 mt-0.5">Chunks indexed</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || status === "uploading" || status === "success"}
        className="btn-primary w-full justify-center mt-6 py-3 text-sm"
      >
        {status === "uploading" ? (<><Loader2 size={16} className="animate-spin" />Indexing repository…</>)
          : status === "success" ? (<><CheckCircle2 size={16} />Indexed — switching to Search…</>)
          : (<><Zap size={16} />Index Repository</>)}
      </button>

      <div className="mt-10 border-t border-white/10 pt-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-surface-600 mb-4">How it works</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { step: "01", label: "Extract ZIP",      icon: FolderOpen  },
            { step: "02", label: "Scan & Chunk",     icon: FileArchive },
            { step: "03", label: "Embed via MiniLM", icon: Zap         },
            { step: "04", label: "Store in ChromaDB",icon: CheckCircle2},
          ].map(({ step, label, icon: Icon }) => (
            <div key={step} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/3 border border-white/8">
              <span className="text-[10px] font-mono text-surface-600">{step}</span>
              <Icon size={16} className="text-brand-400" />
              <span className="text-[11px] text-surface-400 text-center leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
