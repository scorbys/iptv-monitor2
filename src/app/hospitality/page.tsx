"use client";

import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import TvPage from "@/components/pages/TvPage";

export default function Hospitality() {
  return (
    <div className="layout-wrapper">
      <Topbar />
      <Sidebar />
      <div className="scrollable-content">
        <div className="flex-1">
          <TvPage />
        </div>
      </div>
    </div>
  );
}
