import React from "react";
import { Upload, Search, Database, BookOpen, ChevronRight } from "lucide-react";

const NAV_ITEMS = [
  { id: "upload", label: "Upload Repository", icon: Upload, description: "Index a ZIP file" },
  { id: "search", label: "Semantic Search",   icon: Search,  description: "Query indexed code" },
];

const TECH_STACK = [
  { label: "Embedding", value: "MiniLM-L6-v2" },
  { label: "Vector DB",  value: "ChromaDB" },
  { label: "Backend",    value: "Flask" },
  { label: "Frontend",   value: "React + Vite" },
];

export default function Sidebar({ open, activeView, onChangeView, indexStatus }) {
  if (!open) return null;

  return (
    <aside className="w-60 shrink-0 border-r border-white/10 bg-surface-950 flex flex-col overflow-hidden">
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-surface-600 px-2 mb-3">
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const isDisabled = item.id === "search" && !indexStatus.indexed;
          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && onChangeView(item.id)}
              disabled={isDisabled}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group
                ${isActive
                  ? "bg-brand-600/20 border border-brand-500/30 text-brand-300"
                  : isDisabled
                  ? "opacity-40 cursor-not-allowed text-surface-500"
                  : "text-surface-400 hover:bg-white/5 hover:text-white"
                }`}
            >
              <Icon size={16} className={isActive ? "text-brand-400" : ""} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-none mb-0.5">{item.label}</div>
                <div className="text-[11px] text-surface-600 truncate">{item.description}</div>
              </div>
              {isActive && <ChevronRight size={14} className="text-brand-400 shrink-0" />}
            </button>
          );
        })}
      </nav>

      {indexStatus.indexed && (
        <div className="mx-3 mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Database size={13} className="text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">Index Ready</span>
          </div>
          <div className="text-[11px] text-surface-400">
            <span className="text-white font-mono font-medium">{indexStatus.chunks_count.toLocaleString()}</span>{" "}
            chunks in ChromaDB
          </div>
        </div>
      )}

      <div className="px-3 pb-4 border-t border-white/10 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-surface-600 px-2 mb-3">
          Tech Stack
        </p>
        <div className="space-y-1.5">
          {TECH_STACK.map(t => (
            <div key={t.label} className="flex items-center justify-between px-2">
              <span className="text-[11px] text-surface-600">{t.label}</span>
              <span className="text-[11px] text-surface-400 font-mono">{t.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 px-2">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1.5 text-[11px] text-surface-600 hover:text-surface-400 transition-colors">
            <BookOpen size={11} />
            Documentation
          </a>
        </div>
      </div>
    </aside>
  );
}
