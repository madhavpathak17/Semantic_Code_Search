import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";

const API_BASE = "/api";

export default function App() {
  const [indexStatus, setIndexStatus] = useState({ indexed: false, chunks_count: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("upload");

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      if (res.ok) {
        const data = await res.json();
        setIndexStatus(data);
        if (data.indexed) setActiveView("search");
      }
    } catch { /* backend not yet available */ }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleIndexed = useCallback((status) => {
    setIndexStatus(status);
    setActiveView("search");
  }, []);

  const handleReset = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/reset`, { method: "POST" });
      setIndexStatus({ indexed: false, chunks_count: 0 });
      setActiveView("upload");
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface-950">
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(v => !v)}
        indexStatus={indexStatus}
        onReset={handleReset}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          open={sidebarOpen}
          activeView={activeView}
          onChangeView={setActiveView}
          indexStatus={indexStatus}
        />
        <main className="flex-1 overflow-auto">
          <Dashboard
            activeView={activeView}
            indexStatus={indexStatus}
            onIndexed={handleIndexed}
            apiBase={API_BASE}
          />
        </main>
      </div>
    </div>
  );
}
