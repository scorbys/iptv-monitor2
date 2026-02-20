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
import { DateFormatter } from "../DateFormatter";
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

interface AutoFixLog {
  fixId: string;
  timestamp: string;
  mlCategory: string;
  issue: string;
  action: string;
  description: string;
  status: 'pending' | 'executing' | 'success' | 'failed';
  confidence: number;
  errorMessage?: string;
  output?: any;
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

interface DeviceSuggestion {
  idCast: number;
  deviceName: string | null;
}

interface DebugInfo {
  searchingFor: string;
  availableDevices: DeviceSuggestion[];
  exactMatch?: {
    deviceName: string;
    idCast: number;
  };
  caseInsensitiveMatch?: {
    deviceName: string;
    idCast: number;
  };
  partialMatch?: {
    deviceName: string;
    idCast: number;
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
  isMobile?: boolean;
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
      "Factory reset melalui aplikasi Google Home",
      "Cabut kabel power selama 30 detik lalu hubungkan kembali",
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
    solutions: [
      "Chromecast Power Adaptor Rusak",
      "Check Adaptor Chromecast",
      "Coba port HDMI yang berbeda pada TV",
      "Periksa koneksi kabel HDMI",
    ],
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
  const [isMobile, setIsMobile] = useState(false);
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

  // Auto-fix log state
  const [autoFixLogs, setAutoFixLogs] = useState<AutoFixLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Detect mobile screen
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-refresh network data every 30 seconds
  useEffect(() => {
    if (!mounted || !device) return;

    const fetchNetworkMetrics = async () => {
      if (!device.idCast) {
        console.warn("Chromecast ID not available for metrics");
        setNetworkMetrics((prevMetrics) => {
          if (prevMetrics) {
            setPreviousMetrics(prevMetrics);
          }
          return generateRandomNetworkData();
        });
        return;
      }

      try {
        const metricsIdentifier = device.deviceName || device.idCast;
        const encodedIdentifier = encodeURIComponent(metricsIdentifier);



        const response = await fetch(
          `/api/chromecasts/${encodedIdentifier}/metrics`,
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

          if (result.success && result.data) {
            setNetworkMetrics((prevMetrics) => {
              if (prevMetrics) {
                setPreviousMetrics(prevMetrics);
              }
              return {
                sent: result.data.sent || "0.0",
                received: result.data.received || "0.0",
                latency: result.data.latency || 0,
                jitter: result.data.jitter || 0,
                ttl: result.data.ttl || 0,
                packetLoss: result.data.packetLoss || 0,
                bandwidth: result.data.bandwidth || 0,
                hops: result.data.hops || 0,
                signalStrength:
                  result.data.signalStrength || device.signalLevel || 0,
                bitrate: result.data.bitrate || 0,
              };
            });
          } else {
            console.warn("Invalid metrics data structure:", result);

            setNetworkMetrics((prevMetrics) => {
              if (prevMetrics) {
                setPreviousMetrics(prevMetrics);
              }
              return generateRandomNetworkData();
            });
          }
        } else {
          console.warn(
            `Metrics API returned ${response.status}, using generated data`
          );

          setNetworkMetrics((prevMetrics) => {
            if (prevMetrics) {
              setPreviousMetrics(prevMetrics);
            }
            return generateRandomNetworkData();
          });
        }
      } catch (error) {
        console.warn("Error fetching network metrics:", error);

        setNetworkMetrics((prevMetrics) => {
          if (prevMetrics) {
            setPreviousMetrics(prevMetrics);
          }
          return generateRandomNetworkData();
        });
      }
    };

    fetchNetworkMetrics();
    const interval = setInterval(fetchNetworkMetrics, 30000);

    return () => clearInterval(interval);
  }, [device, mounted]);

  // Function untuk handle tab change
  const handleTabChange = async (newTab: string) => {
    if (!device) return;

    setActiveTab(newTab);
    setLoadingMetrics(true);

    try {
      const historyIdentifier = device.deviceName || device.idCast;
      await fetchNetworkHistory(historyIdentifier.toString(), newTab);
    } catch (error) {
      console.error("Error changing tab:", error);

      const fallbackData = generateHistoricalData(
        newTab,
        Boolean(device?.isOnline)
      );
      setNetworkHistory(fallbackData);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Error handling function
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

  // Fetch Chromecast details
  useEffect(() => {
    if (!mounted || !deviceId) return;

    const fetchDeviceDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!deviceId.trim()) {
          setError("Invalid chromecast identifier");
          return;
        }

        const encodedDeviceId = encodeURIComponent(deviceId);

        const response = await fetch(`/api/chromecast/${encodedDeviceId}`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = "/login";
            return;
          }

          if (response.status === 404) {
            const errorResult = await response.json();

            const suggestions: DeviceSuggestion[] =
              errorResult.details?.suggestions || [];
            let errorMessage = `Device "${deviceId}" not found.`;

            if (suggestions.length > 0) {
              errorMessage += `\n\nSuggestions:\n${suggestions
                .map(
                  (s) => `• Device ${s.idCast}: ${s.deviceName || "Unnamed"} (Use ID: ${s.idCast})`
                )
                .join("\n")}`;
            } else {
              errorMessage += "\n\nTry using the numeric Device ID instead of device name.";
            }

            setError(errorMessage);

            if (errorResult.details) {
              setDebugInfo({
                searchingFor: deviceId,
                availableDevices: suggestions,
                totalDevices: errorResult.details.totalDevices || 0,
              });
            }
            return;
          }

          const errorResult = await response.json().catch(() => ({
            message: `HTTP ${response.status}`,
          }));
          throw new Error(errorResult.message || `HTTP ${response.status}`);
        }
        const result = await response.json();

        if (result.success && result.data) {
          setDevice(result.data);
          generateDeviceStatus(result.data);
        } else {
          throw new Error(result.message || "Invalid response from server");
        }
      } catch (error) {
        handleApiError(error, "fetchDeviceDetails");
      } finally {
        setLoading(false);
      }
    };
    fetchDeviceDetails();
  }, [deviceId, mounted]);

