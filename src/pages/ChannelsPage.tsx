"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { DateFormatter } from "../components/DateFormatter";
import { useRouter } from "next/navigation";

interface Channel {
  id: number;
  channelNumber: number;
  channelName: string;
  category: string;
  ipMulticast: string;
  logo: string;
  status: "online" | "offline";
  lastChecked: string;
  responseTime?: number;
  error?: string;
  slug?: string;
}

interface ChannelStats {
  totalChannels: number;
  onlineChannels: number;
  offlineChannels: number;
  uptime: string;
  categoryStats: Record<
    string,
    { total: number; online: number; offline: number }
  >;
  lastUpdated: string;
}

const ITEMS_PER_PAGE = 12;

const isValidUrl = (string: string) => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [checkingId, setCheckingId] = useState<number | null>(null);
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );

  const router = useRouter();

  const handleChannelClick = useCallback(
    (channel: Channel) => {
      const channelId = channel.channelName || channel.id;
      router.push(`/channels/${channelId}`);
    },
    [router]
  );

  // Effect untuk mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch channels data
  const fetchChannels = useCallback(async () => {
    if (!mounted) return;

    try {
      const response = await fetch("/api/channels", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      });

      if (response.status === 401) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setChannels(result.data);
      } else {
        console.error("Invalid channels data format:", result);
        setChannels([]);
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
      setChannels([]);
    }
  }, [mounted]);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    if (!mounted) return;

    try {
      const response = await fetch("/api/channels/dashboard/stats", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      });

      if (response.status === 401) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setStats(result.data);
      } else {
        console.error("Invalid stats data format:", result);
        setStats(null);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats(null);
    }
  }, [mounted]);

  // Effect untuk initial data load
  useEffect(() => {
    if (!mounted) return;

    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchChannels(), fetchStats()]);
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up auto-refresh every 2 minutes
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        Promise.all([fetchChannels(), fetchStats()]).catch(console.error);
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [mounted, fetchChannels, fetchStats]);

  // Manual refresh dengan loading state
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      await Promise.all([fetchChannels(), fetchStats()]);
    } catch (error) {
      console.error("Error refreshing data:", error);

      if (error instanceof Error && !error.message.includes("401")) {
        alert("Failed to refresh data. Please try again.");
      }
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, fetchChannels, fetchStats]);

  // Check specific channel status
  const checkChannelStatus = useCallback(
    async (channel: Channel) => {
      if (!channel) return;

      const identifier =
        channel.channelNumber?.toString() || channel.id.toString();

      setCheckingId(channel.id);

      try {
        const response = await fetch(`/api/channels/${identifier}/check`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (response.status === 401) {
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          setChannels((prev) =>
            prev.map((ch) =>
              ch.id === channel.id
                ? { ...ch, ...result.data, error: undefined }
                : ch
            )
          );
          await fetchStats();
        } else {
          setChannels((prev) =>
            prev.map((ch) =>
              ch.id === channel.id
                ? {
                  ...ch,
                  error: result.message || "Check failed",
                  status: "offline" as const,
                }
                : ch
            )
          );
        }
      } catch (error: unknown) {
        console.error("Error checking channel status:", error);
        setChannels((prev) =>
          prev.map((ch) =>
            ch.id === channel.id
              ? {
                ...ch,
                error:
                  error instanceof Error ? error.message : "Network error",
                status: "offline" as const,
              }
              : ch
          )
        );
      } finally {
        setCheckingId(null);
      }
    },
    [fetchStats]
  );

  // Memoized filtered channels untuk performance
  const filteredChannels = useMemo(() => {
    return channels.filter((channel) => {
      const matchesSearch =
        channel.channelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        channel.channelNumber?.toString().includes(searchTerm) ||
        false;

      const matchesCategory =
        categoryFilter === "All" || channel.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All" || channel.status === statusFilter.toLowerCase();

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [channels, searchTerm, categoryFilter, statusFilter]);

  // Memoized pagination
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredChannels.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedChannels = filteredChannels.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

    return {
      totalPages,
      startIndex,
      paginatedChannels,
      endIndex: Math.min(startIndex + ITEMS_PER_PAGE, filteredChannels.length),
    };
  }, [filteredChannels, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset page ketika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  // Handle responsive window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScreenSize("mobile");
      } else if (width < 1024) {
        setScreenSize("tablet");
      } else {
        setScreenSize("desktop");
      }
    };

    // Set initial value
    if (typeof window !== "undefined") {
      handleResize();
      window.addEventListener("resize", handleResize);

      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Memoized categories
  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(channels.map((ch) => ch.category).filter(Boolean))),
    ],
    [channels]
  );

  // Status badge component untuk konsistensi
  const StatusBadge = useCallback(
    ({
      status,
      responseTime,
      isMobile = false,
    }: {
      status: string;
      responseTime?: number;
      isMobile?: boolean;
    }) => (
      <div>
        <span
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${status === "online"
            ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200"
            : "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200"
            }`}
        >
          <div
            className={`w-2 h-2 rounded-full mr-2 ${status === "online" ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
          ></div>
          {status
            ? status.charAt(0).toUpperCase() + status.slice(1)
            : "Unknown"}
        </span>
        {responseTime && !isMobile && (
          <div className="text-xs text-gray-500 mt-1 ml-1">
            {responseTime}ms
          </div>
        )}
      </div>
    ),
    []
  );

  // Export to CSV function
  const exportToCSV = useCallback(() => {
    if (exportLoading) return;

    setExportLoading(true);

    try {
      const headers = [
        "Channel Number",
        "Channel Name",
        "Category",
        "IP Multicast",
        "Status",
        "Response Time (ms)",
        "Last Checked",
        "Logo URL",
      ];

      const csvData = filteredChannels.map((channel) => [
        channel.channelNumber?.toString() || "",
        (channel.channelName || "").replace(/"/g, '""'),
        (channel.category || "").replace(/"/g, '""'),
        channel.ipMulticast || "",
        channel.status || "",
        channel.responseTime?.toString() || "",
        channel.lastChecked || "",
        channel.logo || "",
      ]);

      const csvContent = [headers, ...csvData]
        .map((row) =>
          row
            .map((field) => {
              const stringField = String(field);
              if (
                stringField.includes(",") ||
                stringField.includes('"') ||
                stringField.includes("\n") ||
                stringField.includes("\r")
              ) {
                return `"${stringField.replace(/"/g, '""')}"`;
              }
              return stringField;
            })
            .join(",")
        )
        .join("\n");

      const bom = "\uFEFF";
      const blob = new Blob([bom + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);

        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/[:-]/g, "");
        const filename = `channels_export_${timestamp}.csv`;
        link.setAttribute("download", filename);

        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Failed to export CSV. Please try again.");
    } finally {
      setExportLoading(false);
    }
  }, [filteredChannels, exportLoading]);

  const getVisiblePages = useCallback(
    (currentPage: number, totalPages: number, screenSize: string) => {
      let maxVisiblePages: number;
      let showFirstLast: boolean;

      switch (screenSize) {
        case "mobile":
          maxVisiblePages = 3;
          showFirstLast = false;
          break;
        case "tablet":
          maxVisiblePages = 5;
          showFirstLast = true;
          break;
        default: // desktop
          maxVisiblePages = 7;
          showFirstLast = true;
          break;
      }

      let startPage = Math.max(
        1,
        currentPage - Math.floor(maxVisiblePages / 2)
      );
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      return {
        startPage,
        endPage,
        maxVisiblePages,
        showFirstLast,
        showEllipsis: {
          start: showFirstLast && startPage > 2,
          end: showFirstLast && endPage < totalPages - 1,
        },
      };
    },
    []
  );

  // Jika belum mounted atau loading, return loading state
  if (!mounted || loading) {
    return (
      <div className="p-6 bg-blue-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading channels...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-blue-50 min-h-screen">
      {/* Header Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transform hover:-translate-y-1 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">
                  Total Channels
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalChannels || 0}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <SignalIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transform hover:-translate-y-1 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Online</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.onlineChannels || 0}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transform hover:-translate-y-1 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">
                  Offline
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {stats.offlineChannels || 0}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transform hover:-translate-y-1 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">
                  System Uptime
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.uptime || "0"}%
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${parseFloat(stats.uptime || "0") >= 95
                    ? "bg-gradient-to-br from-green-100 to-emerald-100"
                    : parseFloat(stats.uptime || "0") >= 80
                      ? "bg-gradient-to-br from-yellow-100 to-orange-100"
                      : "bg-gradient-to-br from-red-100 to-pink-100"
                    }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full ${parseFloat(stats.uptime || "0") >= 95
                      ? "bg-green-500"
                      : parseFloat(stats.uptime || "0") >= 80
                        ? "bg-yellow-500"
                        : "bg-red-500"
                      }`}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          {/* Search Bar */}
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder={
                screenSize === "mobile"
                  ? "Search..."
                  : "Search channels, categories, or numbers..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 w-full bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all duration-200 placeholder-gray-500 text-sm sm:text-base"
            />
          </div>

          {/* Filters and Actions */}
          <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto">
            {/* Category Filter */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg sm:rounded-xl hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md group flex-1 sm:flex-initial min-w-0">
                  <span className="text-xs sm:text-sm text-blue-700 font-medium truncate">
                    {categoryFilter === "All"
                      ? screenSize === "mobile"
                        ? "All"
                        : "All Categories"
                      : categoryFilter}
                  </span>
                  <ChevronDownIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="min-w-[140px] sm:min-w-48 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 backdrop-blur-sm">
                  {categories.map((category) => (
                    <DropdownMenu.Item
                      key={`category-${category}`}
                      className="flex items-center px-3 py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer outline-none transition-all duration-150 group"
                      onClick={() => setCategoryFilter(category)}
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {category}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Status Filter */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg sm:rounded-xl hover:from-green-100 hover:to-emerald-100 hover:border-green-300 transition-all duration-200 shadow-sm hover:shadow-md group flex-1 sm:flex-initial min-w-0">
                  <span className="text-xs sm:text-sm text-green-700 font-medium truncate">
                    {statusFilter === "All"
                      ? screenSize === "mobile"
                        ? "All"
                        : "All Status"
                      : statusFilter}
                  </span>
                  <ChevronDownIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 group-hover:text-green-600 transition-colors flex-shrink-0" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="min-w-[120px] sm:min-w-32 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 backdrop-blur-sm">
                  {["All", "Online", "Offline"].map((status) => (
                    <DropdownMenu.Item
                      key={`status-${status}`}
                      className="flex items-center px-3 py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg cursor-pointer outline-none transition-all duration-150 group"
                      onClick={() => setStatusFilter(status)}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mr-3 ${status === "Online"
                          ? "bg-green-500"
                          : status === "Offline"
                            ? "bg-red-500"
                            : "bg-gray-400"
                          } opacity-0 group-hover:opacity-100 transition-opacity`}
                      ></div>
                      {status}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              disabled={exportLoading || filteredChannels.length === 0}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg sm:rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95 touch-target"
              title={exportLoading ? "Exporting..." : "Export CSV"}
            >
              <ArrowDownTrayIcon className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                {exportLoading ? "Exporting..." : "Export"}
              </span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95 touch-target"
              title={refreshing ? "Refreshing..." : "Refresh"}
            >
              <ArrowPathIcon
                className={`w-4 h-4 flex-shrink-0 ${refreshing ? "animate-spin" : ""
                  }`}
              />
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Channels Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-4 sm:px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Name & Logo
                </th>
                <th className="hidden sm:table-cell px-4 sm:px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="hidden lg:table-cell px-4 sm:px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  IP Multicast
                </th>
                <th className="px-4 sm:px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="hidden md:table-cell px-4 sm:px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Last Checked
                </th>
                <th className="px-4 sm:px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginationData.paginatedChannels.map((channel, index) => (
                <tr
                  key={`channel-${channel.id || index}`}
                  onClick={() => handleChannelClick(channel)}
                  className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 group cursor-pointer"
                >
                  <td className="px-4 sm:px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200 transform group-hover:scale-105">
                        <span className="text-sm font-bold text-white">
                          {channel.channelNumber || "-"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {channel.logo && (
                        <div className="h-10 w-20 relative bg-gray-50 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-200">
                          {channel.logo && isValidUrl(channel.logo) ? (
                            <Image
                              src={channel.logo}
                              alt={channel.channelName || "Channel logo"}
                              fill
                              className="object-contain p-1"
                              sizes="80px"
                              unoptimized
                            />
                          ) : (
                            <div className="h-10 w-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center">
                              <span className="text-xs text-gray-500">
                                No Logo
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {channel.channelName || "Unknown Channel"}
                        </div>
                        <div className="text-xs text-gray-500 sm:hidden">
                          {channel.category || "Uncategorized"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 sm:px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                      {channel.category || "Uncategorized"}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell px-4 sm:px-4 py-4 whitespace-nowrap">
                    <code className="text-sm text-gray-900 px-2 py-1 bg-gray-100 rounded-lg font-mono">
                      {channel.ipMulticast || "N/A"}
                    </code>
                  </td>
                  <td className="px-4 sm:px-4 py-4 whitespace-nowrap">
                    <StatusBadge status={channel.status} isMobile={false} />
                  </td>
                  <td className="hidden md:table-cell px-4 sm:px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    <DateFormatter
                      date={channel.lastChecked}
                      fallback="Never"
                      className="text-xs"
                    />
                  </td>
                  <td className="px-4 sm:px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation(); // Prevent row click
                        checkChannelStatus(channel);
                      }}
                      disabled={!channel.id || checkingId === channel.id}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 disabled:text-gray-400 disabled:bg-gray-50 disabled:border-gray-200 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
                    >
                      <ArrowPathIcon
                        className={`w-3 h-3 mr-1 ${checkingId === channel.id ? "animate-spin" : ""
                          }`}
                      />
                      {checkingId === channel.id ? "Checking..." : "Check"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden divide-y divide-gray-100">
          {paginationData.paginatedChannels.map((channel, index) => (
            <div
              key={`mobile-channel-${channel.id || index}`}
              onClick={() => handleChannelClick(channel)}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm">
                    {channel.logo && (
                      <div className="h-8 w-16 relative bg-gray-50 rounded-lg overflow-hidden shadow-sm">
                        {channel.logo && isValidUrl(channel.logo) ? (
                          <Image
                            src={channel.logo}
                            alt={channel.channelName || "Channel logo"}
                            fill
                            className="object-contain p-1"
                            sizes="64px"
                            unoptimized
                            priority={index < 4}
                          />
                        ) : (
                          <div className="h-10 w-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center">
                            <span className="text-xs text-gray-500">
                              No Logo
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {channel.channelName || "Unknown Channel"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {channel.channelNumber || "Uncategorized"}
                    </p>
                  </div>
                </div>
                <StatusBadge
                  status={channel.status}
                  responseTime={channel.responseTime}
                />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">IP Address:</span>
                  <code className="text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs">
                    {channel.ipMulticast || "N/A"}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Checked:</span>
                  <DateFormatter
                    date={channel.lastChecked}
                    fallback="Never checked"
                    className="text-xs text-gray-600"
                  />
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation(); // Prevent row click
                    checkChannelStatus(channel);
                  }}
                  disabled={!channel.id || checkingId === channel.id}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 disabled:text-gray-400 disabled:bg-gray-50 disabled:border-gray-200 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Check Now
                </button>
              </div>

              {/* Error message */}
              {channel.error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600 break-words">
                    {channel.error}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile-friendly empty state */}
        {filteredChannels.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
              <SignalIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No channels found
            </h3>
            <p className="text-gray-500 mb-4 text-sm">
              {searchTerm
                ? `No channels match "${searchTerm}"`
                : "No channels available with current filters"}
            </p>
            {(searchTerm ||
              categoryFilter !== "All" ||
              statusFilter !== "All") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("All");
                    setStatusFilter("All");
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  Clear all filters
                </button>
              )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {paginationData.totalPages > 1 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6 backdrop-blur-sm">
          <div
            className={`flex items-center justify-between gap-2 sm:gap-4 ${screenSize === "mobile"
              ? "flex-col space-y-3"
              : "flex-col sm:flex-row"
              }`}
          >
            {/* Info Text - Responsive positioning */}
            <div
              className={`text-xs sm:text-sm text-gray-600 ${screenSize === "mobile" ? "order-2" : "order-2 sm:order-1"
                }`}
            >
              {screenSize === "mobile" ? (
                // Compact info for mobile
                <div className="text-center bg-gray-50 px-3 py-2 rounded-lg border">
                  <span className="font-medium">
                    Page {currentPage} of {paginationData.totalPages}
                  </span>
                  <span className="block text-xs text-gray-500 mt-1">
                    ({paginationData.startIndex + 1}-{paginationData.endIndex}{" "}
                    of {filteredChannels.length} channels)
                  </span>
                </div>
              ) : (
                // Full info for tablet/desktop
                <>
                  Showing{" "}
                  <span className="font-semibold text-gray-900">
                    {paginationData.startIndex + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-gray-900">
                    {paginationData.endIndex}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-900">
                    {filteredChannels.length}
                  </span>{" "}
                  channels
                </>
              )}
            </div>

            {/* Pagination Controls */}
            <div
              className={`flex items-center gap-1 sm:gap-2 ${screenSize === "mobile" ? "order-1" : "order-1 sm:order-2"
                }`}
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 ${screenSize === "mobile" ? "min-w-[60px]" : ""
                  }`}
              >
                <ChevronLeftIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                {screenSize !== "mobile" && (
                  <span className="hidden sm:inline">Previous</span>
                )}
                {screenSize === "mobile" && (
                  <span className="text-xs">Prev</span>
                )}
              </button>

              {/* Page Numbers - Fully Responsive */}
              <div className="flex items-center gap-1">
                {(() => {
                  const { totalPages } = paginationData;
                  const { startPage, endPage, showFirstLast, showEllipsis } =
                    getVisiblePages(currentPage, totalPages, screenSize);

                  const pages = [];

                  // First page + ellipsis (desktop/tablet only)
                  if (showFirstLast && startPage > 1) {
                    pages.push(
                      <button
                        key="page-1"
                        onClick={() => handlePageChange(1)}
                        className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${currentPage === 1
                          ? "text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-md"
                          : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        1
                      </button>
                    );

                    if (showEllipsis.start) {
                      pages.push(
                        <span
                          key="ellipsis-start"
                          className="px-1 sm:px-2 py-2 text-gray-400 text-xs sm:text-sm"
                        >
                          ...
                        </span>
                      );
                    }
                  }

                  // Main page numbers
                  for (let i = startPage; i <= endPage; i++) {
                    // Skip last page, will be added separately
                    if (
                      showFirstLast &&
                      i === totalPages &&
                      totalPages > endPage
                    )
                      continue;

                    pages.push(
                      <button
                        key={`page-${i}-${currentPage}`}
                        onClick={() => handlePageChange(i)}
                        className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${currentPage === i
                          ? "text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-md"
                          : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        {i}
                      </button>
                    );
                  }

                  // Ellipsis + last page (desktop/tablet only)
                  if (showFirstLast && endPage < totalPages) {
                    if (showEllipsis.end) {
                      pages.push(
                        <span
                          key="ellipsis-end"
                          className="px-1 sm:px-2 py-2 text-gray-400 text-xs sm:text-sm"
                        >
                          ...
                        </span>
                      );
                    }

                    pages.push(
                      <button
                        key={`page-${totalPages}`}
                        onClick={() => handlePageChange(totalPages)}
                        className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${currentPage === totalPages
                          ? "text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-md"
                          : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        {totalPages}
                      </button>
                    );
                  }

                  return pages;
                })()}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === paginationData.totalPages}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 ${screenSize === "mobile" ? "min-w-[60px]" : ""
                  }`}
              >
                {screenSize !== "mobile" && (
                  <span className="hidden sm:inline">Next</span>
                )}
                {screenSize === "mobile" && (
                  <span className="text-xs">Next</span>
                )}
                <ChevronRightIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-4">
            {stats && stats.lastUpdated && (
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Last updated: <DateFormatter date={stats.lastUpdated} />
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Auto-refresh every 2 minutes
          </div>
        </div>
      </div>
    </div>
  );
}