"use client";

import React, { useState, useEffect } from "react";
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

  // Fetch channels data
  const fetchChannels = async () => {
    try {
      const response = await fetch("http://iptv-backend-prod.up.railway.app/api/channels");
      const result = await response.json();

      if (result.success) {
        setChannels(result.data);
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
    }
  };

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const response = await fetch("http://iptv-backend-prod.up.railway.app/api/dashboard/stats");
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchChannels(), fetchStats()]);
      setLoading(false);
    };

    loadData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchChannels();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchChannels(), fetchStats()]);
    setRefreshing(false);
  };

  // Check specific channel status
  const checkChannelStatus = async (channelId: number) => {
    try {
      const response = await fetch(
        `http://iptv-backend-prod.up.railway.app/api/channels/${channelId}/check`,
        {
          method: "POST",
        }
      );
      const result = await response.json();

      if (result.success) {
        // Update the channel in the list
        setChannels((prev) =>
          prev.map((ch) => (ch.id === channelId ? result.data : ch))
        );
      }
    } catch (error) {
      console.error("Error checking channel status:", error);
    }
  };

  // Filter channels
  const filteredChannels = channels.filter((channel) => {
    const matchesSearch =
      channel.channelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      channel.channelNumber.toString().includes(searchTerm);
    const matchesCategory =
      categoryFilter === "All" || channel.category === categoryFilter;
    const matchesStatus =
      statusFilter === "All" || channel.status === statusFilter.toLowerCase();

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredChannels.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedChannels = filteredChannels.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Get unique categories
  const categories = [
    "All",
    ...Array.from(new Set(channels.map((ch) => ch.category))),
  ];

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading channels...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Channels</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalChannels}
                </p>
              </div>
              <SignalIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Online</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.onlineChannels}
                </p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offline</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.offlineChannels}
                </p>
              </div>
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.uptime}%
                </p>
              </div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  parseFloat(stats.uptime) >= 95
                    ? "bg-green-100"
                    : parseFloat(stats.uptime) >= 80
                    ? "bg-yellow-100"
                    : "bg-red-100"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full ${
                    parseFloat(stats.uptime) >= 95
                      ? "bg-green-500"
                      : parseFloat(stats.uptime) >= 80
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        {/* Left - Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black" />
          <input
            type="text"
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-80 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Right - Filters and Refresh */}
        <div className="flex items-center gap-4">
          {/* Category Filter */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <span className="text-sm text-gray-700">{categoryFilter}</span>
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="min-w-32 bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50">
                {categories.map((category) => (
                  <DropdownMenu.Item
                    key={category}
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
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
              <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <span className="text-sm text-gray-700">{statusFilter}</span>
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="min-w-24 bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50">
                {["All", "Online", "Offline"].map((status) => (
                  <DropdownMenu.Item
                    key={status}
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
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
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      </div>

      {/* Channels Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Channel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP Multicast
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Checked
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedChannels.map((channel) => (
              <tr key={channel.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-gray-600">
                        {channel.channelNumber}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-8 w-16 relative">
                    <Image
                      src={channel.logo}
                      alt={channel.channelName}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {channel.channelName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {channel.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                  {channel.ipMulticast}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      channel.status === "online"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full mr-1 ${
                        channel.status === "online"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                    {channel.status.charAt(0).toUpperCase() +
                      channel.status.slice(1)}
                  </span>
                  {channel.responseTime && (
                    <div className="text-xs text-gray-500 mt-1">
                      {channel.responseTime}ms
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(channel.lastChecked).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => checkChannelStatus(channel.id)}
                    className="text-blue-600 hover:text-blue-900 hover:underline"
                  >
                    Check Now
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredChannels.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No channels found matching your criteria.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {startIndex + 1} to{" "}
          {Math.min(startIndex + ITEMS_PER_PAGE, filteredChannels.length)} of{" "}
          {filteredChannels.length} channels
        </div>
        <div className="flex items-center gap-2 text-black">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="soft"
          >
            <ChevronLeftIcon className="w-4 h-4 hover:bg-sky-500" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              onClick={() => handlePageChange(page)}
              variant={currentPage === page ? "solid" : "soft"}
              className={currentPage === page ? "bg-blue-600 text-white hover:underline" : ""}
            >
              {page}
            </Button>
          ))}
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="soft"
          >
            <ChevronRightIcon className="w-4 h-4 hover:bg-cyan-100" />
          </Button>
        </div>
      </div>

      {/* Results Info */}
      <div className="mt-4 text-sm text-gray-600">
        {stats && (
          <span className="">
            Last updated: {new Date(stats.lastUpdated).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