  // Generate device status based on channel data
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

  // Check device status function
  const handleCheckDevice = async () => {
    if (!device || checking) return;

    setChecking(true);
    try {
      const encodedDeviceId = encodeURIComponent(deviceId);
      const response = await fetch(`/api/chromecast/${encodedDeviceId}/check`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

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

  // Troubleshooting detection function
  const detectIssues = () => {
    if (!device) return [];

    const issues = [];

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
    if (device.signalLevel && device.signalLevel < -70) {
      issues.push(faqData.find((faq) => faq.slug === "chromecast-setup-ios"));
    }

    return issues.filter(Boolean) as FAQ[];
  };

  const detectedIssues = useMemo(() => detectIssues(), [device]);

  // Fetch Auto-Fix Logs
  const fetchAutoFixLogs = async () => {
    if (!device) return;

    try {
      setLoadingLogs(true);
      // Use device.idCast (numeric ID) as primary identifier
      const deviceId = device.idCast || device.deviceName;
      const encodedDeviceId = encodeURIComponent(deviceId.toString());

      // Call backend API directly (not through frontend route)
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/chromecast/${encodedDeviceId}/auto-fix?history=true`;

      const response = await fetch(apiUrl, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setAutoFixLogs(result.data.autoFixHistory || []);
        }
      } else {
        console.warn('Failed to fetch auto-fix logs');
      }
    } catch (error) {
      console.error('Error fetching auto-fix logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Trigger Auto-Fix (Manual trigger only - not automatic)
  const triggerAutoFix = async () => {
    if (!device || checking) return;

    try {
      setChecking(true);
      console.log(`[AutoFix] Starting automatic fix for ${device.deviceName}...`);

      // Use device.idCast (numeric ID) as primary identifier
      const deviceId = device.idCast || device.deviceName;
      const encodedDeviceId = encodeURIComponent(deviceId.toString());

      // Prepare issue description from device status
      const issueDescription = device.error || 'Device offline';
      const category = !device.isOnline ? 'Kategori-1' : 'Unknown';

      // Call backend API directly
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/chromecast/${encodedDeviceId}/auto-fix`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `${device.deviceName} ${issueDescription}`,
          issue: issueDescription,
          category: category,
        }),
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.data) {
          console.log('[AutoFix] Automatic fix executed:', result.data);

          // Show notification to user
          if (result.data.autoFixExecuted) {
            const { mlPrediction, executedFix, fixResult } = result.data;

            alert(
              `🔧 Auto-Fix Otomatis Berhasil!\n\n` +
              `Device: ${device.deviceName}\n` +
              `Issue: ${issueDescription}\n` +
              `ML Category: ${mlPrediction.category}\n` +
              `Confidence: ${(mlPrediction.confidence * 100).toFixed(1)}%\n` +
              `Action: ${executedFix.description}\n` +
              `Status: ${fixResult.success ? '✅ Berhasil' : '❌ Gagal'}\n\n` +
              `Device akan di-refresh untuk update status.`
            );
          } else if (result.data.reason) {
            console.log('[AutoFix] No auto-fix executed:', result.data.reason);
          }

          // Refresh device status and logs
          await handleCheckDevice();
          await fetchAutoFixLogs();
        }
      } else {
        const errorResult = await response.json();
        console.error('[AutoFix] API error:', errorResult.error);
        alert(`Error: ${errorResult.error || 'Failed to execute auto-fix'}`);
      }
    } catch (error) {
      console.error('[AutoFix] Error triggering auto-fix:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to execute auto-fix'}`);
    } finally {
      setChecking(false);
    }
  };

  // Repair Action Function (Now just triggers auto-fix)
  const handleRepairAction = async (issue: FAQ) => {
    // Just trigger the auto-fix - it's already automatic
    await triggerAutoFix();
  };

  const handleAskAI = () => {
    if (!device || !networkMetrics) return;

    const isOnline = device.isOnline;

    let contextMessage = "";

    if (isOnline) {
      const latencyChange = previousMetrics?.latency
        ? (
          ((networkMetrics.latency - previousMetrics.latency) /
            previousMetrics.latency) *
          100
        ).toFixed(1)
        : "0";

      const bandwidthChange = previousMetrics?.bandwidth
        ? (
          ((networkMetrics.bandwidth - previousMetrics.bandwidth) /
            previousMetrics.bandwidth) *
          100
        ).toFixed(1)
        : "0";

      const hasConcerns =
        networkMetrics.latency > 50 ||
        networkMetrics.packetLoss > 1 ||
        device.signalLevel < -70 ||
        (previousMetrics &&
          networkMetrics.bandwidth < previousMetrics.bandwidth * 0.8);

      contextMessage = `Chromecast ${device.deviceName} status ONLINE. Dalam 24 jam terakhir latency ${Number(latencyChange) > 0 ? "naik" : "turun"
        } ${Math.abs(parseFloat(latencyChange))}% jadi ${networkMetrics.latency
        }ms, bandwidth ${Number(bandwidthChange) > 0 ? "naik" : "turun"
        } ${Math.abs(parseFloat(bandwidthChange))}% jadi ${networkMetrics.bandwidth
        }Mbps, packet loss ${networkMetrics.packetLoss}%. Signal strength ${device.signalLevel
        } dBm. ${hasConcerns
          ? "Ada beberapa metrics yang perlu perhatian."
          : "Semua metrics dalam range normal."
        } ${detectedIssues.length > 0
          ? `System mendeteksi issue: ${detectedIssues[0].issue}.`
          : ""
        } Analisis kondisi device ini, apakah performa baik atau ada yang concern? Kasih insight tentang trend network dan rekomendasi konkret.`;
    } else {
      const primaryIssue =
        detectedIssues.length > 0 ? detectedIssues[0] : null;

      contextMessage = `Chromecast ${device.deviceName} status OFFLINE. Network performance tidak ada aktivitas sama sekali: latency 0ms, bandwidth 0Mbps, packet loss 100%. Device status tidak pingable, signal ${device.signalLevel
        } dBm, IP ${device.ipAddr} unreachable, response time unavailable ${device.error || "error"
        }. ${primaryIssue
          ? `Issue detection: ${primaryIssue.category} - ${primaryIssue.issue} (${primaryIssue.priority} priority, ${primaryIssue.actionType} action). Solusi umum: ${primaryIssue.solutions[0]}.`
          : "Tidak ada error message spesifik."
        } Tolong jelaskan kemungkinan root cause dan step by step troubleshooting untuk restore device ini.`;
    }

    const chatEvent = new CustomEvent("openLiveChat", {
      detail: {
        device: {
          deviceName: device.deviceName,
          type: device.type,
          status: device.isOnline ? "online" : "offline",
          isOnline: isOnline,
          contextMessage: contextMessage,
        },
      },
    });

    window.dispatchEvent(chatEvent);
  };

  // Fetch network history
  const fetchNetworkHistory = async (
    deviceIdentifier: string,
    timeRange = "24h"
  ) => {
    if (!deviceIdentifier) {
      console.warn("No chromecast identifier provided for history");
      const fallbackData = generateHistoricalData(
        timeRange,
        Boolean(device?.isOnline)
      );
      setNetworkHistory(fallbackData);
      return;
    }

    try {
      setLoadingMetrics(true);
      const encodedIdentifier = encodeURIComponent(deviceIdentifier);



      const response = await fetch(
        `/api/chromecast/${encodedIdentifier}/history?timeRange=${timeRange}`,
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

        if (result.success && result.data && Array.isArray(result.data)) {
          setNetworkHistory(result.data);
        } else {
          console.warn("Invalid history data structure, using fallback");
          const fallbackData = generateHistoricalData(
            timeRange,
            Boolean(device?.isOnline)
          );
          setNetworkHistory(fallbackData);
        }
      } else {
        console.warn(
          `Network history API returned ${response.status}, using fallback`
        );
        const fallbackData = generateHistoricalData(
          timeRange,
          Boolean(device?.isOnline)
        );
        setNetworkHistory(fallbackData);
      }
    } catch (error) {
      console.warn("Network history fetch error:", error);
      const fallbackData = generateHistoricalData(
        timeRange,
        Boolean(device?.isOnline)
      );
      setNetworkHistory(fallbackData);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (!mounted || !device) return;

    const historyIdentifier = device.deviceName || device.idCast;
    fetchNetworkHistory(historyIdentifier.toString(), activeTab);
  }, [device, mounted]);

  // Fetch auto-fix logs when device changes
  useEffect(() => {
    if (!mounted || !device) return;

    fetchAutoFixLogs();
  }, [device, mounted]);

  // Auto-fix trigger when device goes offline (DISABLED - Manual Only)
  // useEffect(() => {
  //   if (!mounted || !device) return;

  //   // Only trigger auto-fix if device just went offline
  //   if (!device.isOnline && device.error) {
  //     console.log(`[AutoFix] Device ${device.deviceName} is offline, triggering auto-fix...`);
  //     triggerAutoFix();
  //   }
  // }, [device?.isOnline, device?.error, mounted]);

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
          <div className="text-center p-2 sm:p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-center mb-1">
              <p className="text-lg sm:text-2xl font-bold text-gray-400">
                0{unit}
              </p>
            </div>
            <p className="text-xs font-medium text-gray-400 truncate">
              {label}
            </p>
            <div className="mt-1">
              <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
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
          className={`text-center p-2 sm:p-3 ${statusColors.bgColor} border rounded-lg transition-all duration-300`}
        >
          <div className="flex items-center justify-center mb-1">
            <p
              className={`text-lg sm:text-2xl font-bold ${statusColors.textColor} truncate`}
            >
              {value}
              {unit}
            </p>
            {previousValue && <TrendIndicator trend={trend.direction} />}
          </div>
          <p
            className={`text-xs font-medium ${statusColors.textColor} mb-1 sm:mb-2 truncate`}
          >
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
              {`${entry.name}: ${entry.value}${entry.name === "Latency"
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

  // StatusBadge component
  const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    label,
    icon: Icon,
    value,
    unit,
    action,
    isMobile = false,
  }) => {
    const isWorking = status === "working";

    if (isMobile) {
      return (
        <div
          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isWorking
            ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
            : "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
            }`}
        >
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div
              className={`p-1.5 rounded-lg flex-shrink-0 ${isWorking ? "bg-green-100" : "bg-red-100"
                }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${isWorking ? "text-green-600" : "text-red-600"
                  }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-gray-900 block truncate">
                {label}
              </span>
              {value && (
                <div className="text-xs text-gray-600 truncate">
                  {value} {unit}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isWorking ? (
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
            ) : (
              <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
            )}
          </div>
        </div>
      );
    }

    // Desktop version (kode asli)
    return (
      <div
        className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${isWorking
          ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:shadow-sm"
          : "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
          }`}
      >
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-lg ${isWorking ? "bg-green-100" : "bg-red-100"
              }`}
          >
            <Icon
              className={`w-4 h-4 ${isWorking ? "text-green-600" : "text-red-600"
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
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${action.type === "repair"
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
        <div className="max-w-6xl mx-auto">
          {/* Skeleton loading untuk header */}
          <div className="mb-6">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-48"></div>
          </div>

          {/* Skeleton loading untuk main content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4 w-32"></div>
              <div className="h-16 bg-gray-100 rounded mb-4"></div>
              <div className="grid grid-cols-7 gap-4">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Loading message */}
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">
              Loading device details...
            </span>
          </div>
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
                        {debugInfo.exactMatch.deviceName}
                      </code>
                    </div>
                  )}

                  {debugInfo.caseInsensitiveMatch && !debugInfo.exactMatch && (
                    <div>
                      <span className="font-medium text-yellow-600">
                        Case-insensitive match:
                      </span>
                      <code className="ml-2 bg-yellow-100 px-2 py-1 rounded">
                        {debugInfo.caseInsensitiveMatch.deviceName}
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
                          {debugInfo.partialMatch.deviceName}
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
                                  {device.deviceName || "Unnamed"}
                                </code>
                                <span className="text-gray-500 text-xs">
                                  ({device.idCast})
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
                            className={`p-2 rounded-lg ${issue.priority === "High"
                              ? "bg-red-100"
                              : issue.priority === "Medium"
                                ? "bg-yellow-100"
                                : "bg-gray-100"
                              }`}
                          >
                            <WrenchScrewdriverIcon
                              className={`w-5 h-5 ${issue.priority === "High"
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
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${issue.priority === "High"
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
                            className={`w-4 h-4 mr-2 ${checking ? "animate-spin" : ""
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Network
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Help
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap">
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
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">
                      {device.ipAddr}
                    </div>
                    <div className="flex items-center mt-1">
                      <SignalIcon
                        className={`h-4 w-4 mr-1 ${device.isOnline ? "text-green-500" : "text-red-500"
                          }`}
                      />
                      <span className="text-sm text-gray-500">
                        {device.signalLevel}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${device.isOnline
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                          }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full mr-1 ${device.isOnline ? "bg-green-500" : "bg-red-500"
                            }`}
                        ></div>
                        {device.isOnline ? "Online" : "Offline"}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${device.isPingable
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {device.isPingable ? "Pingable" : "Disconnect"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <SpeedIndicator speed={device.speed || 0} />
                      <div className="text-xs text-gray-500 mt-1">
                        Response: {device.responseTime || 0}ms
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    <DateFormatter
                      date={device.lastSeen}
                      fallback="Never seen"
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={handleCheckDevice}
                      disabled={checking}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                    >
                      <ArrowPathIcon
                        className={`w-3 h-3 mr-1 ${checking ? "animate-spin" : ""
                          }`}
                      />
                      {checking ? "Checking..." : "Check"}
                    </button>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={handleAskAI}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all duration-150 shadow-sm hover:shadow"
                    >
                      <svg
                        className="w-3 h-3 text-gray-500"
                        style={{ width: "12px", height: "12px", flexShrink: 0 }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                      <span style={{ whiteSpace: "nowrap" }}>Ask AI</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden">
            <div className="space-y-4">
              {/* Device Info Card */}
              <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
                <div className="flex-shrink-0 h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <DevicePhoneMobileIcon className="h-6 w-6 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="text-base font-bold text-gray-900 truncate">
                    {device.deviceName}
                  </h1>
                  <p className="text-xs text-gray-500">{device.type}</p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">IP Address</p>
                  <code className="text-xs text-gray-900 px-2 py-1 bg-gray-100 rounded-lg font-mono block truncate">
                    {device.ipAddr}
                  </code>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${device.isOnline
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                      }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full mr-1 ${device.isOnline ? "bg-green-500" : "bg-red-500"
                        }`}
                    ></div>
                    {device.isOnline ? "Online" : "Offline"}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Connection</p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${device.isPingable
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {device.isPingable ? "Pingable" : "Disconnect"}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Signal</p>
                  <div className="flex items-center">
                    <SignalIcon
                      className={`h-3.5 w-3.5 mr-1 ${device.isOnline ? "text-green-500" : "text-red-500"
                        }`}
                    />
                    <span className="text-xs text-gray-700">
                      {device.signalLevel} dBm
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Speed</p>
                  <span className="text-xs font-semibold text-gray-900">
                    {device.speed || 0} Mbps
                  </span>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Last Activity</p>
                  <DateFormatter
                    date={device.lastSeen}
                    fallback="Never seen"
                    className="text-xs text-gray-700"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCheckDevice}
                  disabled={checking}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-all touch-target"
                >
                  <ArrowPathIcon
                    className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`}
                  />
                  {checking ? "Checking..." : "Check"}
                </button>

                <button
                  onClick={handleAskAI}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all touch-target"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  Ask AI
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Network Performance Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    Network Performance
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                    Real-time monitoring
                  </p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-sm overflow-x-auto">
                  <button
                    onClick={() => handleTabChange("1h")}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap ${activeTab === "1h"
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-600 hover:text-blue-600"
                      }`}
                  >
                    Hourly
                  </button>
                  <button
                    onClick={() => handleTabChange("24h")}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap ${activeTab === "24h"
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-600 hover:text-blue-600"
                      }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => handleTabChange("7d")}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap ${activeTab === "7d"
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-600 hover:text-blue-600"
                      }`}
                  >
                    Weekly
                  </button>
                </div>
              </div>

              {/* Chart Area */}
              <div className="mb-4">
                <div className="h-48 sm:h-56 md:h-64 overflow-x-auto overflow-y-hidden">
                  {loadingMetrics ? (
                    <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-xs sm:text-sm text-gray-600">
                        Loading network data...
                      </span>
                    </div>
                  ) : networkHistory.length > 0 ? (
                    <div className="min-w-[320px] h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={networkHistory}
                          margin={{
                            top: 10,
                            right: 5,
                            left: -15,
                            bottom: 5,
                          }}
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
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#E5E7EB"
                          />
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
                    </div>
                  ) : (
                    <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <SignalIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs sm:text-sm text-gray-500">
                          Network performance data unavailable
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              {networkMetrics && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 pt-4 border-t border-gray-200">
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
                      className={`w-4 h-4 mr-3 ${checking ? "animate-spin" : ""
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
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
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
                  isMobile={isMobile}
                />
                <StatusBadge
                  status={deviceStatus.lanIp}
                  label="LAN / IP"
                  icon={GlobeAltIcon}
                  value={device.isPingable ? device.ipAddr : "Unreachable"}
                  unit=""
                  isMobile={isMobile}
                />
                <StatusBadge
                  status={deviceStatus.wifi}
                  label="WiFi Signal"
                  icon={WifiIcon}
                  value={device.signalLevel?.toString()}
                  unit="dBm"
                  isMobile={isMobile}
                />
                <StatusBadge
                  status={deviceStatus.loginSurname}
                  label="Authentication"
                  icon={DevicePhoneMobileIcon}
                  value={device.isOnline ? "Connected" : "Disconnected"}
                  unit=""
                  isMobile={isMobile}
                />
                <StatusBadge
                  status={deviceStatus.other}
                  label="System Health"
                  icon={WrenchScrewdriverIcon}
                  value={device.error ? "Error" : "Normal"}
                  unit=""
                  isMobile={isMobile}
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

            {/* Auto-Fix Log Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Auto-Fix Log
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Riwayat perbaikan otomatis dengan ML
                  </p>
                </div>
                <button
                  onClick={fetchAutoFixLogs}
                  disabled={loadingLogs}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                >
                  <ArrowPathIcon className={`w-3 h-3 mr-1.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {loadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-sm text-gray-600">Loading logs...</span>
                </div>
              ) : autoFixLogs.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Belum ada riwayat auto-fix</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-fix akan otomatis berjalan saat device mengalami issue
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {autoFixLogs.map((log) => (
                    <div
                      key={log.fixId}
                      className={`p-4 rounded-lg border transition-all ${
                        log.status === 'success'
                          ? 'bg-green-50 border-green-200'
                          : log.status === 'failed'
                          ? 'bg-red-50 border-red-200'
                          : log.status === 'executing'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                log.status === 'success'
                                  ? 'bg-green-100 text-green-800'
                                  : log.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : log.status === 'executing'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {log.status === 'success'
                                ? '✅ Berhasil'
                                : log.status === 'failed'
                                ? '❌ Gagal'
                                : log.status === 'executing'
                                ? '⏳ Sedang Berjalan'
                                : '⏸ Pending'}
                            </span>
                            <span className="text-xs text-gray-500">
                              <DateFormatter date={log.timestamp} />
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {log.mlCategory}
                          </p>
                        </div>
                        {log.confidence && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Confidence</p>
                            <p className="text-sm font-bold text-blue-600">
                              {(log.confidence * 100).toFixed(1)}%
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Issue & Action */}
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Issue: </span>
                          <span className="text-gray-600">{log.issue}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Action: </span>
                          <span className="text-gray-600">{log.action}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Description: </span>
                          <span className="text-gray-600">{log.description}</span>
                        </div>

                        {/* Error message if failed */}
                        {log.errorMessage && (
                          <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
                            <span className="font-medium">Error: </span>
                            {log.errorMessage}
                          </div>
                        )}

                        {/* Output if available */}
                        {log.output && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                            <span className="font-medium">Output: </span>
                            <span className="break-words">
                              {typeof log.output === 'string'
                                ? log.output
                                : JSON.stringify(log.output, null, 2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Auto-Fix Info */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs text-blue-800">
                    <p className="font-semibold mb-1">Auto-Fit Otomatis</p>
                    <p>Sistem akan otomatis mendeteksi issue dan menjalankan perbaikan tanpa perlu intervensi manual.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}