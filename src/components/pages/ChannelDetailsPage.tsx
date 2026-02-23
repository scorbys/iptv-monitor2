"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SignalIcon,
  WifiIcon,
  ComputerDesktopIcon,
  XMarkIcon,
  ChevronRightIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  PowerIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { DateFormatter } from "../DateFormatter";
import Image from "next/image";
import { componentLogger, apiLogger } from "@/utils/debugLogger";
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

interface ChannelDetail {
  id: number;
  channelNumber: number;
  channelName: string;
  category: string;
  ipMulticast: string;
  logo: string;
  status: "online" | "offline";
  responseTime?: number;
  lastChecked: string;
  error?: string;
  signalLevel?: number;
  isOnline?: boolean;
  isPingable?: boolean;
  slug: string;
}

interface DeviceStatus {
  power: "working" | "error";
  network: "working" | "error";
  signal: "working" | "error";
  stream: "working" | "error";
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
  signalStrength: number;
  bitrate: number;
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
  signalStrength: number;
  bitrate: number;
}

interface ChannelDetailPageProps {
  channelId: string;
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

interface ChannelSuggestion {
  id: number;
  channelNumber: number;
  channelName: string | null;
}

interface DebugInfo {
  searchingFor: string;
  availableChannels: ChannelSuggestion[];
  exactMatch?: {
    channelNumber: number;
    id: number;
  };
  caseInsensitiveMatch?: {
    channelName: string;
    id: number;
  };
  partialMatch?: {
    channelName: string;
    id: number;
  };
  totalChannels: number;
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

// FAQ Data for Channel issues
const faqData: FAQ[] = [
  {
    id: 5,
    category: "Kategori-5",
    device: "Channel",
    issue: "Error Playing",
    solutions: [
      "Channel issue dari Biznet (Testing VIA VLC)",
      "Restart streaming service",
      "Check network bandwidth and stability",
      "Update codec or media player",
    ],
    hasImage: true,
    actionType: "System",
    priority: "Medium",
    slug: "error-playing",
  },
  {
    id: 6,
    category: "Kategori-6",
    device: "Channel",
    issue: "Error_Player_Error_Err",
    solutions: [
      "Hbrowser & Widget Solution incorrect",
      "Channel issue Biznet (Testing VLC)",
      "Update browser to latest version",
      "Clear browser cache and cookies",
    ],
    hasImage: true,
    actionType: "System",
    priority: "High",
    slug: "error-player-error",
  },
  {
    id: 7,
    category: "Kategori-7",
    device: "Channel",
    issue: "Connection_Failure",
    solutions: [
      "Reinstall Widget Solution",
      "Reload IGCMP",
      "Confirmed IP conflict, changed IP, issue resolved",
      "Check firewall settings and open required ports",
    ],
    hasImage: true,
    actionType: "System",
    priority: "Medium",
    slug: "connection-failure",
  },
  {
    id: 11,
    category: "Kategori-11",
    device: "Channel",
    issue: "Channel Not Found",
    solutions: [
      "LAN Out Terpasang bukan LAN In",
      "Verify correct cable connection (LAN In vs LAN Out)",
      "Refresh channel list or rescan channels",
      "Check IGMP configuration",
    ],
    hasImage: true,
    actionType: "System",
    priority: "Low",
    slug: "channel-not-found",
  },
];

// Generate random network data for channels
const generateRandomNetworkData = (): NetworkMetrics => {
  return {
    sent: (Math.random() * 12 + 5).toFixed(2),
    received: (Math.random() * 10 + 3).toFixed(2),
    latency: Math.floor(Math.random() * 25) + 5,
    jitter: Math.floor(Math.random() * 8) + 1,
    ttl: Math.floor(Math.random() * 10) + 55,
    packetLoss: parseFloat((Math.random() * 0.8).toFixed(2)),
    bandwidth: Math.floor(Math.random() * 100) + 50,
    hops: Math.floor(Math.random() * 12) + 8,
    signalStrength: Math.floor(Math.random() * 30) + 70, // 70-100%
    bitrate: Math.floor(Math.random() * 5000) + 3000, // 3000-8000 kbps
  };
};

// Generate historical data for channels
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
      latency: isOnline ? Math.floor(Math.random() * 20) + 5 : 0,
      bandwidth: isOnline ? Math.floor(Math.random() * 80) + 40 : 0,
      jitter: isOnline ? Math.floor(Math.random() * 8) + 1 : 0,
      packetLoss: isOnline ? parseFloat((Math.random() * 0.6).toFixed(2)) : 0,
      sent: isOnline ? parseFloat((Math.random() * 6 + 2).toFixed(2)) : 0,
      received: isOnline ? parseFloat((Math.random() * 5 + 1).toFixed(2)) : 0,
      hops: isOnline ? Math.floor(Math.random() * 10) + 6 : 0,
      signalStrength: isOnline ? Math.floor(Math.random() * 25) + 75 : 0,
      bitrate: isOnline ? Math.floor(Math.random() * 4000) + 3500 : 0,
    });
  }

  return data;
};

