"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  SignalIcon,
  ClockIcon,
  XMarkIcon,
  WrenchScrewdriverIcon,
  LightBulbIcon,
  CheckBadgeIcon,
  ArrowDownTrayIcon,
  BellIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { componentLogger, storageLogger } from "@/utils/debugLogger";

import {
  Notification,
  fetchAllNotifications,
  cleanOldNotifications,
  saveNotificationsToStorage,
} from "../../app/notifications/notifUtils";
import { calculateMetricScore } from "@/utils/metricCalculator";

const ITEMS_PER_PAGE = 12;

interface NotificationStats {
  totalNotifications: number;
  activeIssues: number;
  recentRecoveries: number;
  avgResponseTime: number;
  topErrorCategory: string;
  last24HourAlerts: number;
  lastUpdated: string;
  categoryBreakdown: Record<string, number>;
}

const faqData = [
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
    id: 2,
    category: "Kategori-2",
    device: "IPTV",
    issue: "Weak Or No Signal",
    solutions: [
      "Periksa koneksi LAN pada TV",
      "Pastikan sumber HDMI diatur ke HDMI-1",
      "Restart perangkat IPTV",
      "Periksa indikator LED pada box IPTV",
    ],
    hasImage: true,
    actionType: "On Site",
    priority: "Medium",
    slug: "weak-or-no-signal",
  },
  {
    id: 3,
    category: "Kategori-3",
    device: "IPTV",
    issue: "Unplug LAN TV",
    solutions: [
      "Periksa koneksi LAN (pastikan terpasang di LAN IN)",
      "Posisikan kabel LAN dengan benar",
      "Pastikan tidak terpasang di LAN OUT",
      "Test koneksi dengan kabel LAN lain",
    ],
    hasImage: true,
    actionType: "On Site",
    priority: "High",
    slug: "unplug-lan-tv",
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
    id: 5,
    category: "Kategori-5",
    device: "Channel",
    issue: "Error Playing",
    solutions: ["Channel issue dari Biznet (Testing VIA VLC)"],
    hasImage: false,
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
    ],
    hasImage: false,
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
    ],
    hasImage: false,
    actionType: "System",
    priority: "Medium",
    slug: "connection-failure",
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
    id: 9,
    category: "Kategori-9",
    device: "IPTV",
    issue: "No Device Logged",
    solutions: [
      "Pastikan Allow local Network pada Setingan Iphone",
      "Check VPN and Cast settings",
    ],
    hasImage: true,
    actionType: "On Site",
    priority: "High",
    slug: "no-device-logged",
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
  {
    id: 11,
    category: "Kategori-11",
    device: "Channel",
    issue: "Channel Not Found",
    solutions: ["LAN Out Terpasang bukan LAN In"],
    hasImage: true,
    actionType: "System",
    priority: "Low",
    slug: "channel-not-found",
  },
  {
    id: 12,
    category: "Kategori-12",
    device: "Chromecast",
    issue: "Network Connection Failed",
    solutions: [
      "Check WiFi connection strength",
      "Restart Chromecast device",
      "Verify router settings",
      "Check for IP conflicts",
    ],
    hasImage: false,
    actionType: "System",
    priority: "High",
    slug: "network-connection-failed",
  },
  {
    id: 13,
    category: "Kategori-13",
    device: "IPTV",
    issue: "System Initialization Error",
    solutions: [
      "Restart IPTV set-top box",
      "Check system firmware version",
      "Reinitialize system settings",
      "Contact technical support if persists",
    ],
    hasImage: false,
    actionType: "On Site",
    priority: "Medium",
    slug: "system-initialization-error",
  },
  {
    id: 14,
    category: "Kategori-14",
    device: "Chromecast",
    issue: "No Device Found Chromecast: Logined",
    solutions: [
      "Verify user authentication status",
      "Check device registration",
      "Re-login to Google account",
      "Clear cast cache and retry",
    ],
    hasImage: false,
    actionType: "System",
    priority: "High",
    slug: "no-device-found-chromecast-logined",
  },
];

