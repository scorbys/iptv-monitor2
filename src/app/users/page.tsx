"use client";

import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import UsersPage from "@/pages/UsersPage";
import { useAuth } from "@/components/AuthContext";

export default function Users() {
  const { user } = useAuth();

  return (
    <div className="layout-wrapper">
      <Topbar />
      <Sidebar />
      <div className="scrollable-content">
        <div className="flex-1">
          <UsersPage user={user} />
        </div>
      </div>
    </div>
  );
}
