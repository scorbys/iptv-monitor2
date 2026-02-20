"use client";

import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import ChromecastPage from "@/components/pages/ChromecastPage";

export default function Chromecast() {
  return (
    <div className="layout-wrapper">
      <Topbar />
      <Sidebar />
      <div className="scrollable-content">
        <div className="flex-1">
          <ChromecastPage />
        </div>
      </div>
    </div>
  );
}