export default function NotifPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cacheHydrated, setCacheHydrated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoFixStats, setAutoFixStats] = useState<{
    total: number;
    byStatus: { pending: number; executing?: number; success?: number; failed?: number; cancelled?: number };
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );
  // Authoritative total count fetched directly from MongoDB (avoids cache inflation)
  const [dbTotalCount, setDbTotalCount] = useState<number | null>(null);
  // Cache for FAQ categories to avoid recalculation
  const faqCategoryCache = useRef<Map<string, string>>(new Map());

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

  useEffect(() => {
    let cancelled = false;
    const fetchDbCount = async () => {
      try {
        const token = localStorage.getItem("authToken") || localStorage.getItem("token");
        const resp = await fetch("/api/notifications/stats/count/total", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!resp.ok || cancelled) return;
        const data = await resp.json();
        if (data.success && typeof data.data?.total === 'number') {
          setDbTotalCount(data.data.total);
        }
      } catch (_) { }
    };

    const fetchAutoFixStats = async () => {
      try {
        const token = localStorage.getItem("authToken") || localStorage.getItem("token");
        const resp = await fetch("/api/auto-fix/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!resp.ok || cancelled) return;
        const data = await resp.json();
        if (data.success && data.data) {
          setAutoFixStats(data.data);
        }
      } catch (_) { }
    };

    // Parallelisasi fetch untuk lebih cepat
    Promise.all([fetchDbCount(), fetchAutoFixStats()]).catch(() => { });
    
    // Refresh counts setiap 30 detik agar sinkron
    const interval = setInterval(() => {
      Promise.all([fetchDbCount(), fetchAutoFixStats()]).catch(() => { });
    }, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []); // mount only, independent dari fetchNotifications

  const calculateStats = useCallback(
    (notifications: Notification[]): NotificationStats => {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const activeIssues = notifications.filter(
        (n) => n.currentStatus === "offline"
      ).length;
      const recentRecoveries = notifications.filter(
        (n) => n.isStatusChange && n.currentStatus === "online"
      ).length;

      const recentAlerts = notifications.filter(
        (n) =>
          new Date(n.rawDate) > last24Hours && n.currentStatus === "offline"
      ).length;

      const responseTimes = notifications
        .filter((n) => n.responseTime && n.responseTime > 0)
        .map((n) => n.responseTime!);

      const avgResponseTime =
        responseTimes.length > 0
          ? Math.round(
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          )
          : 0;

      const errorCategories = notifications.reduce((acc, n) => {
        if (n.errorCategory && n.currentStatus === "offline") {
          acc[n.errorCategory] = (acc[n.errorCategory] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const categoryBreakdown = notifications.reduce((acc, n) => {
        const faqCategory = getSpecificFAQCategory(n);

        if (faqCategory) {
          acc[faqCategory] = (acc[faqCategory] || 0) + 1;
        } else {
          acc["Uncategorized"] = (acc["Uncategorized"] || 0) + 1;
        }

        return acc;
      }, {} as Record<string, number>);

      const topErrorCategory =
        Object.entries(errorCategories).sort(([, a], [, b]) => b - a)[0]?.[0] ||
        "None";

      return {
        totalNotifications: notifications.length,
        activeIssues,
        recentRecoveries,
        avgResponseTime,
        topErrorCategory,
        last24HourAlerts: recentAlerts,
        lastUpdated: now.toISOString(),
        categoryBreakdown,
      };
    },
    []
  );

  const fetchNotifications = useCallback(async () => {
    if (!mounted) return;

    try {
      // Fetch fresh notifications list
      const recent = await fetchAllNotifications();
      const cleaned = cleanOldNotifications(recent);
      setNotifications(cleaned);
      setStats(calculateStats(cleaned));
      saveNotificationsToStorage(cleaned);
    } catch (error) {
      componentLogger.error("Failed to fetch notifications:", error);
      setNotifications([]);
      setStats(null);
    }
  }, [mounted, calculateStats]);

  useEffect(() => {
    if (!mounted) return;

    const loadData = async () => {
      // [OPTIMIZATION] Render cache immediately for instant UI display
      const stored = localStorage.getItem("notif-cache");
      if (stored) {
        try {
          const parsed: Notification[] = JSON.parse(stored);
          const cleaned = cleanOldNotifications(parsed);
          setNotifications(cleaned);
          setStats(calculateStats(cleaned));
          setCacheHydrated(true);
          setLoading(false); // Show UI instantly from cache
        } catch (_) { }
      }
      
      // [OPTIMIZATION] Fetch fresh data in background without blocking render
      try {
        await fetchNotifications();
      } catch (error) {
        componentLogger.error("Error loading notifications:", error);
      } finally {
        // Ensure loading is false even if no cache exists
        setLoading(false);
        setCacheHydrated(true);
      }
    };

    loadData();
    // Auto-refresh every 30 minutes (matching backend status check interval)
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchNotifications();
      }
    }, 1800000); // 1800000 ms = 30 minutes

    return () => clearInterval(interval);
  }, [mounted, fetchNotifications, calculateStats]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetchNotifications();
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, fetchNotifications]);

  useEffect(() => {
    const handleCacheUpdated = () => {
      if (!mounted) return;
      fetchNotifications();
    };

    window.addEventListener('notificationsCacheUpdated', handleCacheUpdated);
    return () => window.removeEventListener('notificationsCacheUpdated', handleCacheUpdated);
  }, [mounted, fetchNotifications]);

  const handleCleanup = useCallback(() => {
    try {
      const cleaned = cleanOldNotifications(notifications);
      if (cleaned.length !== notifications.length) {
        setNotifications(cleaned);
        setStats(calculateStats(cleaned));
        localStorage.setItem("notif-cache", JSON.stringify(cleaned));
        storageLogger.log(
          `Manual cleanup: removed ${notifications.length - cleaned.length
          } old notifications`
        );

        alert(
          `Cleaned ${notifications.length - cleaned.length} old notifications`
        );
      } else {
        alert("No old notifications to clean up");
      }
    } catch (error) {
      componentLogger.error("Manual cleanup failed:", error);
      alert("Cleanup failed. Please try again.");
    }
  }, [notifications, calculateStats]);

  const handleAIQuery = (notification: Notification) => {
    // Trigger live chat to open with pre-filled context
    const chatEvent = new CustomEvent("openLiveChat", {
      detail: {
        notification: {
          title: notification.title,
          message: notification.message,
          deviceName: notification.deviceName,
          roomNo: notification.roomNo,
          status: notification.currentStatus,
          errorCategory: notification.errorCategory,
          source: notification.source,
          error: notification.error,
        },
      },
    });
    window.dispatchEvent(chatEvent);
  };

  const activeIssuesDisplay = autoFixStats
    ? Math.max(0, autoFixStats.total - (autoFixStats.byStatus.pending ?? 0))
    : stats?.activeIssues ?? 0;

  // Helper function to normalize category names
  const normalizeCategoryName = (category: string): string => {
    // Normalize both 'Katagori' and 'Kategori' to 'Kategori' for consistency
    return category
      .replace(/katagori-/gi, 'Kategori-')
      .replace(/kategori-/gi, 'Kategori-');
  };

  const getSpecificFAQCategory = (
    notification: Notification
  ): string | null => {
    // Create cache key from notification properties
    const cacheKey = `${notification.source}-${notification.title || ""}-${notification.message || ""}-${notification.error || ""}-${notification.errorCategory || ""}`;

    // Check cache first
    if (faqCategoryCache.current.has(cacheKey)) {
      return faqCategoryCache.current.get(cacheKey)!;
    }

    // Normalize notification text for better matching
    const notifText = [
      notification.title?.toLowerCase() || "",
      notification.message?.toLowerCase() || "",
      notification.error?.toLowerCase() || "",
      notification.deviceName?.toLowerCase() || "",
      notification.errorCategory?.toLowerCase() || "",
    ].join(" ");

    // Normalize ML predicted categories to match FAQ naming convention
    // This handles both 'Katagori-X' (ML output) and 'Kategori-X' (FAQ)
    const normalizedNotifText = notifText
      .replace(/katagori-/gi, 'kategori-')
      .replace(/kategori-/gi, 'kategori-');

    // Enhanced keyword mapping for better categorization
    const categoryMappings = {
      "Kategori-1": {
        keywords: [
          "no device found",
          "chromecast",
          "not found",
          "device offline",
        ],
        device: "chromecast",
        priority: 1,
      },
      "Kategori-2": {
        keywords: ["weak", "signal", "no signal", "iptv", "tv offline"],
        device: "iptv",
        priority: 2,
      },
      "Kategori-3": {
        keywords: ["unplug", "lan", "cable", "connection", "lan in", "lan out"],
        device: "iptv",
        priority: 3,
      },
      "Kategori-4": {
        keywords: ["setup", "ios", "iphone", "google home", "local network"],
        device: "chromecast",
        priority: 2,
      },
      "Kategori-5": {
        keywords: ["error playing", "playing", "stream", "video"],
        device: "channel",
        priority: 1,
      },
      "Kategori-6": {
        keywords: ["player error", "player_error", "hbrowser", "widget"],
        device: "channel",
        priority: 3,
      },
      "Kategori-7": {
        keywords: [
          "connection failure",
          "connection_failure",
          "ip conflict",
          "network",
        ],
        device: "channel",
        priority: 2,
      },
      "Kategori-8": {
        keywords: ["reset", "configuration", "restart", "power"],
        device: "chromecast",
        priority: 3,
      },
      "Kategori-9": {
        keywords: ["no device logged", "logged", "login", "authentication"],
        device: "iptv",
        priority: 2,
      },
      "Kategori-10": {
        keywords: ["black screen", "screen", "adaptor", "power"],
        device: "chromecast",
        priority: 1,
      },
      "Kategori-11": {
        keywords: ["channel not found", "not found", "channel", "missing"],
        device: "channel",
        priority: 1,
      },
      "Kategori-12": {
        keywords: ["network connection", "connection failed", "wifi", "router", "network"],
        device: "chromecast",
        priority: 2,
      },
      "Kategori-13": {
        keywords: ["initialization", "system error", "firmware", "boot"],
        device: "iptv",
        priority: 3,
      },
      "Kategori-14": {
        keywords: ["logined", "logged in", "authentication", "no device found", "registered"],
        device: "chromecast",
        priority: 2,
      },
    };

    // Device type matching
    const sourceToDevice: Record<string, string> = {
      chromecast: "chromecast",
      tv: "iptv",
      channel: "channel",
      system: "system",
    };

    const expectedDevice = sourceToDevice[notification.source] || null;

    // Find matching categories with scoring system
    const matches = Object.entries(categoryMappings).map(
      ([category, config]) => {
        let score = 0;

        // Device match bonus
        if (!expectedDevice || config.device === expectedDevice) {
          score += 10;
        } else {
          score -= 5; // Penalty for device mismatch
        }

        // Keyword matching with weighted scoring
        const keywordMatches = config.keywords.filter((keyword) =>
          normalizedNotifText.includes(keyword.toLowerCase())
        );

        score += keywordMatches.length * 5;

        // Priority bonus (lower number = higher priority)
        score += 4 - config.priority;

        // Exact phrase matching bonus
        const hasExactMatch = config.keywords.some((keyword) =>
          normalizedNotifText.includes(keyword.toLowerCase())
        );
        if (hasExactMatch) score += 3;

        return {
          category,
          score,
          matches: keywordMatches.length,
        };
      }
    );

    // Sort by score and return best match
    const bestMatch = matches
      .filter((match) => match.score > 5) // Minimum threshold
      .sort((a, b) => b.score - a.score)[0];

    const result = bestMatch ? bestMatch.category : null;

    // Cache the result
    if (result) faqCategoryCache.current.set(cacheKey, result);

    return result;
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchesSearch =
        n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.roomNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.ipAddr?.includes(searchTerm) ||
        n.errorCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.error?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.suggestedSolutions?.some((sol) =>
          sol.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesSource = sourceFilter === "all" || n.source === sourceFilter;
      const matchesType = typeFilter === "all" || n.type === typeFilter;

      let matchesCategory = true;
      if (categoryFilter !== "all") {
        const faqCategory = getSpecificFAQCategory(n);

        if (categoryFilter === "Uncategorized") {
          matchesCategory = !faqCategory;
        } else {
          matchesCategory = faqCategory === categoryFilter;
        }
      }

      return matchesSearch && matchesSource && matchesType && matchesCategory;
    });
  }, [notifications, searchTerm, sourceFilter, typeFilter, categoryFilter]);

  // Pagination
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedNotifications = filteredNotifications.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

    return {
      totalPages,
      startIndex,
      paginatedNotifications,
      endIndex: Math.min(
        startIndex + ITEMS_PER_PAGE,
        filteredNotifications.length
      ),
    };
  }, [filteredNotifications, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sourceFilter, typeFilter, categoryFilter]);

  // Export to CSV
  const exportToCSV = useCallback(async () => {
    if (exportLoading) return;
    setExportLoading(true);

    let notificationsToExport = notifications;

    // Force fresh data fetch before exporting to ensure we have latest metrics
    try {
      componentLogger.info('[CSV Export] Forcing fresh data fetch before export...');
      const freshData = await fetchAllNotifications();
      notificationsToExport = cleanOldNotifications(freshData);

      // Update state with fresh data
      setNotifications(notificationsToExport);
      setStats(calculateStats(notificationsToExport));

      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      componentLogger.error('[CSV Export] Failed to fetch fresh data, using cached data:', error);
      notificationsToExport = notifications;
    }

    try {
      const headers = [
        "Date",
        "Time",
        "Title",
        "Message",
        "Source",
        "Type",
        "Device",
        "Room",
        "IP Address",
        "Status",
        "Error Category",
        "FAQ Category",
        "Response Time (ms)",
        "Signal Level (%)",
        "Packet Loss (%)",
        "Label Packet Loss",
        "Jitter (ms)",
        "Label Jitter",
        "Latency (ms)",
        "Label Latency",
        "Error Rate (%)",
        "Label Error Rate",
        "Recovery Time (s)",
        "Label Recovery Time",
        "Receiving (Mbps)",
        "Outgoing (Mbps)",
        "Bandwidth (Mbps)",
        "Report Status",
        "Priority",
        "Assigned Staff",
        "Handled By Staff",
      ];

      // Apply filters to the fresh data before exporting
      const filteredForExport = notificationsToExport.filter(n => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          (n.title && n.title.toLowerCase().includes(searchLower)) ||
          (n.message && n.message.toLowerCase().includes(searchLower)) ||
          (n.deviceName && n.deviceName.toLowerCase().includes(searchLower)) ||
          (n.roomNo && n.roomNo.toLowerCase().includes(searchLower)) ||
          (n.notificationId && n.notificationId.toLowerCase().includes(searchLower));

        const matchesSource = sourceFilter === "all" || n.source === sourceFilter;
        const matchesType = typeFilter === "all" || n.type === typeFilter;

        let matchesCategory = true;
        if (categoryFilter !== "all") {
          const faqCategory = getSpecificFAQCategory(n);
          if (categoryFilter === "Uncategorized") {
            matchesCategory = !faqCategory;
          } else {
            matchesCategory = faqCategory === categoryFilter;
          }
        }

        return matchesSearch && matchesSource && matchesType && matchesCategory;
      });

      const csvData = filteredForExport.map((notification) => {
        // Helper function to extract staff name from populated staff object
        const getStaffName = (staff: string | { name?: string; id?: string | number; email?: string; department?: string; position?: string } | null | undefined): string => {
          if (!staff) return "N/A";
          if (typeof staff === 'string') return staff;
          // Staff object populated from backend
          if (staff && typeof staff === 'object' && staff.name) {
            return staff.name;
          }
          return "N/A";
        };

        // Extract metrics from backend response structure
        // Backend sends: metrics and labeledMetrics
        const metrics = (notification as any).metrics || {};
        const labeledMetrics = (notification as any).labeledMetrics || {};
        const netStats = (notification as any).networkStats || {};

        // DEBUG: Log metrics data to understand what we're getting
        console.log('[CSV Export] Notification:', notification.notificationId, {
          hasMetrics: !!notification.metrics,
          hasLabeledMetrics: !!notification.labeledMetrics,
          metricsKeys: Object.keys(metrics),
          labeledMetricsKeys: Object.keys(labeledMetrics),
          packetLoss: metrics.packetLoss,
          latency: metrics.latency
        });

        // Determine if device is offline (for score calculation)
        // Match the logic from ChannelsPage.tsx
        const isOffline = notification.currentStatus === 'offline' ||
          notification.reportStatus === 'pending' ||
          notification.reportStatus === 'investigating';

        // Extract metric values - use backend data only, NO random generation
        // This matches exactly how ChannelsPage.tsx handles metrics (line 439-443)
        const packetLoss = metrics.packetLoss ?? 0;
        const jitter = metrics.jitter ?? 0;
        const latency = metrics.latency ?? 0;
        const errorRate = metrics.error ?? 0;  // Note: backend uses 'error', frontend expects 'errorRate'
        const recoveryTime = metrics.recoveryTime ?? 0;

        // Use labeledMetrics from backend if available, otherwise calculate scores
        // This matches exactly how ChannelsPage.tsx handles labels (line 450-454)
        // If offline, override all scores to 1 (Very Poor)
        // If online, use backend labeledMetrics or calculate from actual values
        const packetLossScore = isOffline ? 1 : (labeledMetrics.packetLossLabel?.label ?? calculateMetricScore(packetLoss, 'packetLoss'));
        const jitterScore = isOffline ? 1 : (labeledMetrics.jitterLabel?.label ?? calculateMetricScore(jitter, 'jitter'));
        const latencyScore = isOffline ? 1 : (labeledMetrics.latencyLabel?.label ?? calculateMetricScore(latency, 'latency'));
        const errorRateScore = isOffline ? 1 : (labeledMetrics.errorLabel?.label ?? calculateMetricScore(errorRate, 'error'));
        const recoveryTimeScore = isOffline ? 1 : (labeledMetrics.recoveryTimeLabel?.label ?? calculateMetricScore(recoveryTime, 'recoveryTime'));

        const bandwidthMbps = isOffline ? 0 : (netStats.bandwidth ?? 0);
        const receivingMbps = isOffline ? 0 : (
          netStats.receivingMbps != null
            ? parseFloat(netStats.receivingMbps.toFixed(2))
            : netStats.received != null
              ? parseFloat(((parseFloat(String(netStats.received)) * 1024 * 8) / 3600).toFixed(2))
              : "N/A"
        );
        const outgoingMbps = isOffline ? 0 : (
          netStats.outgoingMbps != null
            ? parseFloat(netStats.outgoingMbps.toFixed(2))
            : netStats.sent != null
              ? parseFloat(((parseFloat(String(netStats.sent)) * 1024 * 8) / 3600).toFixed(2))
              : "N/A"
        );

        // Debug logging for staff data
        /* if (notification.reportStatus === 'resolved' && (!notification.assignedStaff && !notification.handledByStaff)) {
          componentLogger.warn('[CSV Export] Resolved notification missing staff data:', {
            notificationId: notification.id,
            reportStatus: notification.reportStatus,
            assignedStaff: notification.assignedStaff,
            handledByStaff: notification.handledByStaff,
            assignedStaffId: (notification as any).assignedStaffId,
            handledByStaffId: (notification as any).handledByStaffId
          });
        } */

        return [
          notification.date || "N/A",
          notification.time || "N/A",
          notification.title || "N/A",
          notification.message || "N/A",
          notification.source || "N/A",
          notification.type || "N/A",
          notification.deviceName || "N/A",
          notification.roomNo || "N/A",
          notification.ipAddr || "N/A",
          notification.currentStatus || "N/A",
          notification.errorCategory || "N/A",
          getSpecificFAQCategory(notification) || "Uncategorized",
          notification.responseTime?.toString() || "N/A",
          notification.signalLevel?.toString() || "N/A",
          packetLoss.toFixed(2),
          packetLossScore.toString(),
          jitter.toFixed(2),
          jitterScore.toString(),
          latency.toString(),
          latencyScore.toString(),
          errorRate.toFixed(2),
          errorRateScore.toString(),
          recoveryTime.toFixed(1),
          recoveryTimeScore.toString(),
          receivingMbps.toString(),
          outgoingMbps.toString(),
          bandwidthMbps.toString(),
          notification.reportStatus || "N/A",
          notification.priority || "N/A",
          getStaffName(notification.assignedStaff),
          getStaffName(notification.handledByStaff),
        ];
      });

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

        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
        const filename = `notifications_export_${timestamp}.csv`;
        link.setAttribute("download", filename);

        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();

        // Safely remove the link element
        setTimeout(() => {
          if (link.parentNode === document.body) {
            document.body.removeChild(link);
          }
          URL.revokeObjectURL(url);
        }, 100);
      }
    } catch (error) {
      componentLogger.error("Error exporting CSV:", error);
      alert("Failed to export CSV. Please try again.");
    } finally {
      setExportLoading(false);
    }
  }, [notifications, exportLoading, searchTerm, sourceFilter, typeFilter, categoryFilter, calculateStats]);

  const StatusBadge = useCallback(
    ({
      status,
      isStatusChange,
    }: {
      status: string;
      isStatusChange?: boolean;
    }) => (
      <div className="flex flex-col gap-1">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status === "online"
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
            }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full mr-1 ${status === "online" ? "bg-green-500" : "bg-red-500"
              }`}
          ></div>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        {isStatusChange && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Changed
          </span>
        )}
      </div>
    ),
    []
  );

  const TypeBadge = useCallback(({ type }: { type: string }) => {
    const getTypeConfig = (type: string) => {
      switch (type) {
        case "warning":
          return {
            bg: "bg-yellow-100",
            text: "text-yellow-800",
            icon: ExclamationTriangleIcon,
          };
        case "success":
          return {
            bg: "bg-green-100",
            text: "text-green-800",
            icon: CheckCircleIcon,
          };
        default:
          return { bg: "bg-gray-100", text: "text-gray-800", icon: BellIcon };
      }
    };

    const config = getTypeConfig(type);
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  }, []);

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

  if (!mounted || (loading && !cacheHydrated)) {
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
      {/* Header Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
          {/* Total Notifications Card */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transform hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Total
                </p>
                <p className="text-3xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                  {dbTotalCount ?? stats.totalNotifications}
                </p>
                <p className="text-xs text-gray-400 mt-1">All notifications</p>
              </div>
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                  <BellIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Active Issues Card */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-lg hover:border-red-300 transform hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Active
                </p>
                <p className="text-3xl font-bold text-red-600 group-hover:text-red-700 transition-colors">
                  {activeIssuesDisplay}
                </p>
                {activeIssuesDisplay > 0 && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                    Needs attention
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                  <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>


          {/* Average Response Time Card */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-lg hover:border-purple-300 transform hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm group">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Response
                </p>
                <p className="text-3xl font-bold text-purple-600 group-hover:text-purple-700 transition-colors">
                  {stats.avgResponseTime}
                </p>
                <p className="text-xs text-gray-400 mt-1">Avg (ms)</p>
              </div>
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                  <SignalIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Top Issue Category Card */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-lg hover:border-indigo-300 transform hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm group">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Top Issue
                </p>
                <p className="text-lg font-bold text-indigo-600 group-hover:text-indigo-700 transition-colors truncate">
                  {stats.topErrorCategory}
                </p>
                <p className="text-xs text-gray-400 mt-1">Most common</p>
              </div>
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                  <WrenchScrewdriverIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          {/* Search Bar */}
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder={
                screenSize === "mobile"
                  ? "Search..."
                  : "Search notifications, error categories, solutions..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 w-full bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all duration-200 placeholder-gray-500 text-sm sm:text-base"
            />
          </div>

          {/* Filters Group */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Source Filter */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 flex-1 sm:flex-initial min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                    {sourceFilter === "all"
                      ? "Source"
                      : sourceFilter.charAt(0).toUpperCase() +
                      sourceFilter.slice(1)}
                  </span>
                  <ChevronDownIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="min-w-[120px] sm:min-w-32 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 backdrop-blur-sm">
                  {["all", "tv", "chromecast", "channel"].map((source) => (
                    <DropdownMenu.Item
                      key={`source-${source}`}
                      className="flex items-center px-3 py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg cursor-pointer outline-none transition-all duration-150"
                      onClick={() => setSourceFilter(source)}
                    >
                      <span className="capitalize">
                        {source === "all" ? "All Sources" : source}
                      </span>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Type Filter */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 flex-1 sm:flex-initial min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                    {typeFilter === "all"
                      ? "Type"
                      : typeFilter.charAt(0).toUpperCase() +
                      typeFilter.slice(1)}
                  </span>
                  <ChevronDownIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="min-w-[120px] sm:min-w-32 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 backdrop-blur-sm">
                  {["all", "warning", "success"].map((type) => (
                    <DropdownMenu.Item
                      key={`type-${type}`}
                      className="flex items-center px-3 py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer outline-none transition-all duration-150"
                      onClick={() => setTypeFilter(type)}
                    >
                      <span className="capitalize">
                        {type === "all" ? "All Types" : type}
                      </span>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Category Filter */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 flex-1 sm:flex-initial min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                    {categoryFilter === "all"
                      ? "Category"
                      : categoryFilter.replace("Kategori-", "K-")}
                  </span>
                  <ChevronDownIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="min-w-[140px] sm:min-w-32 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 backdrop-blur-sm max-h-64 overflow-y-auto">
                  <DropdownMenu.Item
                    className="flex items-center px-3 py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg cursor-pointer outline-none transition-all duration-150"
                    onClick={() => setCategoryFilter("all")}
                  >
                    All Categories
                  </DropdownMenu.Item>
                  {Array.from(new Set(faqData.map((faq) => faq.category))).map(
                    (category) => (
                      <DropdownMenu.Item
                        key={category}
                        className="flex items-center px-3 py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg cursor-pointer outline-none transition-all duration-150"
                        onClick={() => setCategoryFilter(category)}
                      >
                        {category}
                      </DropdownMenu.Item>
                    )
                  )}
                  <DropdownMenu.Item
                    className="flex items-center px-3 py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg cursor-pointer outline-none transition-all duration-150"
                    onClick={() => setCategoryFilter("External")}
                  >
                    External
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="flex items-center px-3 py-2.5 text-xs sm:text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg cursor-pointer outline-none transition-all duration-150"
                    onClick={() => setCategoryFilter("Uncategorized")}
                  >
                    Uncategorized
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          {/* Action Buttons Group */}
          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 flex-1 sm:flex-initial ${refreshing ? "animate-pulse" : ""
                }`}
              title={refreshing ? "Refreshing..." : "Refresh"}
            >
              <ArrowPathIcon
                className={`w-4 h-4 flex-shrink-0 ${refreshing ? "animate-spin" : ""
                  }`}
              />
              <span className="text-xs sm:text-sm font-medium">
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>

            {/* Export CSV Button */}
            <button
              onClick={exportToCSV}
              disabled={exportLoading}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg sm:rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 flex-1 sm:flex-initial ${exportLoading ? "animate-pulse" : ""
                }`}
              title={exportLoading ? "Exporting..." : "Export CSV"}
            >
              <ArrowDownTrayIcon
                className={`w-4 h-4 flex-shrink-0 ${exportLoading ? "animate-bounce" : ""
                  }`}
              />
              <span className="text-xs sm:text-sm font-medium">
                {exportLoading ? "Exporting..." : "Export"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden backdrop-blur-sm">
        {/* Desktop Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Table Headers */}
            <thead className="bg-gradient-to-r from-gray-50 to-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Notification
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Device Info
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Help
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginationData.paginatedNotifications.map(
                (notification, index) => (
                  <tr
                    key={`notification-${notification.id || index}`}
                    className="hover:bg-slate-50/50 transition-all duration-200 group border-l-4 border-l-transparent hover:border-l-blue-400"
                  >
                    {/* Icon and Message Column */}
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-4">
                        {/* Status-aware icon */}
                        <div className="flex-shrink-0 relative">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-all duration-300 group-hover:shadow-lg ${notification.currentStatus === "offline"
                              ? "bg-gradient-to-br from-red-500 to-red-600"
                              : notification.isStatusChange &&
                                notification.currentStatus === "online"
                                ? "bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse"
                                : notification.type === "warning"
                                  ? "bg-gradient-to-br from-amber-500 to-orange-600"
                                  : notification.type === "success"
                                    ? "bg-gradient-to-br from-green-500 to-emerald-600"
                                    : "bg-gradient-to-br from-gray-500 to-gray-600"
                              }`}
                          >
                            {notification.source === "tv" ? (
                              <ComputerDesktopIcon className="w-6 h-6 text-white drop-shadow-sm" />
                            ) : notification.source === "chromecast" ? (
                              <DevicePhoneMobileIcon className="w-6 h-6 text-white drop-shadow-sm" />
                            ) : notification.source === "channel" ? (
                              <SignalIcon className="w-6 h-6 text-white drop-shadow-sm" />
                            ) : (
                              <BellIcon className="w-6 h-6 text-white drop-shadow-sm" />
                            )}
                          </div>

                          {/* Status change indicator */}
                          {notification.isStatusChange && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center">
                              {notification.currentStatus === "online" ? (
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                              ) : (
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Message content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Device Info Column */}
                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        {notification.roomNo && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 min-w-0">
                              Room:
                            </span>
                            <code className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-mono border border-blue-200">
                              {notification.roomNo}
                            </code>
                          </div>
                        )}
                        {notification.deviceName && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 min-w-0">
                              Device:
                            </span>
                            <span className="text-sm text-gray-700 font-medium truncate">
                              {notification.deviceName}
                            </span>
                          </div>
                        )}
                        {notification.ipAddr && (
                          <div className="mt-1">
                            <code className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-md font-mono border border-gray-200">
                              {notification.ipAddr}
                            </code>
                          </div>
                        )}

                        {/* Assigned Staff */}
                        {notification.assignedStaff && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="text-xs text-gray-400 min-w-[35px]">
                              Staff:
                            </span>
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200 font-medium truncate max-w-[120px]" title={
                              typeof notification.assignedStaff === 'object' && notification.assignedStaff
                                ? `${(notification.assignedStaff as any).name}${(notification.assignedStaff as any).department ? ` - ${(notification.assignedStaff as any).department}` : ''}`
                                : notification.assignedStaff || 'N/A'
                            }>
                              {typeof notification.assignedStaff === 'object' && notification.assignedStaff
                                ? (notification.assignedStaff as any)?.name || 'N/A'
                                : notification.assignedStaff || 'N/A'}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        <StatusBadge
                          status={notification.currentStatus || "unknown"}
                          isStatusChange={notification.isStatusChange}
                        />
                        <TypeBadge type={notification.type || "info"} />
                      </div>
                    </td>

                    {/* Category Column */}
                    <td className="px-6 py-5">
                      <div className="space-y-1.5">
                        {/* Source badge */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400 min-w-[35px]">
                            Src:
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-medium border ${notification.source === "tv"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : notification.source === "chromecast"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : notification.source === "channel"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : "bg-gray-50 text-gray-700 border-gray-200"
                              }`}
                          >
                            {notification.source === "chromecast"
                              ? "Cast"
                              : notification.source === "channel"
                                ? "Chnl"
                                : notification.source.charAt(0).toUpperCase() +
                                notification.source.slice(1, 3)}
                          </span>
                        </div>

                        {/* Error Category */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400 min-w-[35px]">
                            Err:
                          </span>
                          <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-md text-xs font-medium border border-red-200 truncate max-w-[100px]">
                            {(notification.errorCategory || "System").length > 8
                              ? (
                                notification.errorCategory || "System"
                              ).substring(0, 8) + "..."
                              : notification.errorCategory || "System"}
                          </span>
                        </div>

                        {/* FAQ Category - Only show if exists */}
                        {(() => {
                          const faqCategory =
                            getSpecificFAQCategory(notification);
                          if (faqCategory) {
                            return (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-400 min-w-[35px]">
                                  FAQ:
                                </span>
                                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-xs font-medium border border-indigo-200 flex items-center gap-1 max-w-[100px]">
                                  <div className="w-1 h-1 bg-indigo-500 rounded-full flex-shrink-0"></div>
                                  <span className="truncate">
                                    {faqCategory.replace("Kategori-", "K-")}
                                  </span>
                                </span>
                              </div>
                            );
                          }
                          return (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-gray-400 min-w-[35px]">
                                FAQ:
                              </span>
                              <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md text-xs border border-gray-200">
                                None
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </td>

                    {/* Performance Column */}
                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        {notification.responseTime && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 min-w-0">
                              Response:
                            </span>
                            <span
                              className={`px-2 py-1 rounded-md text-xs font-semibold border ${notification.responseTime < 100
                                ? "bg-green-50 text-green-700 border-green-200"
                                : notification.responseTime < 300
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                                }`}
                            >
                              {notification.responseTime}ms
                            </span>
                          </div>
                        )}
                        {notification.signalLevel && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 min-w-0">
                              Signal:
                            </span>
                            <span
                              className={`px-2 py-1 rounded-md text-xs font-semibold border ${notification.signalLevel > 70
                                ? "bg-green-50 text-green-700 border-green-200"
                                : notification.signalLevel > 40
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                                }`}
                            >
                              {notification.signalLevel}%
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Timestamp Column */}
                    <td className="px-6 py-5">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900 mb-1">
                          {notification.date}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {notification.time}
                        </div>
                      </div>
                    </td>

                    {/* Ask AI Column */}
                    <td className="px-6 py-5">
                      {notification.currentStatus === "offline" && (
                        <button
                          onClick={() => handleAIQuery(notification)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-all duration-150 shadow-sm hover:shadow"
                        >
                          <svg
                            className="w-3 h-3 text-gray-500"
                            style={{
                              width: "12px",
                              height: "12px",
                              flexShrink: 0,
                            }}
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
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden divide-y divide-gray-100">
          {paginationData.paginatedNotifications.map((notification, index) => (
            <div
              key={`mobile-notification-${notification.id || index}`}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${notification.type === "warning"
                      ? "bg-gradient-to-br from-yellow-500 to-orange-600"
                      : notification.type === "success"
                        ? "bg-gradient-to-br from-green-500 to-emerald-600"
                        : "bg-gradient-to-br from-gray-500 to-gray-600"
                      }`}
                  >
                    {notification.source === "tv" ? (
                      <ComputerDesktopIcon className="w-5 h-5 text-white" />
                    ) : notification.source === "chromecast" ? (
                      <DevicePhoneMobileIcon className="w-5 h-5 text-white" />
                    ) : notification.source === "channel" ? (
                      <SignalIcon className="w-5 h-5 text-white" />
                    ) : (
                      <BellIcon className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {notification.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {notification.source.charAt(0).toUpperCase() +
                        notification.source.slice(1)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <StatusBadge
                    status={notification.currentStatus || "unknown"}
                    isStatusChange={notification.isStatusChange}
                  />
                  <TypeBadge type={notification.type || "info"} />

                  {/* Ask AI - mobile layout */}
                  {notification.currentStatus === "offline" && (
                    <button
                      onClick={() => handleAIQuery(notification)}
                      className="inline-flex items-center gap-1 px-1 py-0.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-150 shadow-sm hover:shadow min-w-[80px]"
                    >
                      <svg
                        className="w-3.5 h-3.5 text-gray-500"
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
                      <span>Ask AI</span>
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                {notification.message}
              </p>

              <div className="space-y-2 text-sm">
                {notification.roomNo && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Room:</span>
                    <code className="text-gray-900 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {notification.roomNo}
                    </code>
                  </div>
                )}
                {notification.deviceName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Device:</span>
                    <span className="text-xs text-gray-600">
                      {notification.deviceName}
                    </span>
                  </div>
                )}
                {notification.ipAddr && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">IP Address:</span>
                    <code className="text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs">
                      {notification.ipAddr}
                    </code>
                  </div>
                )}
                {notification.assignedStaff && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Assigned Staff:</span>
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-200 font-medium max-w-[120px] truncate" title={
                      typeof notification.assignedStaff === 'object' && notification.assignedStaff
                        ? `${(notification.assignedStaff as any).name}${(notification.assignedStaff as any).department ? ` - ${(notification.assignedStaff as any).department}` : ''}`
                        : notification.assignedStaff || 'N/A'
                    }>
                      {typeof notification.assignedStaff === 'object' && notification.assignedStaff
                        ? (notification.assignedStaff as any)?.name || 'N/A'
                        : notification.assignedStaff || 'N/A'}
                    </span>
                  </div>
                )}
                {notification.errorCategory && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Error:</span>
                    <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs border border-red-200 max-w-[120px] truncate">
                      {notification.errorCategory.length > 10
                        ? notification.errorCategory.substring(0, 10) + "..."
                        : notification.errorCategory}
                    </span>
                  </div>
                )}
                {(() => {
                  const faqCategory = getSpecificFAQCategory(notification);
                  if (faqCategory) {
                    return (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Category:</span>
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs border border-indigo-200 flex items-center gap-1 max-w-[120px]">
                          <div className="w-1 h-1 bg-indigo-500 rounded-full flex-shrink-0"></div>
                          <span className="truncate">
                            {faqCategory.replace("Kategori-", "K-")}
                          </span>
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
                {notification.responseTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Response Time:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${notification.responseTime < 100
                        ? "bg-green-100 text-green-700"
                        : notification.responseTime < 300
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                        }`}
                    >
                      {notification.responseTime}ms
                    </span>
                  </div>
                )}
                {notification.signalLevel && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Signal Level:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${notification.signalLevel > 70
                        ? "bg-green-100 text-green-700"
                        : notification.signalLevel > 40
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                        }`}
                    >
                      {notification.signalLevel}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Timestamp:</span>
                  <span className="text-xs text-gray-600">
                    {notification.date} {notification.time}
                  </span>
                </div>
              </div>

              {/* Suggested Solutions for Mobile */}
              {notification.suggestedSolutions &&
                notification.suggestedSolutions.length > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <LightBulbIcon className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-amber-900 text-sm">
                        Suggested Solutions (
                        {notification.suggestedSolutions.length})
                      </span>
                    </div>
                    <div className="space-y-1">
                      {notification.suggestedSolutions
                        .slice(0, 2)
                        .map((solution, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 text-sm"
                          >
                            <CheckBadgeIcon className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                            <span className="text-amber-800">{solution}</span>
                          </div>
                        ))}
                      {notification.suggestedSolutions.length > 2 && (
                        <div className="text-xs text-amber-700 mt-1">
                          +{notification.suggestedSolutions.length - 2} more
                          solutions...
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredNotifications.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
              {searchTerm || sourceFilter !== "all" || typeFilter !== "all" ? (
                <MagnifyingGlassIcon className="w-12 h-12 text-gray-400" />
              ) : (
                <ShieldCheckIcon className="w-12 h-12 text-green-500" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || sourceFilter !== "all" || typeFilter !== "all"
                ? "No notifications found"
                : "All systems running smoothly"}
            </h3>
            <p className="text-gray-500 mb-4 max-w-md mx-auto">
              {searchTerm || sourceFilter !== "all" || typeFilter !== "all"
                ? "No notifications match your current filters"
                : "No issues detected. All notifications are automatically cleaned after 7 days."}
            </p>
            {(searchTerm || sourceFilter !== "all" || typeFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSourceFilter("all");
                  setTypeFilter("all");
                  setCategoryFilter("all");
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
            className={`flex items-center justify-between gap-2 sm:gap-4 ${screenSize === "mobile"
              ? "flex-col space-y-3"
              : "flex-col sm:flex-row"
              }`}
          >
            {/* Info Text */}
            <div
              className={`text-xs sm:text-sm text-gray-600 ${screenSize === "mobile" ? "order-2" : "order-2 sm:order-1"
                }`}
            >
              {screenSize === "mobile" ? (
                <div className="text-center bg-gray-50 px-3 py-2 rounded-lg border">
                  <span className="font-medium">
                    Page {currentPage} of {paginationData.totalPages}
                  </span>
                  <span className="block text-xs text-gray-500 mt-1">
                    ({paginationData.startIndex + 1}-{paginationData.endIndex}{" "}
                    of {filteredNotifications.length} notifications)
                  </span>
                </div>
              ) : (
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
                    {filteredNotifications.length}
                  </span>{" "}
                  notifications
                </>
              )}
            </div>

            {/* Pagination Controls */}
            <div
              className={`flex items-center gap-1 sm:gap-2 ${screenSize === "mobile" ? "order-1" : "order-1 sm:order-2"
                }`}
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 ${screenSize === "mobile" ? "min-w-[60px]" : ""
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

              {/* Page Numbers */}
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
                        className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${currentPage === 1
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
                        className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${currentPage === i
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
                        className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${currentPage === totalPages
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
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 ${screenSize === "mobile" ? "min-w-[60px]" : ""
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
                Last updated: {new Date(stats.lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Auto-refresh every 30 minutes • Auto-cleanup after 7 days
          </div>
        </div>
      </div>
    </div>
  );
}
