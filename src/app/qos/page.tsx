"use client";

import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import QosPage from "@/components/pages/QosPage";

export default function Qos() {
  return (
    <div className="layout-wrapper">
      <Topbar />
      <Sidebar />
      <div className="scrollable-content">
        <div className="flex-1">
          <QosPage />
        </div>
      </div>
    </div>
  );
}
