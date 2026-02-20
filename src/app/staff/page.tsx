"use client";

import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import StaffPage from "@/components/pages/StaffPage";
import { useAuth } from "@/components/AuthContext";

export default function Staff() {
  const { user } = useAuth();

  return (
    <div className="layout-wrapper">
      <Topbar />
      <Sidebar />
      <div className="scrollable-content">
        <div className="flex-1">
          <StaffPage user={user} />
        </div>
      </div>
    </div>
  );
}
