import React from "react";
import UploadCard from "../components/UploadCard.jsx";
import SearchCard from "../components/SearchCard.jsx";

export default function Dashboard({ activeView, indexStatus, onIndexed, apiBase }) {
  return (
    <div className="p-6 md:p-8 min-h-full">
      {activeView === "upload" && (
        <UploadCard apiBase={apiBase} onIndexed={onIndexed} />
      )}
      {activeView === "search" && (
        <SearchCard apiBase={apiBase} indexStatus={indexStatus} />
      )}
    </div>
  );
}
