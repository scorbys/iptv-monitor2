"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Image from "next/image";
import { Button } from "@radix-ui/themes";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { DateFormatter } from "../components/DateFormatter"; // Import komponen DateFormatter

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

const ITEMS_PER_PAGE = 20;

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

  // Fetch channels data dengan error handling yang lebih baik
  const fetchChannels = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/channels', {
        credentials: 'include'
      });
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
  }, []);

  // Fetch dashboard stats dengan error handling yang lebih baik
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(
        'http://localhost:3001/api/channels/dashboard/stats', {
          credentials: 'include'
        }
      );
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
  }, []);

  // Effect untuk mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Effect untuk initial data load dan auto-refresh
  useEffect(() => {
    if (!mounted) return;

    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchChannels(), fetchStats()]);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up auto-refresh every 2 minutes
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchChannels();
        fetchStats();
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
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, fetchChannels, fetchStats]);

  // Check specific channel status
  const checkChannelStatus = useCallback(async (channelId: number) => {
    if (!channelId) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/channels/${channelId}/check`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setChannels((prev) =>
          prev.map((ch) =>
            ch.id === channelId ? { ...ch, ...result.data } : ch
          )
        );
      }
    } catch (error) {
      console.error("Error checking channel status:", error);
    }
  }, []);

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

  // Reset page ketika filter berubang
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

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
    ({ status }: { status: string }) => (
      <div>
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            status === "online"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full mr-1 ${
              status === "online" ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          {status
            ? status.charAt(0).toUpperCase() + status.slice(1)
            : "Unknown"}
        </span>
      </div>
    ),
    []
  );

  // Jika belum mounted, return loading state sederhana
  if (!mounted) {
    return (
      <div className="p-6 bg-blue-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading channels...</span>
        </div>
      </div>
    );
  }

  if (loading) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Total Channels
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalChannels || 0}
                </p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <SignalIcon className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Online</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.onlineChannels || 0}
                </p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Offline</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.offlineChannels || 0}
                </p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  System Uptime
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.uptime || "0"}%
                </p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    parseFloat(stats.uptime || "0") >= 95
                      ? "bg-green-100"
                      : parseFloat(stats.uptime || "0") >= 80
                      ? "bg-yellow-100"
                      : "bg-red-100"
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      parseFloat(stats.uptime || "0") >= 95
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
      <div className="bg-white rounded-lg p-4 shadow-sm border mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Left - Search */}
          <div className="relative w-full lg:w-96">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or channel number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full bg-gray-50 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all"
            />
          </div>

          {/* Right - Filters and Actions */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* Category Filter */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white hover:border-gray-300 transition-all min-w-32">
                  <span className="text-sm text-gray-700 font-medium">
                    {categoryFilter}
                  </span>
                  <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="min-w-48 bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50">
                  {categories.map((category) => (
                    <DropdownMenu.Item
                      key={`category-${category}`}
                      className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded cursor-pointer outline-none transition-colors"
                      onClick={() => setCategoryFilter(category)}
                    >
                      {category}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Status Filter */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white hover:border-gray-300 transition-all min-w-24">
                  <span className="text-sm text-gray-700 font-medium">
                    {statusFilter}
                  </span>
                  <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="min-w-32 bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50">
                  {["All", "Online", "Offline"].map((status) => (
                    <DropdownMenu.Item
                      key={`status-${status}`}
                      className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded cursor-pointer outline-none transition-colors"
                      onClick={() => setStatusFilter(status)}
                    >
                      {status}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              <ArrowPathIcon
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="text-sm font-medium">
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Channels Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name & Logo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  IP Multicast
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Last Checked
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginationData.paginatedChannels.map((channel, index) => (
                <tr
                  key={`channel-${channel.id || index}`}
                  className="hover:bg-blue-50/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-sm font-bold text-blue-700">
                          {channel.channelNumber || "-"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {channel.logo && (
                        <div className="h-10 w-20 relative bg-gray-50 rounded-lg border overflow-hidden">
                          <Image
                            src={channel.logo}
                            alt={channel.channelName || "Channel logo"}
                            fill
                            className="object-contain p-1"
                            sizes="80px"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {channel.channelName || "Unknown Channel"}
                        </div>
                        <div className="text-xs text-gray-500">
                          CH {channel.channelNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      {channel.category || "Uncategorized"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm text-gray-900 px-2 py-1 font-mono">
                      {channel.ipMulticast || "N/A"}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge
                      status={channel.status}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <DateFormatter
                      date={channel.lastChecked}
                      fallback="Never checked"
                      className="text-xs"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => checkChannelStatus(channel.id)}
                      disabled={!channel.id}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 disabled:text-gray-400 disabled:bg-gray-50 disabled:border-gray-200 disabled:cursor-not-allowed transition-all"
                    >
                      Check Now
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredChannels.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <SignalIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No channels found
            </h3>
            <p className="text-gray-500 mb-4">
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
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {paginationData.totalPages > 1 && (
        <div className="mt-6 bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-medium">
                {paginationData.startIndex + 1}
              </span>{" "}
              to <span className="font-medium">{paginationData.endIndex}</span>{" "}
              of <span className="font-medium">{filteredChannels.length}</span>{" "}
              channels
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="soft"
                size="2"
                className="disabled:opacity-50"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Previous
              </Button>

              {/* Smart pagination */}
              {(() => {
                const { totalPages } = paginationData;
                const maxVisiblePages = 5;
                let startPage = Math.max(
                  1,
                  currentPage - Math.floor(maxVisiblePages / 2)
                );
                const endPage = Math.min(
                  totalPages,
                  startPage + maxVisiblePages - 1
                );

                if (endPage - startPage < maxVisiblePages - 1) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }

                const pages = [];

                if (startPage > 1) {
                  pages.push(
                    <Button
                      key="page-1"
                      onClick={() => handlePageChange(1)}
                      variant="soft"
                      size="2"
                    >
                      1
                    </Button>
                  );
                  if (startPage > 2) {
                    pages.push(
                      <span
                        key="ellipsis-start"
                        className="px-2 py-1 text-gray-400"
                      >
                        ...
                      </span>
                    );
                  }
                }

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={`page-${i}`}
                      onClick={() => handlePageChange(i)}
                      className={
                        currentPage === i
                          ? "text-gray-600 font-semibold bg-gray-100 px-3 py-1 rounded"
                          : "text-gray-400 px-3 py-1 rounded"
                      }
                    >
                      {i}
                    </button>
                  );
                }

                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <span
                        key="ellipsis-end"
                        className="px-2 py-1 text-gray-400"
                      >
                        ...
                      </span>
                    );
                  }
                  pages.push(
                    <Button
                      key={`page-${totalPages}`}
                      onClick={() => handlePageChange(totalPages)}
                      variant="soft"
                      size="2"
                    >
                      {totalPages}
                    </Button>
                  );
                }

                return pages;
              })()}

              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === paginationData.totalPages}
                variant="soft"
                size="2"
                className="disabled:opacity-50"
              >
                Next
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
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
