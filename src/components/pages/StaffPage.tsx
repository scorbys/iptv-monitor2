"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { componentLogger, apiLogger } from "@/utils/debugLogger";
import { DateFormatter } from "../DateFormatter";

interface Staff {
  _id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  isActive: boolean;
  avatar: string | null;
  stats: {
    totalAssigned: number;
    totalResolved: number;
    avgResolutionTime: number;
    successRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface StaffPageProps {
  user: any;
}

const ITEMS_PER_PAGE = 10;

export default function StaffPage({ user }: StaffPageProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalError, setModalError] = useState<{ title: string; message: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ staffId: string; name: string } | null>(null);
  const [toggleModal, setToggleModal] = useState<{ staffId: string; name: string; currentStatus: boolean } | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [createStaffForm, setCreateStaffForm] = useState({ name: "", email: "", phone: "", department: "", position: "" });
  const [createLoading, setCreateLoading] = useState(false);

  const departments = ["All", "IT Support", "Engineering"];
  const statuses = ["All", "Active", "Inactive"];

  // Fetch staff from backend
  const fetchStaff = useCallback(async () => {
    try {
      setError(null);

      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;

      const response = await fetch(`${apiUrl}/api/staff`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setStaff(data.staff || []);
    } catch (err) {
      apiLogger.error("Failed to fetch staff:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchStaff();
  }, [fetchStaff]);

  // ESC key handler to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDeleteModal(null);
        setToggleModal(null);
        setModalError(null);
        setCreateModal(false);
      }
    };

    if (deleteModal || toggleModal || modalError || createModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [deleteModal, toggleModal, modalError, createModal]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchStaff().catch((err) => apiLogger.error("Auto-refresh error:", err));
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [mounted, fetchStaff]);

  // Delete staff
  const confirmDeleteStaff = async () => {
    if (!deleteModal) return;

    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;

      const response = await fetch(`${apiUrl}/api/staff/${deleteModal.staffId}`, {
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
      fetchStaff();
    } catch (err) {
      apiLogger.error("Failed to delete staff:", err);
      setModalError({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to delete staff"
      });
      setDeleteModal(null);
    }
  };

  // Toggle staff active status
  const confirmToggleActive = async () => {
    if (!toggleModal) return;

    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;

      const response = await fetch(`${apiUrl}/api/staff/${toggleModal.staffId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !toggleModal.currentStatus }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setToggleModal(null);
      fetchStaff();
    } catch (err) {
      apiLogger.error("Failed to toggle staff status:", err);
      setModalError({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to update staff"
      });
      setToggleModal(null);
    }
  };

  // Create staff
  const handleCreateStaff = async () => {
    if (!createStaffForm.name || !createStaffForm.email) {
      setModalError({
        title: "Validation Error",
        message: "Name and email are required"
      });
      return;
    }

    try {
      setCreateLoading(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;

      const response = await fetch(`${apiUrl}/api/staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createStaffForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      setCreateModal(false);
      setCreateStaffForm({ name: "", email: "", phone: "", department: "", position: "" });
      fetchStaff();
    } catch (err) {
      apiLogger.error("Failed to create staff:", err);
      setModalError({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to create staff"
      });
    } finally {
      setCreateLoading(false);
    }
  };

  // Filter staff
  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch =
        searchQuery === "" ||
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.phone.includes(searchQuery);

      const matchesDepartment = departmentFilter === "All" || member.department === departmentFilter;
      const matchesStatus = statusFilter === "All" ||
        (statusFilter === "Active" && member.isActive) ||
        (statusFilter === "Inactive" && !member.isActive);

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [staff, searchQuery, departmentFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredStaff.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStaff = filteredStaff.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilter, statusFilter]);

  // Get department badge config
  const getDepartmentConfig = (department: string) => {
    const config: Record<string, { icon: any; color: string; bg: string; text: string }> = {
      "IT Support": {
        icon: BuildingOfficeIcon,
        color: "bg-blue-100 text-blue-700 border-blue-200",
        bg: "bg-blue-50",
        text: "text-blue-700"
      },
      "Engineering": {
        icon: BriefcaseIcon,
        color: "bg-indigo-100 text-indigo-700 border-indigo-200",
        bg: "bg-indigo-50",
        text: "text-indigo-700"
      },
    };
    return config[department] || {
      icon: UserIcon,
      color: "bg-gray-100 text-gray-700 border-gray-200",
      bg: "bg-gray-50",
      text: "text-gray-700"
    };
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <UserGroupIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            Staff Management
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage staff members, assignments, and performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStaff}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
          >
            <PlusIcon className="w-4 h-4" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-900">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          {/* Search Bar */}
          <div className="relative w-full lg:flex-1">
            <MagnifyingGlassIcon className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 w-full bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all duration-200 placeholder-gray-500 text-sm sm:text-base"
            />
          </div>

          {/* Department Filter Dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md group min-w-[160px]">
                <span className="text-sm font-medium text-blue-700 truncate">
                  {departmentFilter === "All" ? "All Departments" : departmentFilter}
                </span>
                <ChevronDownIcon className="w-4 h-4 text-blue-500 group-hover:text-blue-600 transition-colors flex-shrink-0" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="min-w-[160px] bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50">
                {departments.map((dept) => (
                  <DropdownMenu.Item
                    key={`dept-${dept}`}
                    className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer outline-none transition-all duration-150"
                    onClick={() => setDepartmentFilter(dept)}
                  >
                    {dept === "All" ? "All Departments" : dept}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* Status Filter Dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl hover:from-gray-100 hover:to-gray-150 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md group min-w-[140px]">
                <span className="text-sm font-medium text-gray-700 truncate">
                  {statusFilter === "All" ? "All Status" : statusFilter}
                </span>
                <ChevronDownIcon className="w-4 h-4 text-gray-500 group-hover:text-gray-600 transition-colors flex-shrink-0" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="min-w-[140px] bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50">
                {statuses.map((status) => (
                  <DropdownMenu.Item
                    key={`status-${status}`}
                    className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg cursor-pointer outline-none transition-all duration-150"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === "All" ? "All Status" : status}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 font-medium">Loading staff...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                    Performance
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 sm:px-6 py-12">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-900">No staff found</p>
                          <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
                          {(searchQuery || departmentFilter !== "All" || statusFilter !== "All") && (
                            <button
                              onClick={() => {
                                setSearchQuery("");
                                setDepartmentFilter("All");
                                setStatusFilter("All");
                              }}
                              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Clear all filters
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedStaff.map((member) => {
                    const deptConfig = getDepartmentConfig(member.department);
                    const DeptIcon = deptConfig.icon;

                    return (
                      <tr
                        key={member._id}
                        className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200"
                      >
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                              <span className="text-sm font-bold text-white">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {member.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                ID: {member._id.slice(-6)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <EnvelopeIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <p className="text-xs text-gray-600 truncate">{member.email}</p>
                            </div>
                            {member.phone && (
                              <div className="flex items-center gap-2">
                                <PhoneIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <p className="text-xs text-gray-600">{member.phone}</p>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${deptConfig.color}`}>
                            <DeptIcon className="w-3 h-3" />
                            {member.department}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                            {member.role}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                            member.isActive
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}>
                            {member.isActive ? (
                              <CheckIcon className="w-3 h-3" />
                            ) : (
                              <XMarkIcon className="w-3 h-3" />
                            )}
                            {member.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Assigned:</span>
                              <span className="text-xs font-semibold text-gray-900">{member.stats.totalAssigned}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Resolved:</span>
                              <span className="text-xs font-semibold text-gray-900">{member.stats.totalResolved}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Success:</span>
                              <span className={`text-xs font-semibold ${
                                member.stats.successRate >= 80
                                  ? "text-green-600"
                                  : member.stats.successRate >= 50
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}>
                                {member.stats.successRate.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setToggleModal({ staffId: member._id, name: member.name, currentStatus: member.isActive })}
                              className={`p-2 rounded-lg transition-all duration-200 ${
                                member.isActive
                                  ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                                  : "bg-green-50 text-green-600 hover:bg-green-100"
                              }`}
                              title={member.isActive ? "Deactivate" : "Activate"}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteModal({ staffId: member._id, name: member.name })}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200"
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4" />
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium text-gray-900">{startIndex + 1}</span> to{" "}
                  <span className="font-medium text-gray-900">{Math.min(startIndex + ITEMS_PER_PAGE, filteredStaff.length)}</span> of{" "}
                  <span className="font-medium text-gray-900">{filteredStaff.length}</span> staff
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 text-sm font-medium rounded-lg transition-all duration-200 ${
                          currentPage === page
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setDeleteModal(null)}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Staff</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Are you sure you want to delete staff member <b>{deleteModal.name}</b>?
            </p>
            <p className="text-xs text-red-600 mb-6">
              This action cannot be undone and will permanently remove the staff member from the system.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteStaff}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Active Confirmation Modal */}
      {toggleModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setToggleModal(null)}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${toggleModal.currentStatus ? "bg-orange-100" : "bg-green-100"}`}>
                <PencilIcon className={`w-6 h-6 ${toggleModal.currentStatus ? "text-orange-600" : "text-green-600"}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {toggleModal.currentStatus ? "Deactivate" : "Activate"} Staff
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to <b>{toggleModal.currentStatus ? "deactivate" : "activate"}</b> staff member{" "}
              <b>{toggleModal.name}</b>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setToggleModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmToggleActive}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 ${
                  toggleModal.currentStatus
                    ? "bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                    : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                }`}
              >
                {toggleModal.currentStatus ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {modalError && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setModalError(null)}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{modalError.title}</h3>
            </div>
            <p className="text-sm text-red-600 mb-6">{modalError.message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setModalError(null)}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Staff Modal */}
      {createModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setCreateModal(false)}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserGroupIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Create New Staff</h3>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={createStaffForm.name}
                    onChange={(e) => setCreateStaffForm({ ...createStaffForm, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="staff@example.com"
                    value={createStaffForm.email}
                    onChange={(e) => setCreateStaffForm({ ...createStaffForm, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="+1234567890"
                    value={createStaffForm.phone}
                    onChange={(e) => setCreateStaffForm({ ...createStaffForm, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 text-sm text-left">
                      <span className={createStaffForm.department ? "text-gray-900" : "text-gray-500"}>
                        {createStaffForm.department || "Select department"}
                      </span>
                      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content className="w-full bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50">
                      {["IT Support", "Engineering"].map((dept) => (
                        <DropdownMenu.Item
                          key={dept}
                          className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer outline-none transition-all duration-150"
                          onClick={() => setCreateStaffForm({ ...createStaffForm, department: dept })}
                        >
                          {dept}
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Position</label>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 text-sm text-left">
                      <span className={createStaffForm.position ? "text-gray-900" : "text-gray-500"}>
                        {createStaffForm.position || "Select position"}
                      </span>
                      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content className="w-full bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50">
                      {["Admin", "Supervisor", "Technician"].map((pos) => (
                        <DropdownMenu.Item
                          key={pos}
                          className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer outline-none transition-all duration-150"
                          onClick={() => setCreateStaffForm({ ...createStaffForm, position: pos })}
                        >
                          {pos}
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setCreateModal(false);
                  setCreateStaffForm({ name: "", email: "", phone: "", department: "", position: "" });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStaff}
                disabled={createLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200"
              >
                {createLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4" />
                    Create Staff
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
