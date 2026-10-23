import React from "react";
import { Menu, Code2, Cpu, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

export default function Navbar({ sidebarOpen, onToggleSidebar, indexStatus, onReset }) {
  return (
    <header className="h-14 shrink-0 border-b border-white/10 bg-surface-950/80 backdrop-blur-md flex items-center px-4 gap-4 z-50">
      <button
        onClick={onToggleSidebar}
        className="p-1.5 rounded-lg hover:bg-white/10 text-surface-400 hover:text-white transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2.5 select-none">
        <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
          <Code2 size={15} className="text-white" />
        </div>
        <span className="font-semibold text-white tracking-tight hidden sm:block">
          Semantic<span className="text-brand-400">Search</span>
        </span>
      </div>

      <div className="ml-4 hidden md:flex items-center gap-2">
        {indexStatus.indexed ? (
          <span className="flex items-center gap-1.5 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2.5 py-1 rounded-full">
            <CheckCircle2 size={11} />
            {indexStatus.chunks_count.toLocaleString()} chunks indexed
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2.5 py-1 rounded-full">
            <AlertCircle size={11} />
            No repository indexed
          </span>
        )}
      </div>

      <div className="flex-1" />

      <div className="hidden sm:flex items-center gap-1.5 text-xs text-surface-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
        <Cpu size={11} />
        all-MiniLM-L6-v2
      </div>

      {indexStatus.indexed && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-1.5 rounded-lg transition-all duration-200 active:scale-95"
          title="Clear index and start over"
        >
          <Trash2 size={12} />
          <span className="hidden sm:inline">Reset</span>
        </button>
      )}
    </header>
  );
}
