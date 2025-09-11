"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SignalIcon,
  WifiIcon,
  DevicePhoneMobileIcon,
  XMarkIcon,
  ChevronRightIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  PowerIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { DateFormatter } from "../components/DateFormatter";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface FAQ {
  id: number;
  category: string;
  device: string;
  issue: string;
  solutions: string[];
  hasImage: boolean;
  actionType: string;
  priority: string;
  slug: string;
}

interface ChromecastDetail {
  idCast: number;
  type: string;
  deviceName: string;
  ipAddr: string;
  isPingable: boolean;
  isOnline: boolean;
  signalLevel: number;
  speed: number;
  hops: number;
  lastSeen: string;
  responseTime?: number;
  error?: string;
  model?: string;
}

interface DeviceStatus {
  power: "working" | "error";
  lanIp: "working" | "error";
  wifi: "working" | "error";
  loginSurname: "working" | "error";
  other: "working" | "error";
}

interface NetworkMetrics {
  sent: string;
  received: string;
  latency: number;
  jitter: number;
  ttl: number;
  packetLoss: number;
  bandwidth: number;
  hops: number;
}

interface NetworkHistory {
  time: string;
  latency: number;
  bandwidth: number;
  jitter: number;
  packetLoss: number;
  sent: number;
  received: number;
  hops: number;
}

interface ChromecastDetailPageProps {
  deviceId: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

interface DebugInfo {
  searchingFor: string;
  availableDevices: Array<{
    id: number;
    name: string;
  }>;
  exactMatch?: {
    name: string;
    id: number;
  };
  caseInsensitiveMatch?: {
    name: string;
    id: number;
  };
  partialMatch?: {
    name: string;
    id: number;
  };
  totalDevices: number;
}

interface StatusBadgeProps {
  status: "working" | "error";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value?: string;
  unit?: string;
  action?: {
    type: string;
    label: string;
    onClick: () => void;
  };
}

// FAQ Data (from datafaq.txt)
const faqData: FAQ[] = [
  {
    id: 1,
    category: "Kategori-1",
    device: "Chromecast",
    issue: "No Device Found Chromecast",
    solutions: [
      "Deactive White list profile",
      "Restart Chromecast & WIFI",
      "Radisson Guest Must Be Login",
      "Forget WIFI Radisson Guest",
      "Logout WIFI (log-out.me)",
    ],
    hasImage: true,
    actionType: "System",
    priority: "High",
    slug: "no-device-found-chromecast",
  },
  {
    id: 4,
    category: "Kategori-4",
    device: "Chromecast",
    issue: "Chromecast Setup iOS",
    solutions: [
      "Install Google Home app",
      "Pastikan perangkat dalam satu jaringan WiFi",
      "Allow local network access pada iPhone",
      "Follow setup wizard di aplikasi",
    ],
    hasImage: true,
    actionType: "System",
    priority: "Medium",
    slug: "chromecast-setup-ios",
  },
  {
    id: 8,
    category: "Kategori-8",
    device: "Chromecast",
    issue: "Reset Configuration",
    solutions: [
      "Restart Chromecast",
      "Reset Chromecast dibawa ke ruang server pencet tombol poer 10 Detik",
    ],
    hasImage: false,
    actionType: "On Site",
    priority: "Low",
    slug: "reset-configuration",
  },
  {
    id: 10,
    category: "Kategori-10",
    device: "Chromecast",
    issue: "Chromecast Black Screen",
    solutions: ["Chromecast Power Adaptor Rusak", "Check Adaptor Chromecast"],
    hasImage: true,
    actionType: "System",
    priority: "Medium",
    slug: "chromecast-black-screen",
  },
];

// Generate random network data
const generateRandomNetworkData = (): NetworkMetrics => {
  return {
    sent: (Math.random() * 10 + 5).toFixed(2),
    received: (Math.random() * 8 + 3).toFixed(2),
    latency: Math.floor(Math.random() * 50) + 10,
    jitter: Math.floor(Math.random() * 20) + 1,
    ttl: Math.floor(Math.random() * 10) + 58,
    packetLoss: parseFloat((Math.random() * 2).toFixed(2)),
    bandwidth: Math.floor(Math.random() * 80) + 20,
    hops: Math.floor(Math.random() * 20) + 15,
  };
};

// Generate historical data
const generateHistoricalData = (
  timeRange: string,
  isOnline: boolean
): NetworkHistory[] => {
  const now = new Date();
  const data: NetworkHistory[] = [];

  let points: number;
  let intervalMs: number;

  switch (timeRange) {
    case "1h":
      points = 60;
      intervalMs = 60000;
      break;
    case "24h":
      points = 24;
      intervalMs = 3600000;
      break;
    case "7d":
      points = 7;
      intervalMs = 86400000;
      break;
    default:
      points = 24;
      intervalMs = 3600000;
  }

  for (let i = points - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * intervalMs);
    const timeStr =
      timeRange === "24h"
        ? `${String(time.getHours()).padStart(2, "0")}:00`
        : timeRange === "7d"
        ? time.toLocaleDateString()
        : `${String(time.getHours()).padStart(2, "0")}:${String(
            time.getMinutes()
          ).padStart(2, "0")}`;

    data.push({
      time: timeStr,
      latency: isOnline ? Math.floor(Math.random() * 40) + 10 : 0,
      bandwidth: isOnline ? Math.floor(Math.random() * 60) + 40 : 0,
      jitter: isOnline ? Math.floor(Math.random() * 20) + 5 : 0,
      packetLoss: isOnline ? parseFloat((Math.random() * 1.5).toFixed(2)) : 0,
      sent: isOnline ? parseFloat((Math.random() * 5 + 2).toFixed(2)) : 0,
      received: isOnline ? parseFloat((Math.random() * 4 + 1).toFixed(2)) : 0,
      hops: isOnline ? Math.floor(Math.random() * 15) + 10 : 0,
    });
  }

