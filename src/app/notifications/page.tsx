"use client";

import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import NotifPage from "@/components/pages/NotifPage";

export default function Hospitality() {
  return (
    <div className="layout-wrapper">
      <Topbar />
      <Sidebar />
      <div className="scrollable-content">
        <div className="flex-1">
          <NotifPage />
        </div>
      </div>
    </div>
  );
}
