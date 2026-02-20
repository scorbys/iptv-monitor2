"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  UserIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { DateFormatter } from "../DateFormatter";

interface User {
  _id: string;
  userId: string;
  username: string;
  email: string;
  role: string;
  provider: string;
  googleId?: string;
  createdAt: string;
  isActive?: boolean;
}

interface UsersPageProps {
  user: any;
}

const ITEMS_PER_PAGE = 10;

export default function UsersPage({ user }: UsersPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [providerFilter, setProviderFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; userId: string; username: string } | null>(null);
  const [roleModal, setRoleModal] = useState<{ open: boolean; userId: string; username: string; newRole: string } | null>(null);
  const [modalError, setModalError] = useState<{ title: string; message: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  // Fetch users from backend
  const fetchUsers = useCallback(async () => {
    if (!mounted) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;

      const response = await fetch(`${apiUrl}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [mounted]);

  // Initial data load
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchUsers();
    }
  }, [mounted, fetchUsers]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchUsers().catch(console.error);
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [mounted, fetchUsers]);

  // Manual refresh
  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetchUsers();
    } finally {
      setRefreshing(false);
    }
  };

  // Delete user
  const handleDeleteUser = (userId: string, username: string) => {
    setDeleteModal({ open: true, userId, username });
  };

  const confirmDeleteUser = async () => {
    if (!deleteModal) return;

    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;

      const response = await fetch(`${apiUrl}/api/users/${deleteModal.userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setDeleteModal(null);
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
      setModalError({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to delete user"
      });
      setDeleteModal(null);
    }
  };

  // Change user role
  const handleChangeRole = (userId: string, newRole: string, username: string) => {
    setRoleModal({ open: true, userId, username, newRole });
  };

  const confirmChangeRole = async () => {
    if (!roleModal) return;

    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;

      const response = await fetch(`${apiUrl}/api/users/${roleModal.userId}/role`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: roleModal.newRole }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setRoleModal(null);
      fetchUsers();
    } catch (err) {
      console.error("Failed to change role:", err);
      setModalError({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to change role"
      });
      setRoleModal(null);
    }
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === "" ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "All" || user.role === roleFilter;
      const matchesProvider = providerFilter === "All" || user.provider === providerFilter;

      return matchesSearch && matchesRole && matchesProvider;
    });
  }, [users, searchQuery, roleFilter, providerFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Memoized categories
  const roles = useMemo(
    () => ["All", ...Array.from(new Set(users.map((u) => u.role).filter(Boolean)))],
    [users]
  );

  const providers = useMemo(
    () => ["All", ...Array.from(new Set(users.map((u) => u.provider).filter(Boolean)))],
    [users]
  );

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, providerFilter]);

  // Get role badge config
  const getRoleBadge = (role: string) => {
    const config = {
      admin: {
        color: "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200",
        icon: ShieldCheckIcon,
        label: "Admin"
      },
      guest: {
        color: "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200",
        icon: UserIcon,
        label: "Guest"
      },
      user: {
        color: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200",
        icon: UserIcon,
        label: "User"
      },
    };
    return config[role as keyof typeof config] || {
      color: "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200",
      icon: UserIcon,
      label: role
    };
  };

  // Get provider icon
  const getProviderBadge = (provider: string) => {
    return provider === "google"
      ? "bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border-indigo-200"
      : "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-200";
  };

  // Status badge component
  const StatusBadge = useCallback(({ status }: { status: string }) => (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
        status === "active"
          ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200"
          : "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200"
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full mr-2 ${status === "active" ? "bg-green-500 animate-pulse" : "bg-red-500"
        }`}
      ></div>
      {status === "active" ? "Active" : "Inactive"}
    </span>
  ), []);

  // Loading state
  if (loading) {
    return (
      <div className="p-6 bg-blue-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-blue-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <ShieldCheckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              User Management
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
          >
            <ArrowPathIcon className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            <span className="font-medium">{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-red-700 text-sm">Error: {error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          {/* Search Bar */}
          <div className="relative w-full lg:flex-1">
            <MagnifyingGlassIcon className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 w-full bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all duration-200 placeholder-gray-500 text-sm sm:text-base"
            />
          </div>

          {/* Role Filter */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md group min-w-[140px]">
                <span className="text-sm font-medium text-blue-700 truncate">
                  {roleFilter === "All" ? "All Roles" : roleFilter}
                </span>
                <ChevronDownIcon className="w-4 h-4 text-blue-500 group-hover:text-blue-600 transition-colors flex-shrink-0" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="min-w-[140px] bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50">
                {roles.map((role) => (
                  <DropdownMenu.Item
                    key={`role-${role}`}
                    className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer outline-none transition-all duration-150"
                    onClick={() => setRoleFilter(role)}
                  >
                    {role}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* Provider Filter */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl hover:from-green-100 hover:to-emerald-100 hover:border-green-300 transition-all duration-200 shadow-sm hover:shadow-md group min-w-[140px]">
                <span className="text-sm font-medium text-green-700 truncate">
                  {providerFilter === "All" ? "All Providers" : providerFilter}
                </span>
                <ChevronDownIcon className="w-4 h-4 text-green-500 group-hover:text-green-600 transition-colors flex-shrink-0" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="min-w-[140px] bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50">
                {providers.map((provider) => (
                  <DropdownMenu.Item
                    key={`provider-${provider}`}
                    className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg cursor-pointer outline-none transition-all duration-150"
                    onClick={() => setProviderFilter(provider)}
                  >
                    {provider}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                        <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No users found
                      </h3>
                      <p className="text-gray-500 text-sm mb-4">
                        Try adjusting your search or filters
                      </p>
                      {(searchQuery || roleFilter !== "All" || providerFilter !== "All") && (
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setRoleFilter("All");
                            setProviderFilter("All");
                          }}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all duration-200"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((userData) => {
                  const roleConfig = getRoleBadge(userData.role);
                  const RoleIcon = roleConfig.icon;

                  return (
                    <tr
                      key={userData._id}
                      className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200"
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                            <span className="text-sm font-bold text-white">
                              {userData.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {userData.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="text-sm text-gray-600 truncate">{userData.email}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${roleConfig.color}`}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {roleConfig.label}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getProviderBadge(userData.provider)}`}>
                          {userData.provider === "google" ? "🔷" : "📧"} {userData.provider}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <StatusBadge status={userData.isActive !== false ? "active" : "inactive"} />
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <DateFormatter date={userData.createdAt} fallback="Unknown" />
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Role Dropdown */}
                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                              <button
                                disabled={userData._id === user?._id}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              title="Change role"
                              >
                                Change Role
                                <ChevronDownIcon className="w-3 h-3 ml-1" />
                              </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                              <DropdownMenu.Content className="min-w-[140px] bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50">
                                {["admin", "guest", "user"].filter(r => r !== userData.role).map((role) => (
                                  <DropdownMenu.Item
                                    key={role}
                                    className="flex items-center px-3 py-2.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer outline-none transition-all duration-150"
                                    onClick={() => handleChangeRole(userData._id, role, userData.username)}
                                  >
                                    {role === "admin" ? "Admin" : role === "guest" ? "Guest" : "User"}
                                  </DropdownMenu.Item>
                                ))}
                              </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                          </DropdownMenu.Root>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteUser(userData._id, userData.username)}
                            disabled={userData._id === user?._id}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            title={userData._id === user?._id ? "Cannot delete your own account" : "Delete user"}
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)}
              </span>{" "}
              of <span className="font-semibold text-gray-900">{filteredUsers.length}</span> users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        currentPage === pageNum
                          ? "text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-md"
                          : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Are you sure you want to delete user <b>{deleteModal.username}</b>?
            </p>
            <p className="text-xs text-red-600 mb-6">
              This action cannot be undone and will permanently remove the user account.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Confirmation Modal */}
      {roleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Change User Role</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Change role for user <b>{roleModal.username}</b> to{" "}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                {roleModal.newRole}
              </span>?
            </p>
            <p className="text-xs text-gray-500 mb-6">
              This will affect the user's permissions and access immediately.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRoleModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmChangeRole}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
              >
                Change Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {modalError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{modalError.title}</h3>
            </div>
            <div className="mb-6">
              <p className="text-sm text-red-600">{modalError.message}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setModalError(null)}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
