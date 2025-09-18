import React, { useState, useEffect, useCallback } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  ChartBarIcon,
  SignalIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

// Type definitions
interface TrafficDataPoint {
  time: string;
  timestamp: Date;
  channels: number;
  hospitality: number;
  chromecast: number;
}

interface ServiceStats {
  requests: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
}

interface CurrentStats {
  channels: ServiceStats;
  hospitality: ServiceStats;
  chromecast: ServiceStats;
}

interface StatsHistoryItem {
  timestamp: string;
  totalNotifications: number;
  activeIssues: number;
  recentRecoveries: number;
  avgResponseTime: number;
  last24HourAlerts: number;
  totalRequests: number;
  throughput: number;
  errorRate: number;
  time: string;
}

interface TooltipPayload {
  color: string;
  dataKey: string;
  name: string;
  value: number;
  payload: StatsHistoryItem;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

type ColorKey = "blue" | "green" | "yellow" | "purple" | "red";

export default function NetworkTrafficDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("1h");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [trafficData, setTrafficData] = useState<TrafficDataPoint[]>([]);
  const [currentStats, setCurrentStats] = useState<CurrentStats>({
    channels: { requests: 0, responseTime: 0, errorRate: 0, throughput: 0 },
    hospitality: { requests: 0, responseTime: 0, errorRate: 0, throughput: 0 },
    chromecast: { requests: 0, responseTime: 0, errorRate: 0, throughput: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performanceTimeRange, setPerformanceTimeRange] = useState("1h");
  const [isClient, setIsClient] = useState(false);

  // New states for enhanced stats section
  const [activeStatsTab, setActiveStatsTab] = useState("overview");
  const [statsHistory, setStatsHistory] = useState<StatsHistoryItem[]>([]);

  // Simulate API calls with fallback data
  const fetchCurrentStats = useCallback(async () => {
    try {
      // Simulating API call with random data
      const mockData = {
        channels: {
          requests: Math.floor(Math.random() * 100) + 50,
          responseTime: Math.floor(Math.random() * 200) + 100,
          errorRate: Math.random() * 2,
          throughput: Math.random() * 10 + 5,
        },
        hospitality: {
          requests: Math.floor(Math.random() * 80) + 30,
          responseTime: Math.floor(Math.random() * 150) + 80,
          errorRate: Math.random() * 1.5,
          throughput: Math.random() * 8 + 3,
        },
        chromecast: {
          requests: Math.floor(Math.random() * 60) + 20,
          responseTime: Math.floor(Math.random() * 120) + 60,
          errorRate: Math.random() * 1,
          throughput: Math.random() * 6 + 2,
        },
      };

      setCurrentStats(mockData);
      setError(null);
    } catch (err) {
      console.error("Error fetching current stats:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
  }, []);

  // Generate fallback data
  const generateFallbackData = useCallback(() => {
    const now = new Date();
    const data = [];

    let intervalMs, points;

    switch (selectedTimeRange) {
      case "1h":
        intervalMs = 60000;
        points = 60;
        break;
      case "6h":
        intervalMs = 300000;
        points = 72;
        break;
      case "24h":
        intervalMs = 1800000;
        points = 48;
        break;
      default:
        intervalMs = 60000;
        points = 60;
    }

    const pad2 = (n: number): string => String(n).padStart(2, "0");
    const formatTime = (date: Date): string => {
      const h = pad2(date.getHours());
      const m = pad2(date.getMinutes());
      if (selectedTimeRange === "24h") {
        const d = pad2(date.getDate());
        const mo = pad2(date.getMonth() + 1);
        return `${mo}/${d} ${h}:${m}`;
      }
      return `${h}:${m}`;
    };

    for (let i = points - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * intervalMs);
      const timeStr = formatTime(time);

      data.push({
        time: timeStr,
        timestamp: time,
        channels: Math.floor(Math.random() * 150) + 50,
        hospitality: Math.floor(Math.random() * 100) + 30,
        chromecast: Math.floor(Math.random() * 80) + 20,
      });
    }

    return data;
  }, [selectedTimeRange]);

  const fetchTrafficData = useCallback(async () => {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTrafficData(generateFallbackData());
      setError(null);
    } catch (err) {
      console.error("Error fetching traffic data:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setTrafficData(generateFallbackData());
    }
  }, [generateFallbackData]);

  const generateAndSetStatsHistory = useCallback(() => {
    const now = new Date();
    const data: StatsHistoryItem[] = [];

    let intervalMs: number, points: number;

    switch (performanceTimeRange) {
      case "1h":
        intervalMs = 60000; // 1 menit
        points = 60;
        break;
      case "6h":
        intervalMs = 300000; // 5 menit
        points = 72;
        break;
      case "24h":
        intervalMs = 1800000; // 30 menit
        points = 48;
        break;
      default:
        intervalMs = 60000;
        points = 60;
    }

    const pad2 = (n: number): string => String(n).padStart(2, "0");
    const formatTime = (date: Date): string => {
      const h = pad2(date.getHours());
      const m = pad2(date.getMinutes());
      if (performanceTimeRange === "24h") {
        const d = pad2(date.getDate());
        const mo = pad2(date.getMonth() + 1);
        return `${mo}/${d} ${h}:${m}`;
      }
      return `${h}:${m}`;
    };

    for (let i = points - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * intervalMs);
      const timeStr = formatTime(time);

      data.push({
        time: timeStr,
        timestamp: timeStr,
        totalNotifications: Math.floor(Math.random() * 50) + 100,
        activeIssues: Math.floor(Math.random() * 8) + 1,
        recentRecoveries: Math.floor(Math.random() * 5) + 2,
        avgResponseTime: Math.floor(Math.random() * 100) + 50,
        last24HourAlerts: Math.floor(Math.random() * 15) + 5,
        totalRequests: Math.floor(Math.random() * 50) + 100,
        throughput: Math.random() * 5 + 10,
        errorRate: Math.random() * 3,
      });
    }

    setStatsHistory(data);
  }, [performanceTimeRange]);

  useEffect(() => {
    const updateData = async () => {
      setCurrentTime(new Date());
      await Promise.all([fetchCurrentStats(), fetchTrafficData()]);
    };

    updateData();
    const statsInterval = setInterval(fetchCurrentStats, 30000);
    const trafficInterval = setInterval(fetchTrafficData, 60000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(trafficInterval);
    };
  }, [fetchCurrentStats, fetchTrafficData]);

  useEffect(() => {
    fetchTrafficData();
  }, [selectedTimeRange, fetchTrafficData]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    generateAndSetStatsHistory();
    const interval = setInterval(generateAndSetStatsHistory, 60000);
    return () => clearInterval(interval);
  }, [generateAndSetStatsHistory]);

  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchCurrentStats(), fetchTrafficData()]);
      } finally {
        setLoading(false);
      }
    };

    initialLoad();

    const statsInterval = setInterval(fetchCurrentStats, 30000);
    const trafficInterval = setInterval(fetchTrafficData, 60000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(trafficInterval);
    };
  }, []);

  // Custom Tooltip untuk stats charts
  const StatsTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 border border-gray-200 rounded-xl shadow-xl">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-700">
                {entry.name}: <span className="font-medium">{entry.value}</span>
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // StatCard component
  const StatCard = ({
    title,
    value,
    unit,
    icon: Icon,
    trend,
    color = "blue",
  }: {
    title: string;
    value: number | string;
    unit: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: number;
    color?: ColorKey;
  }) => {
    const colorClasses: Record<
      ColorKey,
      { text: string; bg: string; icon: string }
    > = {
      blue: { text: "text-blue-600", bg: "bg-blue-100", icon: "text-blue-600" },
      green: {
        text: "text-green-600",
        bg: "bg-green-100",
        icon: "text-green-600",
      },
      yellow: {
        text: "text-yellow-600",
        bg: "bg-yellow-100",
        icon: "text-yellow-600",
      },
      purple: {
        text: "text-purple-600",
        bg: "bg-purple-100",
        icon: "text-purple-600",
      },
      red: { text: "text-red-600", bg: "bg-red-100", icon: "text-red-600" },
    };

    const currentColor = colorClasses[color];

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className={`text-2xl font-bold ${currentColor.text}`}>
              {typeof value === "number" ? value.toFixed(1) : value}
              <span className="text-sm font-normal text-gray-500 ml-1">
                {unit}
              </span>
            </p>
          </div>
          <div className={`p-3 rounded-full ${currentColor.bg}`}>
            <Icon className={`w-6 h-6 ${currentColor.icon}`} />
          </div>
        </div>
        {typeof trend === "number" && isClient && (
          <div className="flex items-center mt-3">
            {trend > 0 ? (
              <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span
              className={`text-sm font-medium ${
                trend > 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {Math.abs(trend).toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500 ml-1">vs last period</span>
          </div>
        )}
      </div>
    );
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{
      name?: string;
      value: number;
      color: string;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p
              key={entry.name || index}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value} req/s
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Service status based on error rate
  const getServiceStatus = (errorRate: number) => {
    if (errorRate < 1)
      return {
        color: "text-green-600",
        icon: CheckCircleIcon,
        text: "Healthy",
      };
    if (errorRate < 5)
      return {
        color: "text-yellow-600",
        icon: ExclamationTriangleIcon,
        text: "Warning",
      };
    return {
      color: "text-red-600",
      icon: ExclamationTriangleIcon,
      text: "Critical",
    };
  };

  const ServiceCard = ({
    stats,
    displayName,
  }: {
    stats: ServiceStats;
    displayName: string;
  }) => {
    const status = getServiceStatus(stats.errorRate);
    const StatusIcon = status.icon;

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${status.color}`} />
            <span className={`text-sm font-medium ${status.color}`}>
              {status.text}
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Requests/sec</span>
            <span className="text-sm font-semibold text-gray-900">
              {stats.requests.toFixed(0)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Response Time</span>
            <span className="text-sm font-semibold text-gray-900">
              {stats.responseTime.toFixed(0)}ms
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Error Rate</span>
            <span
              className={`text-sm font-semibold ${
                stats.errorRate < 1
                  ? "text-green-600"
                  : stats.errorRate < 5
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {stats.errorRate.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Throughput</span>
            <span className="text-sm font-semibold text-gray-900">
              {stats.throughput.toFixed(1)} MB/s
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-blue-50 p-4 sm:p-6">
      {/* Header - Enhanced */}
      <div className="mb-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='7' r='1'/%3E%3Ccircle cx='47' cy='7' r='1'/%3E%3Ccircle cx='7' cy='27' r='1'/%3E%3Ccircle cx='27' cy='27' r='1'/%3E%3Ccircle cx='47' cy='27' r='1'/%3E%3Ccircle cx='7' cy='47' r='1'/%3E%3Ccircle cx='27' cy='47' r='1'/%3E%3Ccircle cx='47' cy='47' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <ChartBarIcon className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white">
                    IPTV Monitoring Dashboard
                  </h1>
                </div>
                <p className="text-blue-100 text-lg mb-4">
                  Real-time network traffic monitoring and analytics
                </p>

                {/* Quick Stats Row */}
                <div className="flex flex-wrap gap-6 text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">
                      {(
                        currentStats.channels.requests +
                        currentStats.hospitality.requests +
                        currentStats.chromecast.requests
                      ).toFixed(0)}{" "}
                      Active Requests
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-blue-200" />
                    <span className="text-sm">
                      Avg:{" "}
                      {(
                        (currentStats.channels.responseTime +
                          currentStats.hospitality.responseTime +
                          currentStats.chromecast.responseTime) /
                        3
                      ).toFixed(0)}
                      ms
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SignalIcon className="w-4 h-4 text-blue-200" />
                    <span className="text-sm">
                      {(
                        currentStats.channels.throughput +
                        currentStats.hospitality.throughput +
                        currentStats.chromecast.throughput
                      ).toFixed(1)}{" "}
                      MB/s
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Status Indicator */}
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        error ? "bg-red-400" : "bg-green-400"
                      } ${!error ? "animate-pulse" : ""}`}
                    />
                    <span className="text-white font-semibold text-sm">
                      {error ? "System Error" : "All Systems Online"}
                    </span>
                  </div>
                  <div className="text-blue-200 text-sm">
                    {isClient ? currentTime.toLocaleTimeString() : "--:--:--"}
                  </div>
                </div>

                {/* Time Range Selector */}
                <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
                  {["1h", "6h", "24h"].map((range) => (
                    <button
                      key={range}
                      onClick={() => setSelectedTimeRange(range)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedTimeRange === range
                          ? "bg-white text-blue-700 shadow-lg"
                          : "text-white hover:bg-white/20"
                      }`}
                    >
                      {range === "1h"
                        ? "1 Hour"
                        : range === "6h"
                        ? "6 Hours"
                        : "24 Hours"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-red-700 text-sm">Error loading data: {error}</p>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            <p className="text-blue-700 text-sm">Loading traffic data...</p>
          </div>
        </div>
      )}

      {/* Main Chart - Enhanced */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 mb-8 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Request Completion Rate
            </h2>
            <p className="text-gray-600">
              Monitor real-time traffic across all endpoints
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm" />
                <span className="text-sm font-medium text-blue-700">
                  /channels
                </span>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  {currentStats.channels.requests.toFixed(0)} req/s
                </span>
              </div>
              <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg">
                <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm" />
                <span className="text-sm font-medium text-yellow-700">
                  /hospitality
                </span>
                <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                  {currentStats.hospitality.requests.toFixed(0)} req/s
                </span>
              </div>
              <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
                <div className="w-3 h-3 bg-purple-500 rounded-full shadow-sm" />
                <span className="text-sm font-medium text-purple-700">
                  /chromecast
                </span>
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                  {currentStats.chromecast.requests.toFixed(0)} req/s
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-80 relative">
          {loading ? (
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-xl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
                <p className="text-gray-600 font-medium">
                  Loading traffic data...
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trafficData}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id="channelsGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient
                    id="hospitalityGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient
                    id="chromecastGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  strokeWidth={1}
                />
                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  tick={{ fill: "#64748b" }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                  tick={{ fill: "#64748b" }}
                  label={{
                    value: "Requests/sec",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      textAnchor: "middle",
                      fill: "#64748b",
                      fontSize: "12px",
                    },
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="channels"
                  stroke="#3b82f6"
                  fill="url(#channelsGradient)"
                  strokeWidth={3}
                  dot={false}
                  name="/channels"
                />
                <Area
                  type="monotone"
                  dataKey="hospitality"
                  stroke="#f59e0b"
                  fill="url(#hospitalityGradient)"
                  strokeWidth={3}
                  dot={false}
                  name="/hospitality"
                />
                <Area
                  type="monotone"
                  dataKey="chromecast"
                  stroke="#8b5cf6"
                  fill="url(#chromecastGradient)"
                  strokeWidth={3}
                  dot={false}
                  name="/chromecast"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Enhanced Stats Grid with Charts */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Performance Analytics
            </h2>
            <p className="text-gray-600">
              Detailed metrics and trending analysis
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => setActiveStatsTab("overview")}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                activeStatsTab === "overview"
                  ? "bg-blue-100 text-blue-700 font-semibold shadow-sm"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveStatsTab("trends")}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                activeStatsTab === "trends"
                  ? "bg-blue-100 text-blue-700 font-semibold shadow-sm"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              Trends
            </button>
          </div>
        </div>

        {activeStatsTab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Requests"
              value={
                currentStats.channels.requests +
                currentStats.hospitality.requests +
                currentStats.chromecast.requests
              }
              unit="req/s"
              icon={ChartBarIcon}
              color="blue"
              trend={Math.random() * 10 - 5}
            />
            <StatCard
              title="Avg Response Time"
              value={
                (currentStats.channels.responseTime +
                  currentStats.hospitality.responseTime +
                  currentStats.chromecast.responseTime) /
                3
              }
              unit="ms"
              icon={ClockIcon}
              color="green"
              trend={Math.random() * 10 - 5}
            />
            <StatCard
              title="Error Rate"
              value={
                (currentStats.channels.errorRate +
                  currentStats.hospitality.errorRate +
                  currentStats.chromecast.errorRate) /
                3
              }
              unit="%"
              icon={ExclamationTriangleIcon}
              color="yellow"
              trend={Math.random() * 10 - 5}
            />
            <StatCard
              title="Throughput"
              value={
                currentStats.channels.throughput +
                currentStats.hospitality.throughput +
                currentStats.chromecast.throughput
              }
              unit="MB/s"
              icon={SignalIcon}
              color="purple"
              trend={Math.random() * 10 - 5}
            />
          </div>
        )}

        {activeStatsTab === "trends" && (
          <div className="space-y-6">
            {/* Performance Trends Chart */}
            <div className="h-80">
              {loading ? (
                <div className="h-full bg-gray-50 rounded-xl flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">
                    Loading performance trends...
                  </span>
                </div>
              ) : statsHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={statsHistory}
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorRequests"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3B82F6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3B82F6"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorResponseTime"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10B981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10B981"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorThroughput"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#8B5CF6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#8B5CF6"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="time"
                      stroke="#6B7280"
                      fontSize={12}
                      tick={{ fill: "#6B7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#6B7280"
                      fontSize={12}
                      tick={{ fill: "#6B7280" }}
                      axisLine={false}
                      tickLine={false}
                      width={50}
                    />
                    <Tooltip content={<StatsTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="totalRequests"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#colorRequests)"
                      strokeWidth={2}
                      name="Total Requests"
                    />
                    <Area
                      type="monotone"
                      dataKey="avgResponseTime"
                      stroke="#10B981"
                      fillOpacity={1}
                      fill="url(#colorResponseTime)"
                      strokeWidth={2}
                      name="Avg Response Time"
                    />
                    <Area
                      type="monotone"
                      dataKey="throughput"
                      stroke="#8B5CF6"
                      fillOpacity={1}
                      fill="url(#colorThroughput)"
                      strokeWidth={2}
                      name="Throughput"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-gray-50 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <SignalIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">
                      Performance trends data unavailable
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Service Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <ServiceCard
                stats={currentStats.channels}
                displayName="Channels API"
              />
              <ServiceCard
                stats={currentStats.hospitality}
                displayName="Hospitality TV"
              />
              <ServiceCard
                stats={currentStats.chromecast}
                displayName="Chromecast Devices"
              />
            </div>

            {/* Detailed Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-200 rounded-lg">
                    <ChartBarIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-blue-900">
                    Peak Requests
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {Math.max(
                    ...statsHistory.map((d) => d.totalRequests || 0)
                  ).toFixed(0)}
                  <span className="text-sm font-normal text-blue-600 ml-1">
                    req/s
                  </span>
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-200 rounded-lg">
                    <ClockIcon className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-green-900">
                    Min Response
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {Math.min(
                    ...statsHistory.map((d) => d.avgResponseTime)
                  ).toFixed(0)}
                  <span className="text-sm font-normal text-green-600 ml-1">
                    ms
                  </span>
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-200 rounded-lg">
                    <SignalIcon className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-purple-900">
                    Max Throughput
                  </span>
                </div>
                <p className="text-2xl font-bold text-purple-700">
                  {Math.max(...statsHistory.map((d) => d.throughput)).toFixed(
                    1
                  )}
                  <span className="text-sm font-normal text-purple-600 ml-1">
                    MB/s
                  </span>
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-200 rounded-lg">
                    <ExclamationTriangleIcon className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-orange-900">
                    Avg Error Rate
                  </span>
                </div>
                <p className="text-2xl font-bold text-orange-700">
                  {(
                    statsHistory.reduce(
                      (acc, curr) => acc + curr.errorRate,
                      0
                    ) / statsHistory.length
                  ).toFixed(2)}
                  <span className="text-sm font-normal text-orange-600 ml-1">
                    %
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Service Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg">
              <ShieldCheckIcon className="w-5 h-5 text-white" />
            </div>
            Service Health Overview
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Monitoring Active
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Network Status */}
          <div className="group p-6 bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl border border-emerald-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                <SignalIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full">
                HEALTHY
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Network Status</h3>
            <p className="text-sm text-gray-600 mb-3">
              All network connections stable
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uptime</span>
                <span className="font-medium text-emerald-700">99.8%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Latency</span>
                <span className="font-medium text-emerald-700">12ms</span>
              </div>
            </div>
          </div>

          {/* Device Monitoring */}
          <div className="group p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                <ComputerDesktopIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                ACTIVE
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Device Monitoring
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Real-time device health tracking
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monitored Devices</span>
                <span className="font-medium text-blue-700">247</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Online</span>
                <span className="font-medium text-blue-700">
                  {247 -
                    Math.max(
                      ...statsHistory.map((h) => h.activeIssues || 0),
                      0
                    )}
                </span>
              </div>
            </div>
          </div>

          {/* Alert System */}
          <div className="group p-6 bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl border border-purple-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                <BellIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                ENABLED
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Alert System</h3>
            <p className="text-sm text-gray-600 mb-3">
              Automated notification delivery
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Response Time</span>
                <span className="font-medium text-purple-700">&lt; 5sec</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Rate</span>
                <span className="font-medium text-purple-700">100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Service Metrics */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="text-2xl font-bold text-gray-900">
                {statsHistory.reduce(
                  (sum, item) => sum + (item.totalNotifications || 0),
                  0
                )}
              </div>
              <div className="text-sm text-gray-600">Total Processed</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="text-2xl font-bold text-green-600">
                {statsHistory.reduce(
                  (sum, item) => sum + (item.recentRecoveries || 0),
                  0
                )}
              </div>
              <div className="text-sm text-gray-600">Auto-Resolved</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="text-2xl font-bold text-blue-600">
                {statsHistory.length > 0
                  ? Math.round(
                      statsHistory.reduce(
                        (sum, item) => sum + (item.avgResponseTime || 0),
                        0
                      ) /
                        statsHistory.length /
                        10
                    ) + "%"
                  : "0%"}
              </div>
              <div className="text-sm text-gray-600">Efficiency</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="text-2xl font-bold text-purple-600">24/7</div>
              <div className="text-sm text-gray-600">Monitoring</div>
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Performance Analytics */}
      {statsHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          {/* Simple Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-1">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg flex items-center justify-center shadow-lg">
                  <SignalIcon className="w-5 h-5 text-white" />
                </div>
                Performance Analytics
              </h2>
              <p className="text-sm text-gray-600">
                Real-time system performance metrics and trends
              </p>
            </div>

            {/* Simple Controls */}
            <div className="flex items-center gap-4">
              {/* Legend */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">Issues</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Recoveries</span>
                </div>
              </div>

              {/* Time Range */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                {["1h", "6h", "24h"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setPerformanceTimeRange(range)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      performanceTimeRange === range
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-80 mb-6">
            {loading ? (
              <div className="flex items-center justify-center h-full bg-gray-50 rounded-xl">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">
                    Loading traffic data...
                  </p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={statsHistory}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="issues" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="recoveries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    width={40}
                  />

                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                            <p className="font-medium text-gray-900 mb-2">
                              {label}
                            </p>
                            {payload.map((entry, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-sm text-gray-700">
                                  {entry.name}: {entry.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="activeIssues"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#issues)"
                    name="Active Issues"
                    dot={false}
                  />

                  <Area
                    type="monotone"
                    dataKey="recentRecoveries"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#recoveries)"
                    name="Recent Recoveries"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Simple Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Peak Issues</div>
              <div className="text-2xl font-semibold text-red-600">
                {Math.max(...statsHistory.map((h) => h.activeIssues || 0), 0)}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Total Recoveries</div>
              <div className="text-2xl font-semibold text-green-600">
                {statsHistory.reduce(
                  (sum, h) => sum + (h.recentRecoveries || 0),
                  0
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">
                Avg Response Time
              </div>
              <div className="text-2xl font-semibold text-blue-600">
                {Math.round(
                  statsHistory.reduce(
                    (sum, h) => sum + (h.avgResponseTime || 0),
                    0
                  ) / statsHistory.length
                )}
                ms
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Success Rate</div>
              <div className="text-2xl font-semibold text-purple-600">
                {(
                  100 -
                  statsHistory.reduce((sum, h) => sum + (h.errorRate || 0), 0) /
                    statsHistory.length
                ).toFixed(1)}
                %
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
