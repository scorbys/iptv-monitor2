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

export default function NetworkTrafficDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("1h");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [trafficData, setTrafficData] = useState([]);
  const [currentStats, setCurrentStats] = useState({
    channels: { requests: 0, responseTime: 0, errorRate: 0, throughput: 0 },
    hospitality: { requests: 0, responseTime: 0, errorRate: 0, throughput: 0 },
    chromecast: { requests: 0, responseTime: 0, errorRate: 0, throughput: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch current stats from API
  const fetchCurrentStats = useCallback(async () => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch("/api/network/traffic/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const result = await response.json();
      console.log("Fetched stats result:", result);

      // Fungsi validasi struktur data
      const isValidStatsData = (data) => {
        const keys = ["channels", "hospitality", "chromecast"];
        return (
          data &&
          keys.every(
            (key) =>
              typeof data[key] === "object" &&
              typeof data[key].requests === "number" &&
              typeof data[key].responseTime === "number" &&
              typeof data[key].errorRate === "number" &&
              typeof data[key].throughput === "number"
          )
        );
      };

      // Validasi dan update state
      if (result.success && isValidStatsData(result.data)) {
        setCurrentStats(result.data);
        setError(null);
      } else {
        // fallback jika struktur salah
        setCurrentStats({
          channels: {
            requests: 0,
            responseTime: 0,
            errorRate: 0,
            throughput: 0,
          },
          hospitality: {
            requests: 0,
            responseTime: 0,
            errorRate: 0,
            throughput: 0,
          },
          chromecast: {
            requests: 0,
            responseTime: 0,
            errorRate: 0,
            throughput: 0,
          },
        });
        throw new Error("Invalid data structure from stats API");
      }
    } catch (err) {
      console.error("Error fetching current stats:", err);
      setError(err.message);
    }
  }, []);

  // Fetch historical traffic data from API
  const fetchTrafficData = useCallback(async () => {
    try {
      setLoading(true);
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(
        `/api/network/traffic/history?timeRange=${selectedTimeRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch traffic data");
      }

      const result = await response.json();
      if (result.success) {
        setTrafficData(result.data);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching traffic data:", err);
      setError(err.message);
      // Fallback to dummy data if API fails
      setTrafficData(generateFallbackData());
    } finally {
      setLoading(false);
    }
  }, [selectedTimeRange]);

  // Fallback data generator (kept as backup)
  const generateFallbackData = () => {
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

    // Helper function to format time
    const pad2 = (n) => String(n).padStart(2, "0");

    const formatTime = (date) => {
      const h = pad2(date.getHours());
      const m = pad2(date.getMinutes());

      if (selectedTimeRange === "24h") {
        const d = pad2(date.getDate());
        const mo = pad2(date.getMonth() + 1);
        return `${mo}/${d} ${h}:${m}`;
      }

      return `${h}:${m}`;
    };

    // Generate data points
    for (let i = points - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * intervalMs);
      const timeStr = formatTime(time);

      data.push({
        time: timeStr,
        timestamp: time,
        channel: Math.floor(Math.random() * 150) + 50,
        hospitality: Math.floor(Math.random() * 100) + 30,
        chromecast: Math.floor(Math.random() * 80) + 20,
      });
    }

    return data;
  };

  // Initial data load and setup intervals
  useEffect(() => {
    const updateData = async () => {
      setCurrentTime(new Date());
      await Promise.all([fetchCurrentStats(), fetchTrafficData()]);
    };

    // Initial load
    updateData();

    // Setup intervals
    const statsInterval = setInterval(fetchCurrentStats, 30000); // Update stats every 30 seconds
    const trafficInterval = setInterval(fetchTrafficData, 60000); // Update traffic data every minute

    return () => {
      clearInterval(statsInterval);
      clearInterval(trafficInterval);
    };
  }, [fetchCurrentStats, fetchTrafficData]);

  // Update data when time range changes
  useEffect(() => {
    fetchTrafficData();
  }, [selectedTimeRange, fetchTrafficData]);

  const StatCard = ({
    title,
    value,
    unit,
    icon: Icon,
    trend,
    color = "blue",
  }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>
            {typeof value === "number" ? value.toFixed(1) : value}
            <span className="text-sm font-normal text-gray-500 ml-1">
              {unit}
            </span>
          </p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-2">
          {trend > 0 ? (
            <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
          ) : (
            <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
          )}
          <span
            className={`text-sm ${
              trend > 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {Math.abs(trend)}%
          </span>
        </div>
      )}
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} req/s
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header - tetap sama */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              IPTV Monitoring Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div
                className={`w-2 h-2 rounded-full ${
                  error ? "bg-red-500" : "bg-green-500"
                } ${!error ? "animate-pulse" : ""}`}
              ></div>
              {error ? "Error" : "Live"} • {currentTime.toLocaleTimeString()}
            </div>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">Error loading data: {error}</p>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            <p className="text-blue-700">Loading traffic data...</p>
          </div>
        </div>
      )}

      {/* Main Chart - tambahkan loading state */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Request Completion Rate
          </h2>
          <div className="flex items-center gap-6">
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

        <div className="h-80">
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
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  label={{
                    value: "Requests per second",
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

      {/* Stats Grid - menggunakan data real */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        />
      </div>

      {/* Service Details - menggunakan data real */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Channel Service */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">/channels</h3>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-600">Healthy</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Requests/sec</span>
              <span className="text-sm font-medium">
                {currentStats.channels.requests}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="text-sm font-medium">
                {currentStats.channels.responseTime}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className="text-sm font-medium">
                {currentStats.channels.errorRate}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Throughput</span>
              <span className="text-sm font-medium">
                {currentStats.channels.throughput} MB/s
              </span>
            </div>
          </div>
        </div>

        {/* Hospitality Service */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              /hospitality
            </h3>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-600">Healthy</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Requests/sec</span>
              <span className="text-sm font-medium">
                {currentStats.hospitality.requests}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="text-sm font-medium">
                {currentStats.hospitality.responseTime}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className="text-sm font-medium">
                {currentStats.hospitality.errorRate}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Throughput</span>
              <span className="text-sm font-medium">
                {currentStats.hospitality.throughput} MB/s
              </span>
            </div>
          </div>
        </div>

        {/* Chromecast Service */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">/chromecast</h3>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-600">Healthy</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Requests/sec</span>
              <span className="text-sm font-medium">
                {currentStats.chromecast.requests}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="text-sm font-medium">
                {currentStats.chromecast.responseTime}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className="text-sm font-medium">
                {currentStats.chromecast.errorRate}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Throughput</span>
              <span className="text-sm font-medium">
                {currentStats.chromecast.throughput} MB/s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Response Time Chart - menggunakan data real */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Response Time Distribution
        </h3>
        <div className="h-64">
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
