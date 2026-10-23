import React, { useState, useRef, useCallback } from "react";
import { Search, Loader2, AlertCircle, FileCode2, ChevronDown, ChevronUp, Copy, Check, Sliders, Hash, Sparkles } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const LANG_MAP = {
  py:"python", js:"javascript", jsx:"jsx", ts:"typescript", tsx:"tsx",
  java:"java", cpp:"cpp", c:"c", html:"html", css:"css", json:"json", md:"markdown",
};

const EXAMPLE_QUERIES = [
  "authentication middleware",
  "database connection pooling",
  "error handling patterns",
  "API route definitions",
  "async function implementations",
  "CSS animations and transitions",
];

function ScoreBadge({ score }) {
  const pct = Math.round(score * 100);
  const cls = pct >= 70 ? "score-high" : pct >= 45 ? "score-medium" : "score-low";
  return (
    <span className={`score-badge ${cls}`}>
      <Sparkles size={9} />{pct}% match
    </span>
  );
}

function ScoreBar({ score }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 45 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function ResultCard({ result, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  const [copied, setCopied]     = useState(false);
  const lang = LANG_MAP[result.language] || "text";

  const copySnippet = async () => {
    await navigator.clipboard.writeText(result.snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parts    = result.file_path.split("/");
  const fileName = parts[parts.length - 1];
  const dirPath  = parts.slice(0, -1).join("/");

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setExpanded(v => !v)}>
        <span className="w-6 h-6 flex items-center justify-center rounded-md bg-brand-600/20 text-brand-400 text-[11px] font-bold font-mono shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <FileCode2 size={13} className="text-surface-500 shrink-0" />
            {dirPath && <span className="text-surface-600 text-xs truncate hidden sm:block">{dirPath}/</span>}
            <span className="text-white text-sm font-medium truncate">{fileName}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-[11px] text-surface-600 font-mono">
              <Hash size={9} />L{result.start_line}–L{result.end_line}
            </span>
            <span className="text-[11px] text-surface-600 font-mono uppercase">{result.language}</span>
            <ScoreBar score={result.similarity_score} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ScoreBadge score={result.similarity_score} />
          <button className="text-surface-600 hover:text-white transition-colors p-1">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/10 relative group">
          <button
            onClick={copySnippet}
            className="absolute top-2 right-2 z-10 flex items-center gap-1 text-[11px] bg-surface-900/90 border border-white/10 text-surface-400 hover:text-white hover:border-white/20 px-2 py-1 rounded-md transition-all duration-150 opacity-0 group-hover:opacity-100"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <SyntaxHighlighter
            language={lang}
            style={vscDarkPlus}
            customStyle={{ margin: 0, background: "transparent", fontSize: "12px", lineHeight: "1.6", padding: "1rem 1.25rem", maxHeight: "420px", overflowY: "auto" }}
            showLineNumbers
            startingLineNumber={result.start_line}
            lineNumberStyle={{ color: "#374151", minWidth: "3em", paddingRight: "1em", userSelect: "none" }}
          >
            {result.snippet}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
}

export default function SearchCard({ apiBase, indexStatus }) {
  const [query, setQuery]           = useState("");
  const [topK, setTopK]             = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  const [results, setResults]       = useState(null);
  const [status, setStatus]         = useState("idle");
  const [errorMsg, setErrorMsg]     = useState("");
  const [searchTime, setSearchTime] = useState(null);
  const inputRef = useRef(null);

  const runSearch = useCallback(async (q = query) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setStatus("loading"); setErrorMsg(""); setResults(null);
    const t0 = performance.now();
    try {
      const res  = await fetch(`${apiBase}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, top_k: topK }),
      });
      const data    = await res.json();
      const elapsed = ((performance.now() - t0) / 1000).toFixed(3);
      setSearchTime(elapsed);
      if (!res.ok) { setStatus("error"); setErrorMsg(data.error || "Search failed."); return; }
      setStatus("done"); setResults(data);
    } catch {
      setStatus("error"); setErrorMsg("Could not reach the backend. Is Flask running on port 5000?");
    }
  }, [query, topK, apiBase]);

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runSearch(); } };
  const handleExample = (q)  => { setQuery(q); runSearch(q); inputRef.current?.focus(); };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Semantic Code Search</h1>
        <p className="text-surface-400 text-sm">
          Ask in plain English — finds code by meaning, not keywords.
          <span className="ml-2 font-mono text-xs text-surface-600">{indexStatus.chunks_count.toLocaleString()} chunks indexed</span>
        </p>
      </div>

      <div className="relative mb-3">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
        <input
          ref={inputRef} type="text" value={query}
          onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="e.g. how is user authentication implemented?"
          className="input-field pl-10 pr-32 py-3.5 text-sm"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            onClick={() => setShowSettings(v => !v)}
            className={`p-2 rounded-md transition-colors ${showSettings ? "bg-brand-600/20 text-brand-400" : "hover:bg-white/10 text-surface-500 hover:text-white"}`}
            title="Search settings"
          >
            <Sliders size={14} />
          </button>
          <button onClick={() => runSearch()} disabled={!query.trim() || status === "loading"} className="btn-primary py-1.5 px-4 text-sm">
            {status === "loading" ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Search
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-4 p-4 glass-card flex items-center gap-6 animate-slide-up">
          <div className="flex items-center gap-3">
            <label className="text-xs text-surface-400 whitespace-nowrap">Results (top-k)</label>
            <input type="range" min={1} max={20} value={topK} onChange={e => setTopK(Number(e.target.value))} className="w-28 accent-brand-500" />
            <span className="text-xs font-mono text-brand-400 w-4">{topK}</span>
          </div>
        </div>
      )}

      {status === "idle" && !results && (
        <div className="mb-6">
          <p className="text-[11px] text-surface-600 uppercase tracking-widest mb-2">Example queries</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map(q => (
              <button key={q} onClick={() => handleExample(q)}
                className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-surface-400 hover:text-white px-3 py-1.5 rounded-full transition-all duration-150">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-4 animate-slide-up">
          <AlertCircle size={16} className="text-rose-400 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-300">{errorMsg}</p>
        </div>
      )}

      {status === "loading" && (
        <div className="space-y-3">
          {[0,1,2].map(i => (
            <div key={i} className="glass-card p-4 animate-pulse-slow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 rounded-md bg-white/10" />
                <div className="flex-1">
                  <div className="h-3 bg-white/10 rounded w-1/3 mb-2" />
                  <div className="h-2 bg-white/5 rounded w-1/4" />
                </div>
                <div className="w-16 h-5 bg-white/10 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {status === "done" && results && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-surface-400">
              <span className="text-white font-medium">{results.total}</span> results for{" "}
              <span className="text-brand-400 font-medium">"{results.query}"</span>
            </span>
            {searchTime && <span className="text-xs text-surface-600 font-mono">{searchTime}s</span>}
          </div>

          {results.results.length === 0 ? (
            <div className="text-center py-16">
              <Search size={32} className="text-surface-700 mx-auto mb-3" />
              <p className="text-surface-500 text-sm">No matching chunks found.</p>
              <p className="text-surface-700 text-xs mt-1">Try rephrasing your query.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.results.map((r, i) => (
                <ResultCard key={`${r.file_path}-${r.start_line}-${i}`} result={r} index={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
