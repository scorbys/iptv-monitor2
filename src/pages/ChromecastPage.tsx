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
  XMarkIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { DateFormatter } from "../components/DateFormatter";
import { useRouter } from "next/navigation";

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

const ITEMS_PER_PAGE = 12;

export default function ChromecastPage() {
  const [chromecasts, setChromecasts] = useState<Chromecast[]>([]);
  const [stats, setStats] = useState<ChromecastStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );

  const router = useRouter();
  const handleDeviceClick = (device: Chromecast) => {
    const deviceId = device.deviceName || device.idCast;
    router.push(`/chromecast/${encodeURIComponent(deviceId)}`);
  };

  // Effect untuk mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

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

    if (typeof window !== "undefined") {
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Fetch Chromecast data
  const fetchChromecasts = useCallback(async () => {
    if (!mounted) return;

    try {
      const response = await fetch("/api/chromecast", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setChromecasts(result.data);
      } else {
        console.error("Invalid chromecast data format:", result);
        setChromecasts([]);
      }
    } catch (error) {
      console.error("Error fetching chromecast:", error);
      setChromecasts([]);
    }
  }, [mounted]);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    if (!mounted) return;

    try {
      const response = await fetch("/api/chromecast/dashboard/stats", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
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
        await fetchChromecasts();
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
      if (document.visibilityState === "visible") {
        fetchChromecasts();
        fetchStats();
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [mounted, fetchChromecasts, fetchStats]);

  // Manual refresh dengan loading state
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      await Promise.all([fetchChromecasts(), fetchStats()]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, fetchChromecasts, fetchStats]);

  // Check specific channel status
  const checkChromecastStatus = useCallback(async (deviceName: string) => {
    if (!deviceName || !deviceName.trim()) {
      console.error("Device name is required for status check");
      return;
    }

    setCheckingId(deviceName);

    try {
      console.log(`Checking status for device: ${deviceName}`);

      const encodedDeviceName = encodeURIComponent(deviceName);
      const response = await fetch(
        `/api/chromecast/${encodedDeviceName}/check`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      console.log(`Response status: ${response.status}`);

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (response.status === 400) {
        const errorResult = await response.json();
        console.error("Bad request:", errorResult);

        setChromecasts((prev) =>
          prev.map((device) =>
            device.deviceName === deviceName
              ? {
                  ...device,
                  error: errorResult.message || "Invalid request",
                  isOnline: false,
                }
              : device
          )
        );
        return;
      }

      if (response.status === 404) {
        const errorResult = await response.json();
        console.error("Device not found:", errorResult);

        setChromecasts((prev) =>
          prev.map((device) =>
            device.deviceName === deviceName
              ? {
                  ...device,
                  error: "Device not found on server",
                  isOnline: false,
                }
              : device
          )
        );
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Check result:", result);

      if (result.success && result.data) {
        setChromecasts((prev) =>
          prev.map((device) =>
            device.deviceName === deviceName
              ? { ...device, ...result.data, error: undefined }
              : device
          )
        );
      } else {
        setChromecasts((prev) =>
          prev.map((device) =>
            device.deviceName === deviceName
              ? {
                  ...device,
                  error: result.message || "Check failed",
                  isOnline: false,
                }
              : device
          )
        );
      }
    } catch (error: unknown) {
      console.error("Error checking device status:", error);

      setChromecasts((prev) =>
        prev.map((device) =>
          device.deviceName === deviceName
            ? {
                ...device,
                error: error instanceof Error ? error.message : "Network error",
                isOnline: false,
              }
            : device
        )
      );
    } finally {
      setCheckingId(null);
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
      endIndex: Math.min(
        startIndex + ITEMS_PER_PAGE,
        filteredChromecasts.length
      ),
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
    ({
      isOnline,
      isPingable,
      responseTime,
    }: {
      isOnline: boolean;
      isPingable: boolean;
      responseTime?: number;
    }) => (
      <div className="flex flex-col gap-1">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
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
        {responseTime && (
          <div className="text-xs text-gray-500 mt-1 ml-1">
            {responseTime}ms
          </div>
        )}
      </div>
    ),
    []
  );

  // Signal level component
  const SignalLevel = useCallback(({ level }: { level: number }) => {
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
  }, []);

  // Speed component
  const SpeedIndicator = useCallback(({ speed }: { speed: number }) => {
    const getSpeedColor = (speed: number) => {
      if (speed >= 80) return "text-green-600 bg-green-100";
      if (speed >= 50) return "text-yellow-600 bg-yellow-100";
      if (speed >= 25) return "text-orange-600 bg-orange-100";
      return "text-red-600 bg-red-100";
    };

    return (
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSpeedColor(
            speed
          )}`}
        >
          <WifiIcon className="w-3 h-3 mr-1" />
          {speed} Mbps
        </div>
      </div>
    );
  }, []);

  // Export to CSV function
  const exportToCSV = useCallback(() => {
    if (exportLoading) return;

    setExportLoading(true);

    try {
      const headers = [
        "Device Name",
        "Type",
        "IP Address",
        "Status",
        "Pingable",
        "Signal Level (dBm)",
        "Speed (Mbps)",
        "Response Time (ms)",
        "Last Seen",
      ];

      const csvData = filteredChromecasts.map((device) => [
        device.deviceName || "Unknown Device",
        device.type || "Chromecast",
        device.ipAddr || "N/A",
        device.isOnline ? "Online" : "Offline",
        device.isPingable ? "Yes" : "No",
        device.signalLevel || 0,
        device.speed || 0,
        device.responseTime || "N/A",
        device.lastSeen || "Never seen",
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
        const filename = `chromecast_export_${timestamp}.csv`;
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
  }, [filteredChromecasts, exportLoading]);

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

  if (!router || !mounted || loading) {
    return (
      <div className="p-6 bg-blue-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">
            Loading Chromecast devices...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-blue-50 min-h-screen">
      {/* Header Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transform hover:-translate-y-1 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">
                  Total Devices
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalDevices || 0}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <DevicePhoneMobileIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transform hover:-translate-y-1 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Online</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.onlineDevices || 0}
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
                  {stats.offlineDevices || 0}
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
                  Avg Signal
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats?.avgSignalLevel ?? 0} dBm
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <SignalIcon className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transform hover:-translate-y-1 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">
                  Avg Speed
                </p>
                <p className="text-3xl font-bold text-indigo-600">
                  {stats?.avgSpeed ?? 0} Mbps
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-indigo-50 to-sky-50 rounded-lg">
                <WifiIcon className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 backdrop-blur-sm">
        <div className="flex flex-col space-y-4">
          {/* Search Section */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search devices, IP addresses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-full bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all duration-200 placeholder-gray-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Status Filter */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 min-w-[120px] justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {statusFilter}
                    </span>
                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
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

              {/* Action Buttons */}
              <div className="flex gap-2">
                {/* Export Button */}
                <button
                  onClick={exportToCSV}
                  disabled={exportLoading || filteredChromecasts.length === 0}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">
                    {exportLoading ? "Exporting..." : "Export CSV"}
                  </span>
                </button>

                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  aria-label={
                    refreshing
                      ? "Refreshing chromecast data"
                      : "Refresh chromecast data"
                  }
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
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
        </div>
      </div>

      {/* Chromecasts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Network
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginationData.paginatedChromecasts.map((device, index) => (
                <tr
                  key={`chromecast-${device.idCast || index}`}
                  className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200 group cursor-pointer"
                  onClick={(e) => {
                    // Only navigate if not clicking on button
                    const target = e.target as HTMLElement;
                    if (!target.closest("button")) {
                      handleDeviceClick(device);
                    }
                  }}
                >
                  {/* Device Column */}
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                          <DevicePhoneMobileIcon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
                            {device.deviceName || "Unknown Device"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {device.type || "Chromecast"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Network Column */}
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <code className="text-sm text-gray-900 px-2 py-1 font-mono bg-gray-100 rounded-lg">
                        {device.ipAddr || "N/A"}
                      </code>
                      <div className="flex items-center gap-2">
                        <SignalLevel level={device.signalLevel || 0} />
                      </div>
                    </div>
                  </td>

                  {/* Status Column */}
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <StatusBadge
                        isOnline={device.isOnline}
                        isPingable={device.isPingable}
                      />
                    </div>
                  </td>

                  {/* Performance Column */}
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <SpeedIndicator speed={device.speed || 0} />
                      {device.responseTime && (
                        <div className="text-xs text-gray-500">
                          Response: {device.responseTime}ms
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Last Activity Column */}
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-500">
                      <DateFormatter
                        date={device.lastSeen}
                        fallback="Never seen"
                        className="text-xs"
                      />
                    </div>
                  </td>

                  {/* Actions Column */}
                  <td className="px-4 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row click
                        e.preventDefault(); // Prevent default action
                        checkChromecastStatus(device.deviceName);
                      }}
                      disabled={
                        !device.deviceName ||
                        checkingId === device.deviceName ||
                        checkingId !== null
                      }
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 disabled:text-gray-400 disabled:bg-gray-50 disabled:border-gray-200 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                    >
                      <ArrowPathIcon
                        className={`w-3 h-3 mr-1 ${
                          checkingId === device.deviceName ? "animate-spin" : ""
                        }`}
                      />
                      {checkingId === device.deviceName
                        ? "Checking..."
                        : "Check"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden divide-y divide-gray-100">
          {paginationData.paginatedChromecasts.map((device, index) => (
            <div
              key={`mobile-chromecast-${device.idCast || index}`}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div
                onClick={() => handleDeviceClick(device)}
                className="cursor-pointer"
              >
                {/* Card content */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                      <DevicePhoneMobileIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                        {device.deviceName || "Unknown Device"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {device.type || "Chromecast"}
                      </p>
                    </div>
                  </div>
                  <StatusBadge
                    isOnline={device.isOnline}
                    isPingable={device.isPingable}
                    responseTime={device.responseTime}
                  />
                </div>

                {/* Device info content */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">IP Address:</span>
                    <code className="text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs">
                      {device.ipAddr || "N/A"}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Signal:</span>
                    <span className="text-xs text-gray-600">
                      {device.signalLevel || 0} dBm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Speed:</span>
                    <span className="text-xs text-gray-600">
                      {device.speed || 0} Mbps
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Seen:</span>
                    <DateFormatter
                      date={device.lastSeen}
                      fallback="Never seen"
                      className="text-xs text-gray-600"
                    />
                  </div>
                </div>
              </div>

              {/* Check button remains separate from onClick area */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    e.preventDefault(); // Prevent default action
                    checkChromecastStatus(device.deviceName);
                  }}
                  disabled={
                    !device.deviceName || checkingId === device.deviceName
                  }
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 disabled:text-gray-400 disabled:bg-gray-50 disabled:border-gray-200 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ArrowPathIcon
                    className={`w-4 h-4 ${
                      checkingId === device.deviceName ? "animate-spin" : ""
                    }`}
                  />
                  {checkingId === device.deviceName
                    ? "Checking..."
                    : "Check Now"}
                </button>

                {/* Error message display */}
                {device.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-600 break-words">
                      {device.error}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredChromecasts.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
              <DevicePhoneMobileIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No devices found
            </h3>
            <p className="text-gray-500 mb-4 max-w-md mx-auto">
              {searchTerm
                ? `No devices match "${searchTerm}" with current filters`
                : "No devices available with current filters"}
            </p>
            {(searchTerm || statusFilter !== "All") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("All");
                }}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all hover:scale-105 active:scale-95"
              >
                <XMarkIcon className="w-4 h-4 mr-2" />
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
            className={`flex items-center justify-between gap-2 sm:gap-4 ${
              screenSize === "mobile"
                ? "flex-col space-y-3"
                : "flex-col sm:flex-row"
            }`}
          >
            {/* Info Text */}
            <div
              className={`text-xs sm:text-sm text-gray-600 ${
                screenSize === "mobile" ? "order-2" : "order-2 sm:order-1"
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
                    of {filteredChromecasts.length} devices)
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
                    {filteredChromecasts.length}
                  </span>{" "}
                  devices
                </>
              )}
            </div>

            {/* Pagination Controls */}
            <div
              className={`flex items-center gap-1 sm:gap-2 ${
                screenSize === "mobile" ? "order-1" : "order-1 sm:order-2"
              }`}
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                  screenSize === "mobile" ? "min-w-[60px]" : ""
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
                        className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                          currentPage === 1
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
                    pages.push(
                      <button
                        key={`page-${i}-${currentPage}`}
                        onClick={() => handlePageChange(i)}
                        className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                          currentPage === i
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
                        className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                          currentPage === totalPages
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
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                  screenSize === "mobile" ? "min-w-[60px]" : ""
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
