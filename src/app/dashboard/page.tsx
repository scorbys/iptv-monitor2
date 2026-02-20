"use client";

import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import DashboardPage from "@/components/pages/DashboardPage";

export default function Dashboard() {
  return (
    <div className="layout-wrapper">
      <Topbar />
      <Sidebar />
      <div className="scrollable-content">
        <div className="flex-1">
          <DashboardPage />
        </div>
      </div>
    </div>
  );
}