  return data;
};

export default function ChromecastDetailPage({
  deviceId,
}: ChromecastDetailPageProps) {
  const [device, setDevice] = useState<ChromecastDetail | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    power: "working",
    lanIp: "working",
    wifi: "working",
    loginSurname: "working",
    other: "working",
  });
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [previousMetrics, setPreviousMetrics] = useState<NetworkMetrics | null>(
    null
  );

  // Network metrics state
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetrics | null>(
    null
  );
  const [networkHistory, setNetworkHistory] = useState<NetworkHistory[]>([]);
  const [activeTab, setActiveTab] = useState("24h");
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-refresh network data every 30 seconds
  useEffect(() => {
    if (!device) return;

    const refreshNetworkData = () => {
      // Gunakan functional update untuk mengakses previous state
      setNetworkMetrics((prevMetrics) => {
        // Simpan metrics sebelumnya
        if (prevMetrics) {
          setPreviousMetrics(prevMetrics);
        }

        // Generate new metrics
        return generateRandomNetworkData();
      });

      const newHistory = generateHistoricalData(activeTab, device.isOnline);
      setNetworkHistory(newHistory);
    };

    // Initial load
    refreshNetworkData();

    // Set up interval for auto-refresh
    const interval = setInterval(refreshNetworkData, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [device, activeTab]);

  // Enhanced error handling function
  const handleApiError = (error: unknown, context: string) => {
    console.error(`Error in ${context}:`, error);

    if (error instanceof Error) {
      if (error.message.includes("401")) {
        window.location.href = "/login";
        return;
      }
      if (error.message.includes("404")) {
        setError(`Device "${deviceId}" not found`);
        return;
      }
      if (error.message.includes("400")) {
        setError(`Invalid device identifier: "${deviceId}"`);
        return;
      }
      setError(`${context}: ${error.message}`);
    } else {
      setError(`${context}: Unknown error occurred`);
    }
  };

  // Function untuk fetch network metrics with better error handling
  const fetchNetworkMetrics = async (deviceId: string) => {
    try {
      // Ensure deviceId is properly encoded for URL
      const encodedDeviceId = encodeURIComponent(deviceId);
      const response = await fetch(
        `/api/chromecast/${encodedDeviceId}/metrics`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNetworkMetrics(result.data);
        }
      } else {
        console.warn(`Network metrics not available (${response.status})`);
      }
    } catch (error) {
      console.warn("Network metrics unavailable:", error);
      // Don't set error state for metrics as it's not critical
    }
  };

  // Function untuk fetch network history with better error handling
  const fetchNetworkHistory = async (deviceId: string, timeRange = "24h") => {
    try {
      setLoadingMetrics(true);
      const encodedDeviceId = encodeURIComponent(deviceId);
      const response = await fetch(
        `/api/chromecast/${encodedDeviceId}/history?timeRange=${timeRange}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNetworkHistory(result.data);
        }
      } else {
        console.warn(`Network history not available (${response.status})`);
        // Fallback to generated data
        const fallbackData = generateHistoricalData(
          timeRange,
          device?.isOnline || false
        );
        setNetworkHistory(fallbackData);
      }
    } catch (error) {
      console.warn("Network history unavailable:", error);
      // Fallback to generated data
      const fallbackData = generateHistoricalData(
        timeRange,
        device?.isOnline || false
      );
      setNetworkHistory(fallbackData);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const TrendIndicator = useCallback(({ trend }: { trend: string }) => {
    if (trend === "up") {
      return (
        <div className="ml-2">
          <div className="w-0 h-0 border-l-2 border-r-2 border-b-3 border-l-transparent border-r-transparent border-b-green-500"></div>
        </div>
      );
    }
    if (trend === "down") {
      return (
        <div className="ml-2">
          <div className="w-0 h-0 border-l-2 border-r-2 border-t-3 border-l-transparent border-r-transparent border-t-red-500"></div>
        </div>
      );
    }
    return null;
  }, []);

  // Speed component
  const SpeedIndicator = useCallback(({ speed }: { speed: number }) => {
    const getSpeedColor = (speed: number) => {
      if (speed >= 80) return "text-green-600";
      if (speed >= 50) return "text-yellow-600";
      if (speed >= 25) return "text-orange-600";
      return "text-red-600";
    };

    return (
      <div className="flex items-center text-red-600">
        <span className={`font-semibold ${getSpeedColor(speed)}`}>
          {speed} Mbps
        </span>
      </div>
    );
  }, []);

  const MetricCard = React.memo(
    ({
      value,
      previousValue,
      type,
      unit,
      label,
      isOnline = true,
    }: {
      value: number;
      previousValue?: number;
      type:
        | "latency"
        | "bandwidth"
        | "signal"
        | "speed"
        | "data_sent"
        | "data_received";
      unit: string;
      label: string;
      isOnline?: boolean;
    }) => {
      // Jika device offline, tampilkan gray dengan nilai 0
      if (!isOnline) {
        return (
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-center mb-1">
              <p className="text-2xl font-bold text-gray-400">0{unit}</p>
            </div>
            <p className="text-xs font-medium text-gray-400">{label}</p>
            <div className="mt-1">
              <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded-full">
                Offline
              </span>
            </div>
          </div>
        );
      }

      const getStatusColor = (
        current: number,
        previous: number | undefined,
        type: string
      ) => {
        // Untuk data sent/received - hijau jika naik, gray jika turun/sama
        if (type === "data_sent" || type === "data_received") {
          if (!previous || current <= previous) {
            return {
              bgColor: "bg-white border-gray-200",
              textColor: "text-gray-700",
              badgeColor: "bg-gray-100 text-gray-700",
            };
          } else {
            return {
              bgColor: "bg-green-50 border-green-200",
              textColor: "text-green-700",
              badgeColor: "bg-green-100 text-green-700",
            };
          }
        }

        if (!previous) {
          // Nilai stabil/normal - hijau
          return {
            bgColor: "bg-green-50 border-green-200",
            textColor: "text-green-700",
            badgeColor: "bg-green-100 text-green-700",
          };
        }

        const diff = Math.abs(current - previous);
        const threshold = getThreshold(type, current);

        if (diff < threshold) {
          // Stabil - hijau
          return {
            bgColor: "bg-green-50 border-green-200",
            textColor: "text-green-700",
            badgeColor: "bg-green-100 text-green-700",
          };
        }

        // Untuk latency dan packet loss, nilai tinggi = buruk
        if (type === "latency" || type === "packetLoss") {
          if (current > previous) {
            // Memburuk - merah
            return {
              bgColor: "bg-red-50 border-red-200",
              textColor: "text-red-700",
              badgeColor: "bg-red-100 text-red-700",
            };
          } else {
            // Membaik - kuning/warning (karena ada perubahan signifikan)
            return {
              bgColor: "bg-yellow-50 border-yellow-200",
              textColor: "text-yellow-700",
              badgeColor: "bg-yellow-100 text-yellow-700",
            };
          }
        }

        // Untuk bandwidth, speed, dll - nilai tinggi = baik
        if (current < previous) {
          // Menurun - kuning ke merah tergantung seberapa buruk
          const degradationPercent = ((previous - current) / previous) * 100;
          if (degradationPercent > 25) {
            return {
              bgColor: "bg-red-50 border-red-200",
              textColor: "text-red-700",
              badgeColor: "bg-red-100 text-red-700",
            };
          } else {
            return {
              bgColor: "bg-yellow-50 border-yellow-200",
              textColor: "text-yellow-700",
              badgeColor: "bg-yellow-100 text-yellow-700",
            };
          }
        } else {
          // Meningkat - hijau
          return {
            bgColor: "bg-green-50 border-green-200",
            textColor: "text-green-700",
            badgeColor: "bg-green-100 text-green-700",
          };
        }
      };

      const getThreshold = (type: string, currentValue: number) => {
        switch (type) {
          case "latency":
            return Math.max(5, currentValue * 0.1); // 10% atau min 5ms
          case "bandwidth":
            return Math.max(5, currentValue * 0.15); // 15% atau min 5Mbps
          case "packetLoss":
            return 0.5; // 0.5%
          case "data_sent":
          case "data_received":
            return 0.1; // 0.1GB threshold
          default:
            return Math.max(2, currentValue * 0.1); // 10% atau min 2
        }
      };

      const statusColors = getStatusColor(value, previousValue, type);
      const trend = getTrendIndicator(value, previousValue, type);

      return (
        <div
          className={`text-center p-3 ${statusColors.bgColor} border rounded-lg transition-all duration-300`}
        >
          <div className="flex items-center justify-center mb-1">
            <p className={`text-2xl font-bold ${statusColors.textColor}`}>
              {value}
              {unit}
            </p>
            {previousValue && <TrendIndicator trend={trend.direction} />}
          </div>
          <p className={`text-xs font-medium ${statusColors.textColor} mb-2`}>
            {label}
          </p>
        </div>
      );
    }
  );

  const getTrendIndicator = (
    current: number,
    previous: number | undefined,
    type: string
  ) => {
    if (!previous) return { direction: "stable", color: "gray" };

    const diff = current - previous;
    const threshold = type === "latency" ? 5 : type === "bandwidth" ? 5 : 2;

    if (Math.abs(diff) < threshold) {
      return { direction: "stable", color: "gray" };
    }

    return {
      direction: diff > 0 ? "up" : "down",
      color: diff > 0 ? "green" : "red",
    };
  };

  MetricCard.displayName = "MetricCard";

  // useEffect for fetching device details with better error handling
  useEffect(() => {
    if (!mounted || !deviceId) return;

    const fetchDeviceDetails = async () => {
      try {
        setLoading(true);
        setError(null); // Clear previous errors
        setDebugInfo(null); // Clear debug info

        // Validate deviceId before making request
        if (!deviceId.trim()) {
          setError("Invalid device identifier");
          return;
        }

        // Enhanced debugging
        console.log("=== DEVICE FETCH DEBUG ===");
        console.log("Original deviceId:", deviceId);
        console.log("DeviceId type:", typeof deviceId);
        console.log("DeviceId length:", deviceId.length);
        console.log("DeviceId encoded:", encodeURIComponent(deviceId));

        // Try multiple API approaches
        const apiAttempts = [
          // Approach 1: Use device name as-is (most common case)
          {
            url: `/api/chromecast/${encodeURIComponent(deviceId)}`,
            method: "direct_name",
            identifier: deviceId,
          },
          // Approach 2: Try without encoding (in case it's already encoded)
          {
            url: `/api/chromecast/${deviceId}`,
            method: "raw",
            identifier: deviceId,
          },
          // Approach 3: Double encoding (sometimes needed)
          {
            url: `/api/chromecast/${encodeURIComponent(
              encodeURIComponent(deviceId)
            )}`,
            method: "double_encoded",
            identifier: deviceId,
          },
        ];

        let success = false;
        let lastError: Record<string, unknown> | null = null;

        // First, try to get all devices to see what's available
        try {
          const allDevicesResponse = await fetch("/api/chromecast", {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (allDevicesResponse.ok) {
            const allDevicesResult = await allDevicesResponse.json();
            if (allDevicesResult.success) {
              const availableDevices = allDevicesResult.data.map(
                (d: ChromecastDetail) => ({
                  id: d.idCast || d.idCast,
                  name: d.deviceName,
                })
              );

              console.log("Available devices from API:", availableDevices);

              // Check if our device exists in the list
              const exactMatch = availableDevices.find(
                (d: { name: string }) => d.name === deviceId
              );
              const caseInsensitiveMatch = availableDevices.find(
                (d: { name: string }) =>
                  d.name && d.name.toLowerCase() === deviceId.toLowerCase()
              );
              const partialMatch = availableDevices.find(
                (d: { name: string }) =>
                  d.name &&
                  (d.name.includes(deviceId) || deviceId.includes(d.name))
              );

              setDebugInfo({
                searchingFor: deviceId,
                availableDevices: availableDevices.slice(0, 10), // Limit for display
                exactMatch: exactMatch || undefined,
                caseInsensitiveMatch: caseInsensitiveMatch || undefined,
                partialMatch: partialMatch || undefined,
                totalDevices: availableDevices.length,
              });

              // If we found an exact match by name, try to fetch it by ID instead
              if (exactMatch && exactMatch.id) {
                apiAttempts.unshift({
                  url: `/api/chromecast/${exactMatch.id}`,
                  method: "by_id",
                  identifier: exactMatch.id.toString(),
                });
              }
            }
          }
        } catch (devicesError) {
          console.warn(
            "Could not fetch device list for debugging:",
            devicesError
          );
        }

        // Try each API approach
        for (const attempt of apiAttempts) {
          if (success) break;

          try {
            console.log(`Trying ${attempt.method} approach: ${attempt.url}`);

            const response = await fetch(attempt.url, {
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
              },
            });

            console.log(`${attempt.method} response status:`, response.status);

            if (response.status === 401) {
              window.location.href = "/login";
              return;
            }

            if (response.ok) {
              const result = await response.json();
              console.log(`${attempt.method} response:`, result);

              if (result.success && result.data) {
                setDevice(result.data);
                generateDeviceStatus(result.data);
                success = true;

                console.log(
                  `Successfully found device using ${attempt.method} method`
                );

                // Try to fetch network data (non-blocking)
                fetchNetworkMetrics(deviceId).catch(console.warn);
                fetchNetworkHistory(deviceId, activeTab).catch(console.warn);
                break;
              }
            } else if (response.status === 404) {
              const errorResult = await response.json();
              lastError = errorResult;
              console.log(`${attempt.method} returned 404:`, errorResult);
            } else {
              const errorResult = await response
                .json()
                .catch(() => ({ message: `HTTP ${response.status}` }));
              lastError = errorResult;
              console.log(`${attempt.method} failed:`, errorResult);
            }
          } catch (attemptError) {
            console.warn(`${attempt.method} attempt failed:`, attemptError);
            lastError = {
              message: `${attempt.method} request failed: ${attemptError}`,
            };
          }
        }

        if (!success) {
          // Enhanced error message with debugging info
          const errorDetails =
            (
              lastError as {
                details?: { availableDevices?: Array<{ name: string }> };
              }
            )?.details || {};
          const suggestions =
            errorDetails.availableDevices || debugInfo?.availableDevices || [];

          let errorMessage = `Unable to find device "${deviceId}".`;

          if (suggestions.length > 0) {
            errorMessage += ` Available devices: ${suggestions
              .map((d: { name: string }) => d.name)
              .filter(Boolean)
              .slice(0, 5)
              .join(", ")}`;

            // Check for similar names
            const similarDevice = suggestions.find(
              (d: { name: string }) =>
                d.name &&
                (d.name.toLowerCase().includes(deviceId.toLowerCase()) ||
                  deviceId.toLowerCase().includes(d.name.toLowerCase()))
            );

            if (similarDevice) {
              errorMessage += `. Did you mean "${similarDevice.name}"?`;
            }
          }

          setError(errorMessage);
        }
      } catch (error) {
        handleApiError(error, "fetching device details");
      } finally {
        setLoading(false);
        console.log("=== DEVICE FETCH DEBUG END ===");
      }
    };

    fetchDeviceDetails();
  }, [deviceId, mounted, activeTab]);

  // Effect untuk update network history saat tab berubah
  useEffect(() => {
    if (device && !loading) {
      fetchNetworkHistory(deviceId, activeTab).catch(console.warn);
    }
  }, [activeTab, device]);

  // Function untuk handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Custom Tooltip untuk chart
  const CustomTooltip: React.FC<CustomTooltipProps> = ({
    active,
    payload,
    label,
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900">{`Time: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}${
                entry.name === "Latency"
                  ? "ms"
                  : entry.name === "Bandwidth"
                  ? "Mbps"
                  : entry.name === "Jitter"
                  ? "ms"
                  : entry.name === "Packet Loss"
                  ? "%"
                  : entry.name === "Speed"
                  ? "Mbps"
                  : ""
              }`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Generate device status based on device data
  const generateDeviceStatus = (deviceData: ChromecastDetail) => {
    const status: DeviceStatus = {
      power: deviceData.isOnline ? "working" : "error",
      lanIp: deviceData.isPingable ? "working" : "error",
      wifi:
        deviceData.signalLevel && deviceData.signalLevel > -100
          ? "working"
          : "error",
      loginSurname: deviceData.isOnline ? "working" : "error",
      other: deviceData.error ? "error" : "working",
    };
    setDeviceStatus(status);
  };

  // Enhanced Check device status function
  const handleCheckDevice = async () => {
    if (!device || checking) return;

    setChecking(true);
    try {
      // Try using deviceName first (as per original code logic), then fallback to idCast
      const deviceIdentifier = device.deviceName || device.idCast;
      const encodedIdentifier = encodeURIComponent(deviceIdentifier.toString());

      const response = await fetch(
        `/api/chromecast/${encodedIdentifier}/check`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDevice(result.data);
          generateDeviceStatus(result.data);
        }
      } else {
        console.warn("Check device failed:", response.status);
      }
    } catch (error) {
      console.error("Error checking device:", error);
    } finally {
      setChecking(false);
    }
  };

  // Enhanced troubleshooting detection function
  const detectIssues = () => {
    if (!device) return [];

    const issues = [];

    // Check various device conditions
    if (!device.isOnline) {
      issues.push(
        faqData.find((faq) => faq.slug === "no-device-found-chromecast")
      );
    }
    if (device.error && device.error.includes("black screen")) {
      issues.push(
        faqData.find((faq) => faq.slug === "chromecast-black-screen")
      );
    }
    if (!device.isPingable) {
      issues.push(faqData.find((faq) => faq.slug === "reset-configuration"));
    }

    // Add network-based issue detection
    if (device.signalLevel && device.signalLevel < -70) {
      issues.push(faqData.find((faq) => faq.slug === "chromecast-setup-ios")); // WiFi issue
    }

    return issues.filter(Boolean) as FAQ[];
  };

  const detectedIssues = useMemo(() => detectIssues(), [device]);

  // Repair Action Function
  const handleRepairAction = async (issue: FAQ) => {
    try {
      console.log("Attempting automated repair for:", issue.issue);
      // Show loading state
      setChecking(true);

      // Simulate repair process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Refresh device status after repair attempt
      await handleCheckDevice();

      // Show success message
      alert(`Repair attempt completed for: ${issue.issue}`);
    } catch (error) {
      console.error("Repair failed:", error);
      alert("Automated repair failed. Please try manual troubleshooting.");
    } finally {
      setChecking(false);
    }
  };

  // StatusBadge component
  const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    label,
    icon: Icon,
    value,
    unit,
    action,
  }) => {
    const isWorking = status === "working";
    return (
      <div
        className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
          isWorking
            ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:shadow-sm"
            : "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
        }`}
      >
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-lg ${
              isWorking ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <Icon
              className={`w-4 h-4 ${
                isWorking ? "text-green-600" : "text-red-600"
              }`}
            />
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-900">{label}</span>
            {value && (
              <div className="text-xs text-gray-600 mt-1">
                {value} {unit}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isWorking ? (
              <>
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700">
                  Working
                </span>
              </>
            ) : (
              <>
                <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                <span className="text-xs font-semibold text-red-700">
                  Error
                </span>
              </>
            )}
          </div>
          {action && (
            <button
              onClick={action.onClick}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                action.type === "repair"
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (!mounted || loading) {
    return (
      <div className="p-6 bg-blue-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading device details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-blue-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
            <button
              onClick={() => router.push("/chromecast")}
              className="hover:text-blue-600 transition-colors"
            >
              Chromecast
            </button>
            <ChevronRightIcon className="w-4 h-4" />
            <span className="text-gray-400">Error</span>
          </nav>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Device Not Found
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
            </div>

            {/* Debug Information */}
            {debugInfo && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Debug Information:
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Searching for:</span>
                    <code className="ml-2 bg-gray-200 px-2 py-1 rounded">
                      {debugInfo.searchingFor}
                    </code>
                  </div>

                  {debugInfo.exactMatch && (
                    <div>
                      <span className="font-medium text-green-600">
                        Exact match found:
                      </span>
                      <code className="ml-2 bg-green-100 px-2 py-1 rounded">
                        {debugInfo.exactMatch.name}
                      </code>
                    </div>
                  )}

                  {debugInfo.caseInsensitiveMatch && !debugInfo.exactMatch && (
                    <div>
                      <span className="font-medium text-yellow-600">
                        Case-insensitive match:
                      </span>
                      <code className="ml-2 bg-yellow-100 px-2 py-1 rounded">
                        {debugInfo.caseInsensitiveMatch.name}
                      </code>
                    </div>
                  )}

                  {debugInfo.partialMatch &&
                    !debugInfo.exactMatch &&
                    !debugInfo.caseInsensitiveMatch && (
                      <div>
                        <span className="font-medium text-blue-600">
                          Partial match:
                        </span>
                        <code className="ml-2 bg-blue-100 px-2 py-1 rounded">
                          {debugInfo.partialMatch.name}
                        </code>
                      </div>
                    )}

                  <div>
                    <span className="font-medium">
                      Total devices available:
                    </span>
                    <span className="ml-2">{debugInfo.totalDevices}</span>
                  </div>

                  {debugInfo.availableDevices &&
                    debugInfo.availableDevices.length > 0 && (
                      <div>
                        <span className="font-medium">
                          Sample device names:
                        </span>
                        <ul className="mt-2 ml-4 space-y-1">
                          {debugInfo.availableDevices
                            .slice(0, 5)
                            .map((device, index) => (
                              <li
                                key={index}
                                className="flex items-center space-x-2"
                              >
                                <code className="bg-gray-200 px-2 py-1 rounded text-xs">
                                  {device.name || "Unnamed"}
                                </code>
                                <span className="text-gray-500 text-xs">
                                  ({device.id})
                                </span>
                              </li>
                            ))}
                          {debugInfo.availableDevices.length > 5 && (
                            <li className="text-gray-500 text-xs">
                              ... and {debugInfo.availableDevices.length - 5}{" "}
                              more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              </div>
            )}

            <div className="text-center space-y-3">
              <button
                onClick={() => router.push("/chromecast")}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Chromecast List
              </button>
              <div className="text-sm text-gray-500">
                <p>
                  Device ID:{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    {deviceId}
                  </code>
                </p>
                <p className="mt-1">
                  If this device should exist, please check the device
                  identifier or contact support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!device) return null;

  // Show troubleshooting panel
  if (showTroubleshooting) {
    return (
      <div className="p-6 bg-blue-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
            <button
              onClick={() => router.push("/chromecast")}
              className="hover:text-blue-600 transition-colors"
            >
              Chromecast
            </button>
            <ChevronRightIcon className="w-4 h-4" />
            <button
              onClick={() => setShowTroubleshooting(false)}
              className="hover:text-blue-600 transition-colors"
            >
              {device.deviceName}
            </button>
            <ChevronRightIcon className="w-4 h-4" />
            <span className="text-gray-400">Troubleshooting</span>
          </nav>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Troubleshooting Issues
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Detected {detectedIssues.length} issue
                    {detectedIssues.length !== 1 ? "s" : ""} with{" "}
                    {device.deviceName}
                  </p>
                </div>
                <button
                  onClick={() => setShowTroubleshooting(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Issues List */}
            <div className="p-6 space-y-4">
              {detectedIssues.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Issues Detected
                  </h3>
                  <p className="text-gray-600">
                    The device appears to be working normally.
                  </p>
                </div>
              ) : (
                detectedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-white to-gray-50"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className={`p-2 rounded-lg ${
                              issue.priority === "High"
                                ? "bg-red-100"
                                : issue.priority === "Medium"
                                ? "bg-yellow-100"
                                : "bg-gray-100"
                            }`}
                          >
                            <WrenchScrewdriverIcon
                              className={`w-5 h-5 ${
                                issue.priority === "High"
                                  ? "text-red-600"
                                  : issue.priority === "Medium"
                                  ? "text-yellow-600"
                                  : "text-gray-600"
                              }`}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {issue.issue}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {issue.category}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          issue.priority === "High"
                            ? "bg-red-100 text-red-800"
                            : issue.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {issue.priority} Priority
                      </span>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <DocumentTextIcon className="w-4 h-4 mr-2 text-blue-600" />
                        Recommended Solutions:
                      </h4>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <ul className="space-y-2">
                          {issue.solutions.map((solution, index) => (
                            <li
                              key={index}
                              className="flex items-start text-sm text-gray-700"
                            >
                              <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-medium flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                {index + 1}
                              </span>
                              <span>{solution}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                      {issue.actionType === "System" ? (
                        <button
                          onClick={() => handleRepairAction(issue)}
                          disabled={checking}
                          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <WrenchScrewdriverIcon
                            className={`w-4 h-4 mr-2 ${
                              checking ? "animate-spin" : ""
                            }`}
                          />
                          {checking ? "Repairing..." : "Auto Repair"}
                        </button>
                      ) : (
                        <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 text-sm font-medium rounded-xl border border-orange-200">
                          <WrenchScrewdriverIcon className="w-4 h-4 mr-2" />
                          On-Site Service Required
                        </div>
                      )}

                      <button
                        onClick={() =>
                          router.push(`/help/details/${issue.slug}`)
                        }
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-sm font-medium rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 border border-blue-200"
                      >
                        <DocumentTextIcon className="w-4 h-4 mr-2" />
                        View Detailed Guide
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-blue-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <button
            onClick={() => router.push("/chromecast")}
            className="hover:text-blue-600 transition-colors"
          >
            Chromecast
          </button>
          <ChevronRightIcon className="w-4 h-4" />
          <span className="text-gray-400">{device.deviceName}</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          {/* Table Layout */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Network
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <DevicePhoneMobileIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {device.deviceName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {device.type}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">
                      {device.ipAddr}
                    </div>
                    <div className="flex items-center mt-1">
                      <SignalIcon
                        className={`h-4 w-4 mr-1 ${
                          device.isOnline ? "text-green-500" : "text-red-500"
                        }`}
                      />
                      <span className="text-sm text-gray-500">
                        {device.signalLevel}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          device.isOnline
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full mr-1 ${
                            device.isOnline ? "bg-green-500" : "bg-red-500"
                          }`}
                        ></div>
                        {device.isOnline ? "Online" : "Offline"}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          device.isPingable
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {device.isPingable ? "Pingable" : "Disconnect"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <SpeedIndicator speed={device.speed || 0} />
                      <div className="text-xs text-gray-500 mt-1">
                        Response: {device.responseTime || 0}ms
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <DateFormatter
                      date={device.lastSeen}
                      fallback="Never seen"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={handleCheckDevice}
                      disabled={checking}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                    >
                      <ArrowPathIcon
                        className={`w-3 h-3 mr-1 ${
                          checking ? "animate-spin" : ""
                        }`}
                      />
                      Check
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Device Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Network Performance Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Network Performance
                </h2>
                <div className="flex items-center space-x-2 text-sm">
                  <button
                    onClick={() => handleTabChange("1h")}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      activeTab === "1h"
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "text-gray-600 hover:text-blue-600"
                    }`}
                  >
                    Hourly
                  </button>
                  <button
                    onClick={() => handleTabChange("24h")}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      activeTab === "24h"
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "text-gray-600 hover:text-blue-600"
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => handleTabChange("7d")}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      activeTab === "7d"
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "text-gray-600 hover:text-blue-600"
                    }`}
                  >
                    Weekly
                  </button>
                </div>
              </div>

              {/* Chart Area */}
              <div className="h-64 mb-4">
                {loadingMetrics ? (
                  <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">
                      Loading network data...
                    </span>
                  </div>
                ) : networkHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={networkHistory}
                      margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorLatency"
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
                          id="colorBandwidth"
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
                        width={35}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="latency"
                        stroke="#3B82F6"
                        fillOpacity={1}
                        fill="url(#colorLatency)"
                        strokeWidth={2}
                        name="Latency"
                      />
                      <Area
                        type="monotone"
                        dataKey="bandwidth"
                        stroke="#10B981"
                        fillOpacity={1}
                        fill="url(#colorBandwidth)"
                        strokeWidth={2}
                        name="Bandwidth"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <SignalIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">
                        Network performance data unavailable
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Row */}
              {networkMetrics && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                  <MetricCard
                    value={networkMetrics.jitter}
                    previousValue={previousMetrics?.jitter}
                    type="latency"
                    unit="ms"
                    label="Jitter"
                    isOnline={device.isOnline}
                  />

                  <MetricCard
                    value={networkMetrics.ttl}
                    previousValue={previousMetrics?.ttl}
                    type="bandwidth"
                    unit=""
                    label="TTL"
                    isOnline={device.isOnline}
                  />

                  <MetricCard
                    value={networkMetrics.packetLoss}
                    previousValue={previousMetrics?.packetLoss}
                    type="latency"
                    unit="%"
                    label="Packet Loss"
                    isOnline={device.isOnline}
                  />

                  <MetricCard
                    value={parseFloat(networkMetrics?.sent || "0")}
                    previousValue={
                      previousMetrics?.sent
                        ? parseFloat(previousMetrics.sent)
                        : undefined
                    }
                    type="data_sent"
                    unit="GB"
                    label="Data Sent"
                    isOnline={device.isOnline}
                  />
                </div>
              )}

              {/* Additional Network Metrics */}
              {networkMetrics && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
                  <MetricCard
                    value={networkMetrics?.hops || device?.hops || 0}
                    previousValue={previousMetrics?.hops}
                    type="latency"
                    unit=""
                    label="Hops"
                    isOnline={device.isOnline}
                  />

                  <MetricCard
                    value={networkMetrics.bandwidth}
                    previousValue={previousMetrics?.bandwidth}
                    type="bandwidth"
                    unit="Mbps"
                    label="Bandwidth"
                    isOnline={device.isOnline}
                  />

                  <MetricCard
                    value={networkMetrics?.latency || device?.responseTime || 0}
                    previousValue={previousMetrics?.latency}
                    type="latency"
                    unit="ms"
                    label="Latency"
                    isOnline={device.isOnline}
                  />

                  <MetricCard
                    value={parseFloat(networkMetrics?.received || "0")}
                    previousValue={
                      previousMetrics?.received
                        ? parseFloat(previousMetrics.received)
                        : undefined
                    }
                    type="data_received"
                    unit="GB"
                    label="Data Received"
                    isOnline={device.isOnline}
                  />
                </div>
              )}
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button
                  onClick={handleCheckDevice}
                  disabled={checking}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200 disabled:opacity-50"
                >
                  <div className="flex items-center">
                    <ArrowPathIcon
                      className={`w-4 h-4 mr-3 ${
                        checking ? "animate-spin" : ""
                      }`}
                    />
                    <span className="font-medium">
                      {checking ? "Refreshing..." : "Refresh Status"}
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    Real-time
                  </div>
                </button>

                <button
                  onClick={() => setShowTroubleshooting(true)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm bg-gradient-to-r from-orange-50 to-yellow-50 text-orange-700 border border-orange-200 rounded-xl hover:from-orange-100 hover:to-yellow-100 hover:border-orange-300 transition-all duration-200"
                >
                  <div className="flex items-center">
                    <WrenchScrewdriverIcon className="w-4 h-4 mr-3" />
                    <span className="font-medium">Troubleshoot</span>
                  </div>
                  {detectedIssues.length > 0 && (
                    <div className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                      {detectedIssues.length}
                    </div>
                  )}
                </button>

                <button
                  onClick={() => router.push("/help")}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200 rounded-xl hover:from-gray-100 hover:to-slate-100 hover:border-gray-300 transition-all duration-200"
                >
                  <div className="flex items-center">
                    <DocumentTextIcon className="w-4 h-4 mr-3" />
                    <span className="font-medium">Help Guide</span>
                  </div>
                  <div className="text-xs text-gray-500">→</div>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Device Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Device Status
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Real-time connectivity monitoring
                  </p>
                </div>
                <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  <DateFormatter date={new Date().toISOString()} />
                </div>
              </div>

              <div className="space-y-4">
                <StatusBadge
                  status={deviceStatus.power}
                  label="Power DC"
                  icon={PowerIcon}
                  value={device.isOnline ? "12V" : "0V"}
                  unit=""
                />
                <StatusBadge
                  status={deviceStatus.lanIp}
                  label="LAN / IP"
                  icon={GlobeAltIcon}
                  value={device.isPingable ? device.ipAddr : "Unreachable"}
                  unit=""
                />
                <StatusBadge
                  status={deviceStatus.wifi}
                  label="WiFi Signal"
                  icon={WifiIcon}
                  value={device.signalLevel?.toString()}
                  unit="dBm"
                />
                <StatusBadge
                  status={deviceStatus.loginSurname}
                  label="Authentication"
                  icon={DevicePhoneMobileIcon}
                  value={device.isOnline ? "Connected" : "Disconnected"}
                  unit=""
                />
                <StatusBadge
                  status={deviceStatus.other}
                  label="System Health"
                  icon={WrenchScrewdriverIcon}
                  value={device.error ? "Error" : "Normal"}
                  unit=""
                />
              </div>
            </div>

            {/* Issue Detection Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Issue Detection
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Automated system diagnostics
                  </p>
                </div>
              </div>

              {detectedIssues.length > 0 ? (
                <div className="space-y-3">
                  {detectedIssues.slice(0, 2).map((issue) => (
                    <div
                      key={issue.id}
                      className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="p-1.5 bg-red-100 rounded-lg">
                          <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-900">
                            {issue.issue}
                          </p>
                          <p className="text-xs text-red-700">
                            {issue.priority} Priority
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {issue.actionType === "System" && (
                          <button
                            onClick={() => handleRepairAction(issue)}
                            disabled={checking}
                            className="flex-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {checking ? "Fixing..." : "Auto Fix"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {detectedIssues.length > 2 && (
                    <p className="text-xs text-gray-600 text-center">
                      +{detectedIssues.length - 2} more issue
                      {detectedIssues.length - 2 !== 1 ? "s" : ""}
                    </p>
                  )}

                  <button
                    onClick={() => setShowTroubleshooting(true)}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    View All Issues ({detectedIssues.length})
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-900">
                        All Systems Normal
                      </p>
                      <p className="text-xs text-green-700">
                        No issues detected
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
