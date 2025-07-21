"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import {
  Notification,
  fetchAllNotifications,
} from "../app/notifications/notifUtils";

const ITEMS_PER_PAGE = 12;

export default function NotifPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("notif-cache");
      if (stored) {
        const parsed: Notification[] = JSON.parse(stored);
        const recent = parsed.filter(
          (n) => Date.now() - new Date(n.rawDate).getTime() <= 2 * 86400000
        );
        setNotifications(recent);
      }
    } catch (e) {
      console.error("Failed to parse notif-cache", e);
    } finally {
      setMounted(true);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const recent = await fetchAllNotifications();
    setNotifications(recent);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchNotifications();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchNotifications();
    }, 120000);
    return () => clearInterval(interval);
  }, [mounted, fetchNotifications]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return notifications.filter((n) => {
      const matchesSearch =
        n.title?.toLowerCase().includes(s) ||
        n.message?.toLowerCase().includes(s) ||
        n.deviceName?.toLowerCase().includes(s) ||
        n.roomNo?.toLowerCase().includes(s) ||
        n.ipAddr?.includes(s);
      const matchesSource = sourceFilter === "all" || n.source === sourceFilter;
      return matchesSearch && matchesSource;
    });
  }, [notifications, searchTerm, sourceFilter]);

  const pagination = useMemo(() => {
    const total = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = Math.min(start + ITEMS_PER_PAGE, filtered.length);
    return {
      total,
      start,
      end,
      pageData: filtered.slice(start, end),
    };
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sourceFilter]);

  // === Sub-komponen dalam file ===
  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const getIcon = () => {
      switch (notification.source) {
        case "tv":
          return <ComputerDesktopIcon className="w-5 h-5" />;
        case "chromecast":
          return <DevicePhoneMobileIcon className="w-5 h-5" />;
        case "channel":
          return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
        default:
          return <ExclamationTriangleIcon className="w-5 h-5" />;
      }
    };

    return (
      <div className="flex items-start gap-4 px-6 py-5">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
            notification.type === "warning"
              ? "bg-yellow-100 text-yellow-600"
              : notification.type === "success"
              ? "bg-green-100 text-green-600"
              : "bg-blue-100 text-blue-600"
          }`}
        >
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
            <span className="text-sm text-gray-600">{notification.date}</span>
          </div>
          <p className="text-gray-600 mb-3">{notification.message}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {notification.roomNo && (
              <span>
                <strong>Room:</strong> {notification.roomNo}
              </span>
            )}
            {notification.deviceName && !notification.roomNo && (
              <span>
                <strong>Device:</strong> {notification.deviceName}
              </span>
            )}
            {notification.ipAddr && (
              <span>
                <strong>IP:</strong>{" "}
                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                  {notification.ipAddr}
                </code>
              </span>
            )}
            <span>
              <strong>Source:</strong>{" "}
              {notification.source.charAt(0).toUpperCase() + notification.source.slice(1)}
            </span>
            <span>{notification.time}</span>
          </div>
        </div>
      </div>
    );
  };

  const SearchFilter = () => (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
      <div className="relative flex-1 max-w-md">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search notifications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-3 w-full bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 min-w-[120px] justify-between">
              <span className="text-sm font-medium text-gray-700">
                {sourceFilter.charAt(0).toUpperCase() + sourceFilter.slice(1)}
              </span>
              <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="min-w-32 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50">
              {["all", "tv", "chromecast", "channel"].map((source) => (
                <DropdownMenu.Item
                  key={source}
                  className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer outline-none"
                  onClick={() => setSourceFilter(source)}
                >
                  {source.charAt(0).toUpperCase() + source.slice(1)}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all duration-200"
        >
          <ArrowPathIcon className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          <span className="text-sm font-medium">
            {refreshing ? "Refreshing..." : "Refresh"}
          </span>
        </button>
      </div>
    </div>
  );

  const PaginationControl = () =>
    pagination.total > 1 ? (
      <div className="mt-6 flex justify-center gap-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        {Array.from({ length: pagination.total }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 border rounded ${
              currentPage === i + 1 ? "bg-blue-600 text-white" : ""
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.total))}
          disabled={currentPage === pagination.total}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    ) : null;

  if (!mounted || loading) {
    return (
      <div className="p-6 bg-blue-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading notifications...</span>
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
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">
              Monitor device status and system alerts
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <SearchFilter />
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        {pagination.pageData.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircleIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No notifications found
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchTerm || sourceFilter !== "all"
                ? "No notifications match your current filters."
                : "All devices are running smoothly. No notifications to display."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pagination.pageData.map((n) => (
              <NotificationCard key={n.id} notification={n} />
            ))}
          </div>
        )}
      </div>

      <PaginationControl />
    </div>
  );
}
