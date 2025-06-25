"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SignalIcon,
  WifiIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@radix-ui/themes";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { DateFormatter } from "../components/DateFormatter";

interface Chromecast {
  idCast: number;
  type: string;
  deviceName: string;
  ipAddr: string;
  isPingable: boolean;
  isOnline: boolean;
  signalLevel: number;
  speed: number;
  lastSeen: string;
  responseTime?: number;
  error?: string;
}

interface ChromecastStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  avgSignalLevel: number;
  avgSpeed: number;
  lastUpdated: string;
}

const ITEMS_PER_PAGE = 20;

export default function ChromecastPage() {
  const [chromecasts, setChromecasts] = useState<Chromecast[]>([]);
  const [stats, setStats] = useState<ChromecastStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [mounted, setMounted] = useState(false);

  // Fetch Chromecast data
  const fetchChromecasts = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/chromecast', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setChromecasts(result.data);
      } else {
        console.error("Invalid Chromecast data format:", result);
        setChromecasts([]);
      }
    } catch (error) {
      console.error("Error fetching Chromecasts:", error);
      setChromecasts([]);
    }
  }, []);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(
        'http://localhost:3001/api/chromecast/dashboard/stats',
        {
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

  // Mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initial data load and auto-refresh
  useEffect(() => {
    if (!mounted) return;

    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchChromecasts(), fetchStats()]);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchChromecasts();
        fetchStats();
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [mounted, fetchChromecasts, fetchStats]);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      await Promise.all([fetchChromecasts(), fetchStats()]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, fetchChromecasts, fetchStats]);

  // Check individual Chromecast status
  const checkChromecastStatus = useCallback(async (deviceName: string) => {
    if (!deviceName) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/chromecast/${deviceName}/check`,
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
        setChromecasts((prev) =>
          prev.map((device) =>
            device.deviceName === deviceName ? { ...device, ...result.data } : device
          )
        );
      }
    } catch (error) {
      console.error("Error checking Chromecast status:", error);
    }
  }, []);

  // Filtered Chromecasts
  const filteredChromecasts = useMemo(() => {
    return chromecasts.filter((device) => {
      const matchesSearch =
        device.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.ipAddr?.includes(searchTerm) ||
        false;

      let matchesStatus = true;
      if (statusFilter === "Online") {
        matchesStatus = device.isOnline;
      } else if (statusFilter === "Offline") {
        matchesStatus = !device.isOnline;
      }

      return matchesSearch && matchesStatus;
    });
  }, [chromecasts, searchTerm, statusFilter]);

  // Pagination
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredChromecasts.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedChromecasts = filteredChromecasts.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

    return {
      totalPages,
      startIndex,
      paginatedChromecasts,
      endIndex: Math.min(startIndex + ITEMS_PER_PAGE, filteredChromecasts.length),
    };
  }, [filteredChromecasts, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Status badge component
  const StatusBadge = useCallback(
    ({ isOnline, isPingable }: { isOnline: boolean; isPingable: boolean }) => (
      <div className="flex flex-col gap-1">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isOnline
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full mr-1 ${
              isOnline ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          {isOnline ? "Online" : "Offline"}
        </span>
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isPingable
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {isPingable ? "Pingable" : "Not Pingable"}
        </span>
      </div>
    ),
    []
  );

  // Signal level component
  const SignalLevel = useCallback(
    ({ level }: { level: number }) => {
      const getSignalColor = (level: number) => {
        if (level >= -64 && level <= -1) return "text-green-600";
        else if (level >= -70 && level < -64) return "text-yellow-600";
        else return "text-red-600";
      };

      const getSignalBg = (level: number) => {
        if (level >= -64 && level <= -1) return "bg-green-100";
        else if (level >= -70 && level < -64) return "bg-yellow-100";
        else return "bg-red-100";
      };

      return (
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded ${getSignalBg(level)}`}>
            <SignalIcon className={`w-4 h-4 ${getSignalColor(level)}`} />
          </div>
          <span className={`text-sm font-medium ${getSignalColor(level)}`}>
            {level}
          </span>
        </div>
      );
    },
    []
  );

  // Speed component
  const SpeedIndicator = useCallback(
    ({ speed }: { speed: number }) => {
      const getSpeedColor = (speed: number) => {
        if (speed >= 80) return "text-green-600 bg-green-100";
        if (speed >= 50) return "text-yellow-600 bg-yellow-100";
        if (speed >= 25) return "text-orange-600 bg-orange-100";
        return "text-red-600 bg-red-100";
      };

      return (
        <div className="flex items-center gap-2">
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSpeedColor(speed)}`}>
            <WifiIcon className="w-3 h-3 mr-1" />
            {speed} Mbps
          </div>
        </div>
      );
    },
    []
  );

  if (!mounted || loading) {
    return (
      <div className="p-6 bg-blue-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading Chromecast devices...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-blue-50 min-h-screen">
      {/* Header Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Devices</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalDevices || 0}
                </p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <DevicePhoneMobileIcon className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Online</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.onlineDevices || 0}
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
                  {stats.offlineDevices || 0}
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
                <p className="text-sm text-gray-600 font-medium">Avg Signal</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.avgSignalLevel ?? 0} dBm
                </p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <SignalIcon className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Avg Speed</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {stats?.avgSpeed ?? 0} Mbps
                </p>
              </div>
              <div className="p-2 bg-indigo-50 rounded-lg">
                <WifiIcon className="w-6 h-6 text-indigo-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg p-4 shadow-sm border mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full lg:w-96">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by device name or IP address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full bg-gray-50 text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all"
            />
          </div>

          {/* Filters and Actions */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
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

      {/* Chromecasts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Device Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Signal Level
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Speed
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Last Seen
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginationData.paginatedChromecasts.map((device, index) => (
                <tr
                  key={`chromecast-${device.idCast || index}`}
                  className="hover:bg-blue-50/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {device.type || "Chromecast"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {device.deviceName || "Unknown Device"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm text-gray-900 px-2 py-1 font-mono bg-gray-100 rounded">
                      {device.ipAddr || "N/A"}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge
                      isOnline={device.isOnline}
                      isPingable={device.isPingable}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SignalLevel level={device.signalLevel || 0} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SpeedIndicator speed={device.speed || 0} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <DateFormatter
                      date={device.lastSeen}
                      fallback="Never seen"
                      className="text-xs"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => checkChromecastStatus(device.deviceName)}
                      disabled={!device.deviceName}
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

        {filteredChromecasts.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <DevicePhoneMobileIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Chromecasts found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? `No Chromecasts match "${searchTerm}"`
                : "No Chromecasts available with current filters"}
            </p>
            {(searchTerm || statusFilter !== "All") && (
              <button
                onClick={() => {
                  setSearchTerm("");
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
              of <span className="font-medium">{filteredChromecasts.length}</span> devices
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