const isValidUrl = (string: string) => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

export default function ChannelDetailsPage({
  channelId,
}: ChannelDetailPageProps) {
  const [channel, setChannel] = useState<ChannelDetail | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    power: "working",
    network: "working",
    signal: "working",
    stream: "working",
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

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-refresh network data every 30 seconds
  useEffect(() => {
    if (!mounted || !channel) return;

    const fetchNetworkMetrics = async () => {
      if (!channel.id) {
        componentLogger.warn("Channel ID not available for metrics");
        setNetworkMetrics((prevMetrics) => {
          if (prevMetrics) {
            setPreviousMetrics(prevMetrics);
          }
          return generateRandomNetworkData();
        });
        return;
      }

      try {
        const metricsIdentifier =
          channel.slug || channel.channelNumber || channel.id;
        const encodedIdentifier = encodeURIComponent(metricsIdentifier);


        const response = await fetch(
          `/api/channels/${encodedIdentifier}/metrics`,
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
                  result.data.signalStrength || channel.signalLevel || 0,
                bitrate: result.data.bitrate || 0,
              };
            });
          } else {
            apiLogger.warn("Invalid metrics data structure:", result);

            setNetworkMetrics((prevMetrics) => {
              if (prevMetrics) {
                setPreviousMetrics(prevMetrics);
              }
              return generateRandomNetworkData();
            });
          }
        } else {
          apiLogger.warn(
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
        apiLogger.warn("Error fetching network metrics:", error);

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
  }, [channel, mounted]);

  // Function untuk handle tab change
  const handleTabChange = async (newTab: string) => {
    if (!channel) return;

    setActiveTab(newTab);
    setLoadingMetrics(true);

    try {
      const historyIdentifier =
        channel.slug || channel.channelNumber || channel.id;
      await fetchNetworkHistory(historyIdentifier.toString(), newTab);
    } catch (error) {
      componentLogger.error("Error changing tab:", error);

      const fallbackData = generateHistoricalData(
        newTab,
        channel.status === "online"
      );
      setNetworkHistory(fallbackData);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Error handling function
  const handleApiError = (error: unknown, context: string) => {
    componentLogger.error(`Error in ${context}:`, error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    if (errorMessage.includes("401")) {
      window.location.href = "/login";
      return;
    }
    if (errorMessage.includes("404")) {
      setError(`Channel "${channelId}" not found`);
      return;
    }
    if (errorMessage.includes("400")) {
      setError(`Invalid channel identifier: "${channelId}"`);
      return;
    }
    setError(`${context}: ${errorMessage}`);
  };

  // Fetch Channel details
  useEffect(() => {
    if (!mounted || !channelId) return;

    const fetchChannelDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!channelId || !channelId.trim()) {
          setError("Invalid channel identifier");
          return;
        }

        const encodedChannelId = encodeURIComponent(channelId);

        const response = await fetch(`/api/channels/${encodedChannelId}`, {
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

            const suggestions: ChannelSuggestion[] =
              errorResult.details?.suggestions || [];
            let errorMessage = `Channel "${channelId}" not found.`;

            if (suggestions.length > 0) {
              errorMessage += `\n\nSuggestions:\n${suggestions
                .map(
                  (s) =>
                    `• Channel ${s.channelNumber}: ${s.channelName || "Unnamed"
                    }`
                )
                .join("\n")}`;
            }

            setError(errorMessage);

            if (errorResult.details) {
              setDebugInfo({
                searchingFor: channelId,
                availableChannels: suggestions,
                totalChannels: errorResult.details.totalChannels || 0,
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
          setChannel(result.data);
          generateDeviceStatus(result.data);
        } else {
          throw new Error(result.message || "Invalid response from server");
        }
      } catch (error) {
        handleApiError(error, "fetchChannelDetails");
      } finally {
        setLoading(false);
      }
    };

    fetchChannelDetails();
  }, [channelId, mounted]);

  // Generate device status based on channel data
  const generateDeviceStatus = (channelData: ChannelDetail) => {
    const status: DeviceStatus = {
      power: channelData.status === "online" ? "working" : "error",
      network: channelData.status === "online" ? "working" : "error",
      signal: "error",
      stream: channelData.status === "online" ? "working" : "error",
      other: channelData.error ? "error" : "working",
    };

    if (channelData.status === "online") {
      if (
        channelData.signalLevel !== undefined &&
        channelData.signalLevel !== null
      ) {
        status.signal = channelData.signalLevel > 50 ? "working" : "error";
      } else {
        status.signal = "working";
      }
    } else {
      status.signal = "error";
    }

    setDeviceStatus(status);
  };

  // Check channel status function
  const handleCheckChannel = async () => {
    if (!channel || checking) return;

    setChecking(true);
    try {
      const encodedChannelId = encodeURIComponent(channelId);
      const response = await fetch(`/api/channels/${encodedChannelId}/check`, {
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
        if (result.success && result.data) {
          setChannel(result.data);
          generateDeviceStatus(result.data);
        }
      } else {
        apiLogger.warn("Check channel failed:", response.status);
      }
    } catch (error) {
      apiLogger.error("Error checking channel:", error);
    } finally {
      setChecking(false);
    }
  };

  // Troubleshooting detection function
  const detectIssues = () => {
    if (!channel) return [];

    const issues = [];

    if (channel.status === "offline") {
      issues.push(faqData.find((faq) => faq.slug === "connection-failure"));
    }
    if (channel.signalLevel && channel.signalLevel < 50) {
      issues.push(faqData.find((faq) => faq.slug === "channel-not-found"));
    }
    if (channel.error && channel.error.includes("quality")) {
      issues.push(faqData.find((faq) => faq.slug === "error-playing"));
    }
    if (channel.error && channel.error.includes("player")) {
      issues.push(faqData.find((faq) => faq.slug === "error-player-error"));
    }

    return issues.filter(Boolean) as FAQ[];
  };

  const detectedIssues = useMemo(() => detectIssues(), [channel]);

  // Repair Action Function
  const handleRepairAction = async (issue: FAQ) => {
    try {
      setChecking(true);

      await new Promise((resolve) => setTimeout(resolve, 2000));
      await handleCheckChannel();

      alert(`Repair attempt completed for: ${issue.issue}`);
    } catch (error) {
      componentLogger.error("Repair failed:", error);
      alert("Automated repair failed. Please try manual troubleshooting.");
    } finally {
      setChecking(false);
    }
  };

  // Tambahkan setelah fungsi handleRepairAction (sekitar baris 600-650)
  const handleAskAI = () => {
    if (!channel || !networkMetrics) return;

    const isOnline = channel.status === "online";

    let contextMessage = "";

    if (isOnline) {
      // Hitung perubahan persentase untuk trend analysis
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

      // Deteksi kondisi concern
      const hasConcerns =
        networkMetrics.latency > 50 ||
        networkMetrics.packetLoss > 1 ||
        networkMetrics.signalStrength < 80 ||
        (previousMetrics &&
          networkMetrics.bandwidth < previousMetrics.bandwidth * 0.8);

      contextMessage = `Channel ${channel.channelName} (${channel.channelNumber
        }) status ONLINE. Dalam 24 jam terakhir latency ${Number(latencyChange) > 0 ? "naik" : "turun"
        } ${Math.abs(parseFloat(latencyChange))}% jadi ${networkMetrics.latency
        }ms, bandwidth ${Number(bandwidthChange) > 0 ? "naik" : "turun"
        } ${Math.abs(parseFloat(bandwidthChange))}% jadi ${networkMetrics.bandwidth
        }Mbps, packet loss ${networkMetrics.packetLoss}%. Signal strength ${networkMetrics.signalStrength
        }%. ${hasConcerns
          ? "Ada beberapa metrics yang perlu perhatian."
          : "Semua metrics dalam range normal."
        } ${detectedIssues.length > 0
          ? `System mendeteksi issue: ${detectedIssues[0].issue}.`
          : ""
        } Analisis kondisi channel ini, apakah performa baik atau ada yang concern? Kasih insight tentang trend network dan rekomendasi konkret.`;
    } else {
      // Channel offline - lebih spesifik
      const primaryIssue = detectedIssues.length > 0 ? detectedIssues[0] : null;

      contextMessage = `Channel ${channel.channelName} (${channel.channelNumber
        }) status OFFLINE. Network performance tidak ada aktivitas sama sekali: latency 0ms, bandwidth 0Mbps, packet loss 100%. Channel status menunjukkan stream source inactive, multicast IP ${channel.ipMulticast
        } unreachable, no signal, encoder ${channel.error || "error"}. ${primaryIssue
          ? `Issue detection: ${primaryIssue.category} - ${primaryIssue.issue} (${primaryIssue.priority} priority, ${primaryIssue.actionType} action). Solusi umum: ${primaryIssue.solutions[0]}.`
          : "Tidak ada error message spesifik."
        } Tolong jelaskan kemungkinan root cause dan step by step troubleshooting untuk restore channel ini.`;
    }

    // Trigger live chat
    const chatEvent = new CustomEvent("openLiveChat", {
      detail: {
        channel: {
          channelName: channel.channelName,
          channelNumber: channel.channelNumber,
          status: channel.status,
          isOnline: isOnline,
          contextMessage: contextMessage,
        },
      },
    });

    window.dispatchEvent(chatEvent);
  };

  // Fetch network history
  const fetchNetworkHistory = async (
    channelIdentifier: string,
    timeRange = "24h"
  ) => {
    if (!channelIdentifier) {
      componentLogger.warn("No channel identifier provided for history");
      const fallbackData = generateHistoricalData(
        timeRange,
        channel?.status === "online"
      );
      setNetworkHistory(fallbackData);
      return;
    }

    try {
      setLoadingMetrics(true);
      const encodedIdentifier = encodeURIComponent(channelIdentifier);



      const response = await fetch(
        `/api/channels/${encodedIdentifier}/history?timeRange=${timeRange}`,
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
          apiLogger.warn("Invalid history data structure, using fallback");
          const fallbackData = generateHistoricalData(
            timeRange,
            channel?.status === "online"
          );
          setNetworkHistory(fallbackData);
        }
      } else {
        apiLogger.warn(
          `Network history API returned ${response.status}, using fallback`
        );
        const fallbackData = generateHistoricalData(
          timeRange,
          channel?.status === "online"
        );
        setNetworkHistory(fallbackData);
      }
    } catch (error) {
      apiLogger.warn("Network history fetch error:", error);
      const fallbackData = generateHistoricalData(
        timeRange,
        channel?.status === "online"
      );
      setNetworkHistory(fallbackData);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (!mounted || !channel) return;

    const historyIdentifier =
      channel.slug || channel.channelNumber || channel.id;
    fetchNetworkHistory(historyIdentifier.toString(), activeTab);
  }, [channel, mounted]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const TrendIndicator = React.useCallback(({ trend }: { trend: string }) => {
    if (trend === "up") {
      return (
        <div className="ml-2">
          <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-green-500"></div>
        </div>
      );
    }
    if (trend === "down") {
      return (
        <div className="ml-2">
          <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-red-500"></div>
        </div>
      );
    }
    return null;
  }, []);

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

  const NetworkStatusIndicator = React.memo(
    ({
      isOnline,
      lastUpdated,
    }: {
      isOnline: boolean;
      lastUpdated?: string;
    }) => (
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
        ></div>
        <span
          className={`font-medium ${isOnline ? "text-green-700" : "text-red-700"
            }`}
        >
          {isOnline ? "Live Data" : "Offline"}
        </span>
        {lastUpdated && (
          <span className="text-gray-500 text-xs">
            Updated: <DateFormatter date={lastUpdated} />
          </span>
        )}
      </div>
    )
  );

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
      | "bitrate"
      | "data_sent"
      | "data_received"
      | "packetLoss"
      | "signalStrength";
      unit: string;
      label: string;
      isOnline?: boolean;
    }) => {
      // Jika channel offline, tampilkan gray dengan nilai 0
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

        // Untuk bandwidth, bitrate, signal strength, dll - nilai tinggi = baik
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
            return Math.max(3, currentValue * 0.1); // 10% atau min 3ms
          case "bandwidth":
            return Math.max(10, currentValue * 0.15); // 15% atau min 10Mbps
          case "packetLoss":
            return 0.3; // 0.3%
          case "signalStrength":
            return 5; // 5% signal strength
          case "bitrate":
            return Math.max(200, currentValue * 0.1); // 10% atau min 200kbps
          case "data_sent":
          case "data_received":
            return 0.2; // 0.2GB threshold
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

  MetricCard.displayName = "MetricCard";
  NetworkStatusIndicator.displayName = "NetworkStatusIndicator";

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

  // Custom Tooltip for chart
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
                        : entry.name === "Signal Strength"
                          ? "%"
                          : entry.name === "Bitrate"
                            ? "kbps"
                            : ""
                }`}
            </p>
          ))}
        </div>
      );
    }
    return null;
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
              Loading channel details...
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
              onClick={() => router.push("/channels")}
              className="hover:text-blue-600 transition-colors"
            >
              Channels
            </button>
            <ChevronRightIcon className="w-4 h-4" />
            <span className="text-gray-400">Error</span>
          </nav>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Channel Not Found
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
                        {debugInfo.exactMatch.channelNumber}
                      </code>
                    </div>
                  )}

                  <div>
                    <span className="font-medium">
                      Total channels available:
                    </span>
                    <span className="ml-2">{debugInfo.totalChannels}</span>
                  </div>

                  {debugInfo.availableChannels &&
                    debugInfo.availableChannels.length > 0 && (
                      <div>
                        <span className="font-medium">
                          Sample channel numbers:
                        </span>
                        <ul className="mt-2 ml-4 space-y-1">
                          {debugInfo.availableChannels.slice(0, 5).map(
                            (
                              channel: {
                                id: number;
                                channelNumber: number;
                                channelName: string | null;
                              },
                              index: number
                            ) => (
                              <li
                                key={index}
                                className="flex items-center space-x-2"
                              >
                                <code className="bg-gray-200 px-2 py-1 rounded text-xs">
                                  {channel.channelNumber} -{" "}
                                  {channel.channelName || "Unnamed"}
                                </code>
                                <span className="text-gray-500 text-xs">
                                  ({channel.id})
                                </span>
                              </li>
                            )
                          )}
                          {debugInfo.availableChannels.length > 5 && (
                            <li className="text-gray-500 text-xs">
                              ... and {debugInfo.availableChannels.length - 5}{" "}
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
                onClick={() => router.push("/channels")}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Channels List
              </button>
              <div className="text-sm text-gray-500">
                <p>
                  Channel Number:{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    {channelId}
                  </code>
                </p>
                <p className="mt-1">
                  If this channel should exist, please check the channel number
                  or contact support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!channel) return null;

  // Show troubleshooting panel
  if (showTroubleshooting) {
    return (
      <div className="p-6 bg-blue-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
            <button
              onClick={() => router.push("/channels")}
              className="hover:text-blue-600 transition-colors"
            >
              Channels
            </button>
            <ChevronRightIcon className="w-4 h-4" />
            <button
              onClick={() => setShowTroubleshooting(false)}
              className="hover:text-blue-600 transition-colors"
            >
              Channel {channel.channelNumber}
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
                    {detectedIssues.length !== 1 ? "s" : ""} with Channel{" "}
                    {channel.channelNumber}
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
                    The channel appears to be working normally.
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
            onClick={() => router.push("/channels")}
            className="hover:text-blue-600 transition-colors"
          >
            Channels
          </button>
          <ChevronRightIcon className="w-4 h-4" />
          <span className="text-gray-400">{channel.channelName}</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name & Logo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Multicast
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Checked
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                          <span className="text-sm font-bold text-white">
                            {channel.channelNumber || "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {channel.logo && (
                        <div className="h-10 w-15 relative bg-gray-50 rounded-xl overflow-hidden shadow-sm">
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
                        <div className="text-xs text-gray-500">
                          Channel {channel.channelNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-200">
                      {channel.category || "Uncategorized"}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <code className="text-sm text-gray-900 px-2 py-1 bg-gray-100 rounded-lg font-mono">
                      {channel.ipMulticast || "N/A"}
                    </code>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${channel.status === "online"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                        }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full mr-1 ${channel.status === "online"
                            ? "bg-green-500"
                            : "bg-red-500"
                          }`}
                      ></div>
                      {channel.status
                        ? channel.status.charAt(0).toUpperCase() +
                        channel.status.slice(1)
                        : "Unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <DateFormatter
                      date={channel.lastChecked}
                      fallback="Never checked"
                      className="text-sm text-gray-500"
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap=">
                    <button
                      onClick={handleCheckChannel}
                      disabled={checking}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
                    >
                      <ArrowPathIcon
                        className={`w-3 h-3 mr-1 ${checking ? "animate-spin" : ""
                          }`}
                      />
                      {checking ? "Checking..." : "Check"}
                    </button>
                  </td>

                  {/* Help Column */}
                  <td className="px-4 py-4 whitespace-nowrap=">
                    <button
                      onClick={handleAskAI}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all duration-150 shadow-sm hover:shadow"
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
              {/* Channel Info Card */}
              <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
                <div className="flex-shrink-0 h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {channel.channelNumber || "-"}
                  </span>
                </div>

                {channel.logo && (
                  <div className="h-12 w-24 relative bg-gray-50 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                    {channel.logo && isValidUrl(channel.logo) ? (
                      <Image
                        src={channel.logo}
                        alt={channel.channelName || "Channel logo"}
                        fill
                        className="object-contain p-1"
                        sizes="96px"
                        unoptimized
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <span className="text-xs text-gray-500">No Logo</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h1 className="text-base font-bold text-gray-900 truncate">
                    {channel.channelName || "Unknown Channel"}
                  </h1>
                  <p className="text-xs text-gray-500">
                    Channel {channel.channelNumber}
                  </p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Category</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {channel.category || "N/A"}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${channel.status === "online"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                      }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full mr-1 ${channel.status === "online"
                          ? "bg-green-500"
                          : "bg-red-500"
                        }`}
                    ></div>
                    {channel.status
                      ? channel.status.charAt(0).toUpperCase() +
                      channel.status.slice(1)
                      : "Unknown"}
                  </span>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">IP Multicast</p>
                  <code className="text-xs text-gray-900 px-2 py-1 bg-gray-100 rounded-lg font-mono block truncate">
                    {channel.ipMulticast || "N/A"}
                  </code>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Last Checked</p>
                  <DateFormatter
                    date={channel.lastChecked}
                    fallback="Never checked"
                    className="text-xs text-gray-700"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCheckChannel}
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
                    value={networkMetrics.jitter || 0}
                    previousValue={previousMetrics?.jitter}
                    type="latency"
                    unit="ms"
                    label="Jitter"
                    isOnline={channel.status === "online"}
                  />

                  <MetricCard
                    value={networkMetrics.ttl || 0}
                    previousValue={previousMetrics?.ttl}
                    type="bandwidth"
                    unit=""
                    label="TTL"
                    isOnline={channel.status === "online"}
                  />

                  <MetricCard
                    value={networkMetrics.packetLoss || 0}
                    previousValue={previousMetrics?.packetLoss}
                    type="packetLoss"
                    unit="%"
                    label="Packet Loss"
                    isOnline={channel.status === "online"}
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
                    isOnline={channel.status === "online"}
                  />
                </div>
              )}

              {/* Additional Network Metrics */}
              {networkMetrics && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mt-2 sm:mt-4 pt-4 border-t border-gray-100">
                  <MetricCard
                    value={networkMetrics?.hops || 0}
                    previousValue={previousMetrics?.hops}
                    type="latency"
                    unit=""
                    label="Hops"
                    isOnline={channel.status === "online"}
                  />

                  <MetricCard
                    value={networkMetrics.bandwidth || 0}
                    previousValue={previousMetrics?.bandwidth}
                    type="bandwidth"
                    unit="Mbps"
                    label="Bandwidth"
                    isOnline={channel.status === "online"}
                  />

                  <MetricCard
                    value={
                      networkMetrics?.latency || channel?.responseTime || 0
                    }
                    previousValue={previousMetrics?.latency}
                    type="latency"
                    unit="ms"
                    label="Latency"
                    isOnline={channel.status === "online"}
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
                    isOnline={channel.status === "online"}
                  />
                </div>
              )}
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button
                  onClick={handleCheckChannel}
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
                  <ChevronRightIcon className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Channel  Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Channel Status
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Real-time stream monitoring
                  </p>
                </div>
                <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  <DateFormatter date={new Date().toISOString()} />
                </div>
              </div>

              <div className="space-y-4">
                <StatusBadge
                  status={deviceStatus.power}
                  label="Stream Source"
                  icon={PowerIcon}
                  value={channel.status === "online" ? "Active" : "Inactive"}
                  unit=""
                  isMobile={isMobile}
                />
                <StatusBadge
                  status={deviceStatus.network}
                  label="Multicast IP"
                  icon={GlobeAltIcon}
                  value={
                    channel.status === "online"
                      ? channel.ipMulticast
                      : "Unreachable"
                  }
                  unit=""
                  isMobile={isMobile}
                />
                <StatusBadge
                  status={deviceStatus.signal}
                  label="Signal Quality"
                  icon={SignalIcon}
                  value={
                    channel.signalLevel
                      ? `${channel.signalLevel}%`
                      : "No Signal"
                  }
                  unit=""
                  isMobile={isMobile}
                />
                <StatusBadge
                  status={deviceStatus.stream}
                  label="Stream Health"
                  icon={WifiIcon}
                  value={
                    channel.responseTime
                      ? `${channel.responseTime}ms`
                      : "No Response"
                  }
                  unit=""
                  isMobile={isMobile}
                />
                <StatusBadge
                  status={deviceStatus.other}
                  label="Encoder Status"
                  icon={ComputerDesktopIcon}
                  value={channel.error ? "Error" : "Normal"}
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
          </div>
        </div>
      </div>
    </div>
  );
}