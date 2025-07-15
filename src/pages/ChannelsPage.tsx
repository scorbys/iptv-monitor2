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

  const router = useRouter();

  // Effect untuk mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch channels data dengan error handling yang lebih baik
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
        // Token expired atau invalid, redirect ke login
        window.location.href = "/login";
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

  // Fetch dashboard stats dengan error handling yang lebih baik
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
        // Token expired atau invalid, redirect ke login
        window.location.href = "/login";
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

  // Effect untuk initial data load dengan better error handling
  useEffect(() => {
    if (!mounted) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Load data secara sequential untuk better error handling
        await fetchChannels();
        await fetchStats();
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up auto-refresh every 2 minutes
    const interval = setInterval(() => {
      // Cek visibility dan authentication state
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

  // Check specific channel status dengan better error handling
  const checkChannelStatus = useCallback(async (channelId: number) => {
    if (!channelId) return;

    try {
      const response = await fetch(`/api/channels/${channelId}/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

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
    ({ status, responseTime }: { status: string; responseTime?: number }) => (
      <div>
        <span
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            status === "online"
              ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200"
              : "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              status === "online" ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          ></div>
          {status
            ? status.charAt(0).toUpperCase() + status.slice(1)
            : "Unknown"}
        </span>
        {responseTime && (
          <div className="text-xs text-gray-500 mt-1 ml-1">
            {responseTime}ms
          </div>
        )}
      </div>
    ),
    []
  );

  // Jika belum mounted, return loading state sederhana
  if (!router || !mounted) {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 backdrop-blur-sm">
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

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 backdrop-blur-sm">
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

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 backdrop-blur-sm">
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

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 backdrop-blur-sm">
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
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    parseFloat(stats.uptime || "0") >= 95
                      ? "bg-gradient-to-br from-green-100 to-emerald-100"
                      : parseFloat(stats.uptime || "0") >= 80
                      ? "bg-gradient-to-br from-yellow-100 to-orange-100"
                      : "bg-gradient-to-br from-red-100 to-pink-100"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full ${
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 backdrop-blur-sm">
        <div className="flex flex-col space-y-4">
          {/* Search Bar - Full width on mobile */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search channels, categories, or numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 w-full bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all duration-200 placeholder-gray-500"
            />
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Filter Row */}
            <div className="flex flex-1 gap-3">
              {/* Category Filter */}
              <div className="flex-1 sm:flex-none">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="flex items-center justify-between w-full sm:w-auto gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md group">
                      <span className="text-sm text-blue-700 font-medium">
                        {categoryFilter === "All"
                          ? "All Categories"
                          : categoryFilter}
                      </span>
                      <ChevronDownIcon className="w-4 h-4 text-blue-500 group-hover:text-blue-600 transition-colors" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content className="min-w-48 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 backdrop-blur-sm">
                      {categories.map((category) => (
                        <DropdownMenu.Item
                          key={`category-${category}`}
                          className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer outline-none transition-all duration-150 group"
                          onClick={() => setCategoryFilter(category)}
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          {category}
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>

              {/* Status Filter */}
              <div className="flex-1 sm:flex-none">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="flex items-center justify-between w-full sm:w-auto gap-2 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl hover:from-green-100 hover:to-emerald-100 hover:border-green-300 transition-all duration-200 shadow-sm hover:shadow-md group">
                      <span className="text-sm text-green-700 font-medium">
                        {statusFilter === "All" ? "All Status" : statusFilter}
                      </span>
                      <ChevronDownIcon className="w-4 h-4 text-green-500 group-hover:text-green-600 transition-colors" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content className="min-w-32 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 backdrop-blur-sm">
                      {["All", "Online", "Offline"].map((status) => (
                        <DropdownMenu.Item
                          key={`status-${status}`}
                          className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg cursor-pointer outline-none transition-all duration-150 group"
                          onClick={() => setStatusFilter(status)}
                        >
                          <div
                            className={`w-2 h-2 rounded-full mr-3 ${
                              status === "Online"
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
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Name & Logo
                </th>
                <th className="hidden sm:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="hidden lg:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  IP Multicast
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="hidden md:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Last Checked
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginationData.paginatedChannels.map((channel, index) => (
                <tr
                  key={`channel-${channel.id || index}`}
                  className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 group"
                >
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200 transform group-hover:scale-105">
                        <span className="text-sm font-bold text-white">
                          {channel.channelNumber || "-"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
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
                  <td className="hidden sm:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                      {channel.category || "Uncategorized"}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                    <code className="text-sm text-gray-900 px-2 py-1 bg-gray-100 rounded-lg font-mono">
                      {channel.ipMulticast || "N/A"}
                    </code>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={channel.status} />
                  </td>
                  <td className="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <DateFormatter
                      date={channel.lastChecked}
                      fallback="Never"
                      className="text-xs"
                    />
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => checkChannelStatus(channel.id)}
                      disabled={!channel.id}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 disabled:text-gray-400 disabled:bg-gray-50 disabled:border-gray-200 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
                    >
                      Check
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
              key={`mobile-tv-${channel.id || index}`}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm">
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
                  onClick={() => checkChannelStatus(channel.id)}
                  disabled={!channel.id}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 disabled:text-gray-400 disabled:bg-gray-50 disabled:border-gray-200 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Check Now
                </button>
              </div>
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
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Info Text */}
            <div className="text-sm text-gray-600 order-2 sm:order-1">
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
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              {/* Page Numbers - Mobile optimized */}
              <div className="flex items-center gap-1">
                {(() => {
                  const { totalPages } = paginationData;
                  const maxVisiblePages = window.innerWidth < 640 ? 3 : 5;
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
                      <button
                        key="page-1"
                        onClick={() => handlePageChange(1)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
                      >
                        1
                      </button>
                    );
                    if (startPage > 2) {
                      pages.push(
                        <span
                          key="ellipsis-start"
                          className="px-2 py-2 text-gray-400"
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
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                          currentPage === i
                            ? "text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-md"
                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
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
                          className="px-2 py-2 text-gray-400"
                        >
                          ...
                        </span>
                      );
                    }
                    pages.push(
                      <button
                        key={`page-${totalPages}`}
                        onClick={() => handlePageChange(totalPages)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
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
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRightIcon className="w-4 h-4" />
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
