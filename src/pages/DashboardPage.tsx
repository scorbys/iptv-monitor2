import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  ChartBarIcon,
  SignalIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
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

type ColorKey = 'blue' | 'green' | 'yellow' | 'purple' | 'red';

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
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
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
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setTrafficData(generateFallbackData());
      setError(null);
    } catch (err) {
      console.error("Error fetching traffic data:", err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setTrafficData(generateFallbackData());
    } finally {
      setLoading(false);
    }
  }, [generateFallbackData]);

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

  // Fixed StatCard component with proper Tailwind classes
  const StatCard = ({ 
    title, 
    value, 
    unit, 
    icon: Icon, 
    trend, 
    color = "blue" 
  }: {
    title: string;
    value: number | string;
    unit: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: number;
    color?: ColorKey;
  }) => {
    const colorClasses: Record<ColorKey, { text: string; bg: string; icon: string }> = {
      blue: { text: "text-blue-600", bg: "bg-blue-100", icon: "text-blue-600" },
      green: { text: "text-green-600", bg: "bg-green-100", icon: "text-green-600" },
      yellow: { text: "text-yellow-600", bg: "bg-yellow-100", icon: "text-yellow-600" },
      purple: { text: "text-purple-600", bg: "bg-purple-100", icon: "text-purple-600" },
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
        {typeof trend === "number" && (
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

  const CustomTooltip = ({ active, payload, label }: {
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
            <p key={entry.name || index} className="text-sm" style={{ color: entry.color }}>
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
    if (errorRate < 1) return { color: "text-green-600", icon: CheckCircleIcon, text: "Healthy" };
    if (errorRate < 5) return { color: "text-yellow-600", icon: ExclamationTriangleIcon, text: "Warning" };
    return { color: "text-red-600", icon: ExclamationTriangleIcon, text: "Critical" };
  };

  const ServiceCard = ({ stats, displayName }: {
    name: string;
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
            <span className={`text-sm font-medium ${status.color}`}>{status.text}</span>
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
            <span className={`text-sm font-semibold ${
              stats.errorRate < 1 ? 'text-green-600' : 
              stats.errorRate < 5 ? 'text-yellow-600' : 'text-red-600'
            }`}>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      {/* Header - Responsive */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              IPTV Monitoring Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">Real-time network traffic monitoring</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div
                className={`w-2 h-2 rounded-full ${
                  error ? "bg-red-500" : "bg-green-500"
                } ${!error ? "animate-pulse" : ""}`}
              />
              <span className="font-medium">
                {error ? "Error" : "Live"}
              </span>
              <span className="text-gray-400">•</span>
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            >
              <option value="1h">Last 1 Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
            </select>
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

      {/* Main Chart - Responsive */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Request Completion Rate
          </h2>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">/channels</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">/hospitality</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">/chromecast</span>
            </div>
          </div>
        </div>

        <div className="h-64 sm:h-80">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="time"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  label={{
                    value: "Requests/sec",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="channels"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="/channels"
                />
                <Line
                  type="monotone"
                  dataKey="hospitality"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="/hospitality"
                />
                <Line
                  type="monotone"
                  dataKey="chromecast"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                  name="/chromecast"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Stats Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
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
              currentStats.chromecast.responseTime) / 3
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
              currentStats.chromecast.errorRate) / 3
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

      {/* Service Details - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <ServiceCard
          name="channels"
          stats={currentStats.channels}
          displayName="/channels"
        />
        <ServiceCard
          name="hospitality"
          stats={currentStats.hospitality}
          displayName="/hospitality"
        />
        <ServiceCard
          name="chromecast"
          stats={currentStats.chromecast}
          displayName="/chromecast"
        />
      </div>

      {/* Response Time Chart - Responsive */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Response Time Distribution
        </h3>
        <div className="h-48 sm:h-64 text-gray-600">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                {
                  name: "/channels",
                  value: currentStats.channels.responseTime,
                },
                {
                  name: "/hospitality",
                  value: currentStats.hospitality.responseTime,
                },
                {
                  name: "/chromecast",
                  value: currentStats.chromecast.responseTime,
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                label={{
                  value: "Response Time (ms)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}