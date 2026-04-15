"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
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
  ArrowPathIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import { apiLogger } from "@/utils/debugLogger";
import { format, subDays } from 'date-fns';

// Import Notification type and utilities from notifUtils
import { Notification, fetchAllNotifications as fetchAllNotifsFromUtils, cleanOldNotifications } from "../../app/notifications/notifUtils";

// Dynamic imports with proper loading states
const MLPredictionForm = dynamic(
  () => import('@/components/MLPredictionForm'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }
);

const MLTrainingPanel = dynamic(
  () => import('@/components/MLTrainingPanel'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }
);

const MLResults = dynamic(
  () => import('@/components/MLResults'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }
);

// Dynamic import charts to avoid SSR issues
const Chart = dynamic(() => import('react-chartjs-2').then(mod => mod.Chart), { ssr: false });

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ModelInfo {
  is_trained: boolean;
  n_classes?: number;
  classes?: string[];
  n_features?: number;
  accuracy?: number;
  oob_score?: number;
  per_class_accuracy?: Record<string, number>;
}

interface PredictionResult {
  text: string;
  cleaned_text: string;
  predicted_label: string;
  probabilities?: Array<{ label: string; probability: number }>;
  features: {
    text_len: number;
    word_count: number;
  };
}

interface TrainingResult {
  accuracy?: number;
  oob_score?: number;
  n_classes?: number;
  classes?: string[];
  n_features?: number;
  train_samples?: number;
  test_samples?: number;
}

interface AutoFixStats {
  total: number;
  successRate: string;
  byStatus: {
    pending: number;
    executing: number;
    success: number;
    failed: number;
    cancelled: number;
  };
  byCategory: Array<{
    _id: string;
    count: number;
    success: number;
  }>;
  byFixType: Array<{
    _id: string;
    count: number;
  }>;
  period: string;
}

interface AutoFixStatsResponse {
  success: boolean;
  data: AutoFixStats;
  error?: string;
}

interface AutoFixLog {
  fixId: string;
  notificationId: string;
  category: string;
  action: string;
  description: string;
  status: string;
  confidence: number;
  createdAt: string;
  notification?: {
    id: string;
    title: string;
    source: string;
    deviceName: string;
    roomNo: string;
  };
}

interface TimeSeriesData {
  date: string;
  success: number;
  failed: number;
  total: number;
  successRate: number;
}

interface StaffPerformance {
  _id: string;
  name: string;
  department: string;
  position: string;
  stats: {
    totalAssigned: number;
    totalResolved: number;
    avgResolutionTime: number;
    successRate: number;
  };
}

export default function MLDashboardPage() {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [autoFixStats, setAutoFixStats] = useState<AutoFixStats | null>(null);
  const [recentAutoFixes, setRecentAutoFixes] = useState<AutoFixLog[]>([]);
  const [allAutoFixes, setAllAutoFixes] = useState<AutoFixLog[]>([]); // For export
  const [topDevices, setTopDevices] = useState<Array<{ device: string; count: number }>>([]);
  const [topRooms, setTopRooms] = useState<Array<{ room: string; count: number }>>([]);
  const [loadingAutoFix, setLoadingAutoFix] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);

  // Advanced filters
  const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('30');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'analytics'>('overview');

  useEffect(() => {
    fetchModelInfo();
  }, []);

  // Fetch model info on mount
  useEffect(() => {
    fetchAutoFixStats();
    fetchRecentAutoFixes();
    fetchTimeSeriesData();
    fetchStaffPerformance();
    fetchTopDevicesAndRooms();
    //fetchAllNotificationsForDashboard();
  }, [dateRange]);

  // Fetch all notifications for category breakdown using notifUtils
  const fetchAllNotificationsForDashboard = async () => {
    try {
      setLoadingNotifications(true);

      // Use the same fetchAllNotifications function from notifUtils
      const notifications = await fetchAllNotifsFromUtils();
      const cleaned = cleanOldNotifications(notifications);

      setAllNotifications(cleaned);
      console.log('Loaded notifications for category breakdown:', cleaned.length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setAllNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTimeSeriesData = async () => {
    try {
      setLoadingCharts(true);
      const days = parseInt(dateRange);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");

      // Fetch timeseries data directly from backend API
      const response = await fetch(`/api/auto-fix/stats?period=${days}&timeseries=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data.timeseries) {
        const timeSeries: TimeSeriesData[] = data.data.timeseries.map((item: any) => ({
          date: item.displayDate,
          success: item.success,
          failed: item.failed,
          total: item.total,
          successRate: item.successRate
        }));

        setTimeSeriesData(timeSeries);
      } else {
        setTimeSeriesData([]);
      }
    } catch (err) {
      console.error('Error fetching time series data:', err);
      setTimeSeriesData([]);
    } finally {
      setLoadingCharts(false);
    }
  };

  const fetchAutoFixStats = async () => {
    try {
      setLoadingAutoFix(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const response = await fetch(`/api/auto-fix/stats?period=${dateRange}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setAutoFixStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching auto-fix stats:', err);
    } finally {
      setLoadingAutoFix(false);
    }
  };

  const fetchRecentAutoFixes = async () => {
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const response = await fetch('/api/auto-fix/history?limit=50&skip=0', {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setRecentAutoFixes(data.data);
      }
    } catch (err) {
      console.error('Error fetching recent auto-fixes:', err);
    }
  };

  const fetchAllAutoFixesForExport = async () => {
    try {
      // Fetch all auto-fixes with pagination to get complete data
      let allFixes: AutoFixLog[] = [];
      let skip = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(`/api/auto-fix/history?limit=${limit}&skip=${skip}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data.length > 0) {
          allFixes = [...allFixes, ...data.data];
          skip += limit;
          hasMore = data.pagination?.hasMore || data.data.length === limit;
        } else {
          hasMore = false;
        }
      }

      setAllAutoFixes(allFixes);
      return allFixes;
    } catch (err) {
      console.error('Error fetching all auto-fixes:', err);
      return [];
    }
  };

  const fetchModelInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/ml/model/info');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON, got ${contentType}. Response: ${text.substring(0, 100)}`);
      }

      const data = await response.json();

      if (data.success) {
        setModelInfo(data.data);
      } else {
        setError(data.error || 'Failed to fetch model info');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to ML service');
      apiLogger.error('Error fetching model info:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffPerformance = async () => {
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const response = await fetch('/api/staff', {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.staff) {
        // Sort staff by performance (success rate and total resolved)
        const sortedStaff = data.staff.sort((a: StaffPerformance, b: StaffPerformance) => {
          if (b.stats.successRate !== a.stats.successRate) {
            return b.stats.successRate - a.stats.successRate;
          }
          return b.stats.totalResolved - a.stats.totalResolved;
        });
        setStaffPerformance(sortedStaff);
      }
    } catch (err) {
      console.error('Error fetching staff performance:', err);
    }
  };

  const fetchTopDevicesAndRooms = async () => {
    try {
      const days = parseInt(dateRange);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");

      console.log('Fetching analytics data...');

      const response = await fetch(`/api/notifications/stats?analytics=true&period=${days}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log('Analytics API response:', data);

      if (data.success) {
        console.log('Top devices:', data.data.topDevices);
        console.log('Top rooms:', data.data.topRooms);
        setTopDevices(data.data.topDevices || []);
        setTopRooms(data.data.topRooms || []);
      } else {
        console.error('API returned success=false:', data.error);
        setTopDevices([]);
        setTopRooms([]);
      }
    } catch (err) {
      console.error('Error fetching top devices and rooms:', err);
      // Fallback to empty arrays
      setTopDevices([]);
      setTopRooms([]);
    }
  };

  const handlePredict = async (text: string) => {
    try {
      setError(null);

      const response = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON, got ${contentType}`);
      }

      const data = await response.json();

      if (data.success) {
        setPredictions((prev) => [data.data, ...prev]);
      } else {
        setError(data.error || 'Prediction failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make prediction');
      apiLogger.error('Error predicting:', err);
    }
  };

  const handleTrain = async (file: File, sheetName: string): Promise<TrainingResult> => {
    try {
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('sheet_name', sheetName);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);

      try {
        const response = await fetch('/api/ml/model/train', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}. ${errorText.substring(0, 200)}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          throw new Error(`Expected JSON, got ${contentType}. Response: ${text.substring(0, 100)}`);
        }

        const data = await response.json();

        if (data.success) {
          await fetchModelInfo();
          await fetchAutoFixStats();
          return data.data;
        } else {
          setError(data.error || 'Training failed');
          throw new Error(data.error || 'Training failed');
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Training timeout. The model training took too long. Please try with a smaller dataset.');
        }
        throw fetchError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to train model';
      setError(errorMessage);
      apiLogger.error('Error training:', err);
      throw new Error(errorMessage);
    }
  };

  const handleDeleteModel = async () => {
    if (!confirm('Are you sure you want to delete the trained model?')) {
      return;
    }

    try {
      setError(null);

      const response = await fetch('/api/ml/model', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON, got ${contentType}`);
      }

      const data = await response.json();

      if (data.success) {
        await fetchModelInfo();
        setPredictions([]);
      } else {
        setError(data.error || 'Failed to delete model');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete model');
      apiLogger.error('Error deleting model:', err);
    }
  };

  const exportToCSV = async () => {
    try {
      setIsExporting(true);

      // Fetch all auto-fixes for export
      const allFixes = await fetchAllAutoFixesForExport();

      if (!allFixes || allFixes.length === 0) {
        alert('No data to export');
        return;
      }

      console.log(`Exporting ${allFixes.length} records...`);

      // Fetch chromecast devices to enrich room numbers
      const chromecastRoomMap: Record<string, string> = {};
      try {
        const chromecastResponse = await fetch('/api/chromecast?limit=1000');
        if (chromecastResponse.ok) {
          const chromecastData = await chromecastResponse.json();
          if (chromecastData.success && chromecastData.data) {
            chromecastData.data.forEach((cc: any) => {
              if (cc.deviceName && cc.roomNr) {
                chromecastRoomMap[cc.deviceName] = cc.roomNr;
              }
            });
          }
        }
      } catch (err) {
        console.warn('Failed to fetch chromecast data for room enrichment:', err);
      }

      const headers = ['Date', 'Category', 'Action', 'Status', 'Device', 'Room', 'Confidence', 'Description'];
      const csvData = allFixes.map((fix) => {
        // Enrich roomNo from chromecast collection if notification roomNo is N/A
        let roomNo = fix.notification?.roomNo || 'N/A';
        const deviceName = fix.notification?.deviceName || 'N/A';

        // If roomNo is N/A or missing, try to get it from chromecast collection
        if ((!roomNo || roomNo === 'N/A') && deviceName && chromecastRoomMap[deviceName]) {
          roomNo = chromecastRoomMap[deviceName];
        }

        return [
          new Date(fix.createdAt).toLocaleString(),
          fix.category,
          fix.action,
          fix.status,
          deviceName,
          roomNo,
          `${(fix.confidence * 100).toFixed(1)}%`,
          fix.description,
        ];
      });

      const csvContent = [
        headers.join(','),
        ...csvData.map((row) =>
          row
            .map((field) => {
              const stringField = String(field);
              if (
                stringField.includes(',') ||
                stringField.includes('"') ||
                stringField.includes('\n') ||
                stringField.includes('\r')
              ) {
                return `"${stringField.replace(/"/g, '""')}"`;
              }
              return stringField;
            })
            .join(',')
        ),
      ]
        .join('\n');

      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `autofix_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();

      // Safely remove the link element
      setTimeout(() => {
        if (link.parentNode === document.body) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefreshAll = async () => {
    await Promise.all([
      fetchModelInfo(),
      fetchAutoFixStats(),
      fetchRecentAutoFixes(),
      fetchTimeSeriesData(),
      fetchStaffPerformance(),
      //fetchAllNotificationsForDashboard(),
    ]);
  };

  // Helper function to normalize category names (same as NotifPage)
  const normalizeCategoryName = (category: string): string => {
    return category
      .replace(/katagori-/gi, 'Kategori-')
      .replace(/kategori-/gi, 'Kategori-');
  };

  // FAQ Category mapping function (same as NotifPage) - Optimized with caching
  const categoryMappings = useMemo(() => ({
    "Kategori-1": {
      keywords: ["no device found", "chromecast", "not found", "device offline"],
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
      keywords: ["connection failure", "connection_failure", "ip conflict", "network"],
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
  }), []);

  const sourceToDevice: Record<string, string> = useMemo(() => ({
    chromecast: "chromecast",
    tv: "iptv",
    channel: "channel",
    system: "system",
  }), []);

  // Cache for category results
  const categoryCache = useMemo(() => new Map<string, string | null>(), []);

  const getSpecificFAQCategory = (notification: Partial<Notification>): string | null => {
    // Create cache key from notification content
    const cacheKey = `${notification.title?.slice(0, 50)}|${notification.message?.slice(0, 50)}|${notification.source}`;

    // Check cache first
    if (categoryCache.has(cacheKey)) {
      return categoryCache.get(cacheKey)!;
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
    const normalizedNotifText = notifText
      .replace(/katagori-/gi, 'kategori-')
      .replace(/kategori-/gi, 'kategori-');

    const expectedDevice = sourceToDevice[notification.source || ""] || null;

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
    categoryCache.set(cacheKey, result);

    return result;
  };

  // Calculate category breakdown from notifications using FAQ categories
  const categoryBreakdown = useMemo(() => {
    if (!autoFixStats?.byCategory) return [];
    return autoFixStats.byCategory; // sudah dalam format {_id, count, success}
  }, [autoFixStats]);

  // Update auto-refresh to include notifications
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        fetchAutoFixStats();
        fetchRecentAutoFixes();
        fetchTimeSeriesData();
        //fetchAllNotificationsForDashboard();
      }, autoRefreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefreshInterval, dateRange]);

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  };

  const lineChartData = {
    labels: timeSeriesData.map(d => d.date),
    datasets: [
      {
        label: 'Success Rate (%)',
        data: timeSeriesData.map(d => d.successRate.toFixed(1)),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const barChartData = {
    labels: timeSeriesData.map(d => d.date),
    datasets: [
      {
        label: 'Success',
        data: timeSeriesData.map(d => d.success),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
      {
        label: 'Failed',
        data: timeSeriesData.map(d => d.failed),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      },
    ],
  };

  const doughnutChartData = {
    labels: categoryBreakdown.slice(0, 6).map(c => c._id) || [],
    datasets: [
      {
        data: categoryBreakdown.slice(0, 6).map(c => c.count) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  if (loading) {
    return (
      <div className="p-6 bg-blue-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading ML Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4 sm:p-6">
      {/* Header */}
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
                    Machine Learning Dashboard
                  </h1>
                </div>
                <p className="text-blue-100 text-lg mb-4">
                  AI-powered issue prediction and automated resolution
                </p>

                {/* Quick Stats Row */}
                <div className="flex flex-wrap gap-6 text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">
                      {modelInfo?.is_trained ? "Model Active" : "Model Not Trained"}
                    </span>
                  </div>
                  {modelInfo?.is_trained && (
                    <>
                      <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4 text-blue-200" />
                        <span className="text-sm">
                          {modelInfo.n_classes} Categories
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <SignalIcon className="w-4 h-4 text-blue-200" />
                        <span className="text-sm">
                          {modelInfo.accuracy ? `${(modelInfo.accuracy * 100).toFixed(1)}%` : 'N/A'} Accuracy
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Status Indicator */}
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${error ? "bg-red-400" : "bg-green-400"
                        } ${!error ? "animate-pulse" : ""}`}
                    />
                    <span className="text-white font-semibold text-sm">
                      {error ? "System Error" : "All Systems Online"}
                    </span>
                  </div>
                  <div className="text-blue-200 text-sm">
                    {currentTime.toLocaleTimeString()}
                  </div>
                </div>

                {/* Date Range Selector */}
                <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
                  {["7", "30", "90"].map((range) => (
                    <button
                      key={range}
                      onClick={() => setDateRange(range as '7' | '30' | '90')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${dateRange === range
                        ? "bg-white text-blue-700 shadow-lg"
                        : "text-white hover:bg-white/20"
                        }`}
                    >
                      {range} Days
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
            <p className="text-red-700 text-sm">Error: {error}</p>
          </div>
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Date Range & Auto Refresh */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing data for last <span className="font-semibold text-gray-900">{dateRange} days</span>
            </div>
            {autoRefreshInterval > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                <span>Auto-refresh: {autoRefreshInterval}s</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshAll}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Refresh</span>
            </button>

            <button
              onClick={exportToCSV}
              disabled={isExporting}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 ${isExporting ? "animate-pulse" : ""}`}
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{isExporting ? "Exporting..." : "Export CSV"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${activeTab === 'staff'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <ShieldCheckIcon className="w-5 h-5" />
            <span>Staff Performance</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <SignalIcon className="w-5 h-5" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          {autoFixStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transform hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Total Attempts</p>
                    <p className="text-3xl font-bold text-blue-600">{autoFixStats.total}</p>
                    <p className="text-xs text-gray-400 mt-1">Auto-fix executions</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm">
                      <ChartBarIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-lg hover:border-green-300 transform hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Success Rate</p>
                    <p className="text-3xl font-bold text-green-600">{autoFixStats.successRate}</p>
                    <p className="text-xs text-gray-400 mt-1">Overall success</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm">
                      <CheckCircleIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-lg hover:border-yellow-300 transform hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600">{autoFixStats.byStatus.pending}</p>
                    <p className="text-xs text-gray-400 mt-1">Awaiting action</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-sm">
                      <ClockIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-lg hover:border-red-300 transform hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Failed</p>
                    <p className="text-3xl font-bold text-red-600">{autoFixStats.byStatus.failed}</p>
                    <p className="text-xs text-gray-400 mt-1">Failed attempts</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-sm">
                      <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ML Components */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - ML Forms */}
            <div className="space-y-6">
              <MLPredictionForm onPredict={handlePredict} />
              {predictions.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Predictions</h3>
                  <MLResults predictions={predictions} />
                </div>
              )}
            </div>

            {/* Right Column - ML Training */}
            <div className="space-y-6">
              <MLTrainingPanel
                onTrain={handleTrain}
                onDeleteModel={handleDeleteModel}
                onRefresh={fetchModelInfo}
                modelInfo={modelInfo}
              />
            </div>
          </div>

          {/* Per-Category Accuracy Panel - Full Width Below */}
          {modelInfo?.is_trained && (() => {
                // ── data source ──────────────────────────────────────────────
                // Use live per_class_accuracy when available (populated after
                // training with the updated model_service.py).
                // Values from the API are 0-1 floats; convert to percentages.
                const isLiveData = !!modelInfo.per_class_accuracy;

                const rawData: Record<string, number> = isLiveData
                  ? Object.fromEntries(
                      Object.entries(modelInfo.per_class_accuracy!).map(
                        ([k, v]) => [k, (v as number) * 100]
                      )
                    )
                  : {
                      // Fallback: thesis baseline — shown only before first retrain
                      "External":    84.44,
                      "Katagori-1":  97.06,
                      "Katagori-2":  97.18,
                      "Katagori-3":  96.57,
                      "Katagori-4":  93.36,
                      "Katagori-5":  96.82,
                      "Katagori-6":  97.14,
                      "Katagori-7":  94.09,
                      "Katagori-8":  95.00,
                      "Katagori-9":  95.00,
                      "Katagori-10": 94.09,
                      "Katagori-11": 93.64,
                      "Katagori-12": 95.50,
                      "Katagori-13": 92.00,
                    };

                // Sort: External/non-numeric first, then Kategori-1..N numerically
                const sorted = Object.entries(rawData).sort(([a], [b]) => {
                  const numA = parseInt(a.replace(/[^0-9]/g, ""), 10);
                  const numB = parseInt(b.replace(/[^0-9]/g, ""), 10);
                  if (isNaN(numA) && isNaN(numB)) return a.localeCompare(b);
                  if (isNaN(numA)) return -1;
                  if (isNaN(numB)) return 1;
                  return numA - numB;
                });

                const values = sorted.map(([, v]) => v);

                // Colour ramp based on distance from max
                const getBarColor = (acc: number) => {
                  if (acc >= 97)   return { bar: "from-emerald-400 to-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" };
                  if (acc >= 95)   return { bar: "from-blue-400 to-blue-500",       badge: "bg-blue-50 text-blue-700 border-blue-200" };
                  if (acc >= 93)   return { bar: "from-indigo-400 to-indigo-500",   badge: "bg-indigo-50 text-indigo-700 border-indigo-200" };
                  if (acc >= 90)   return { bar: "from-amber-400 to-amber-500",     badge: "bg-amber-50 text-amber-700 border-amber-200" };
                  return              { bar: "from-orange-400 to-orange-500",    badge: "bg-orange-50 text-orange-700 border-orange-200" };
                };

                return (
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* ── Header ── */}
                    <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                            <ShieldCheckIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-base font-bold text-gray-900">Akurasi Per Kategori</h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {isLiveData
                                ? `${sorted.length} kelas · data aktual dari model`
                                : "data baseline tesis · latih ulang untuk memperbarui"}
                            </p>
                          </div>
                        </div>
                        {/* Live / Fallback badge */}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          isLiveData
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isLiveData ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
                          {isLiveData ? "Live" : "Baseline"}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-5">
                      {/* ── Overall + OOB score row ── */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 text-center">
                          <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider mb-1">Test Accuracy</p>
                          <p className="text-2xl font-extrabold text-blue-700 tabular-nums">
                            {modelInfo.accuracy ? `${(modelInfo.accuracy * 100).toFixed(2)}%` : "—"}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 text-center">
                          <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider mb-1">OOB Score</p>
                          <p className="text-2xl font-extrabold text-indigo-700 tabular-nums">
                            {modelInfo.oob_score ? `${(modelInfo.oob_score * 100).toFixed(2)}%` : "—"}
                          </p>
                        </div>
                      </div>

                      {/* ── Legend chips ── */}
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: "≥ 97%", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                          { label: "≥ 95%", cls: "bg-blue-50 text-blue-700 border-blue-200" },
                          { label: "≥ 93%", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
                          { label: "≥ 90%", cls: "bg-amber-50 text-amber-700 border-amber-200" },
                          { label: "< 90%", cls: "bg-orange-50 text-orange-700 border-orange-200" },
                        ].map(({ label, cls }) => (
                          <span key={label} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
                            {label}
                          </span>
                        ))}
                      </div>

                      {/* ── Per-class bars (2-column grid on wider screens) ── */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        {sorted.map(([rawLabel, acc], idx) => {
                          const displayLabel = rawLabel.replace(/Katagori-/gi, "Kategori-");
                          const isNonNumeric = isNaN(parseInt(rawLabel.replace(/[^0-9]/g, ""), 10));
                          const { bar, badge } = getBarColor(acc);
                          // Bar width: use actual percentage (0-100 scale) for honest representation
                          const barWidth = Math.max(1, acc);

                          return (
                            <div
                              key={rawLabel}
                              className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50 transition-colors duration-150"
                            >
                              {/* Row number */}
                              <span className="flex-shrink-0 w-5 text-[10px] font-bold text-gray-300 text-right tabular-nums select-none">
                                {(idx + 1).toString().padStart(2, "0")}
                              </span>

                              {/* Label */}
                              <span className={`flex-shrink-0 w-24 text-xs font-semibold truncate ${isNonNumeric ? "text-gray-400 italic" : "text-gray-700"}`}>
                                {displayLabel}
                              </span>

                              {/* Bar track */}
                              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${bar} transition-all duration-700 ease-out`}
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>

                              {/* Percentage badge */}
                              <span className={`flex-shrink-0 text-xs font-bold tabular-nums px-2 py-0.5 rounded-full border ${badge}`}>
                                {acc.toFixed(1)}%
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* ── Baseline notice (only when not live) ── */}
                      {!isLiveData && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mt-1">
                          <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700 leading-relaxed">
                            Data ini berasal dari hasil tesis (Random Forest, 1952 fitur, Test Accuracy 94.37%).
                            Lakukan <strong>training ulang</strong> dengan dataset terbaru untuk memperbarui ke data aktual.
                          </p>
                        </div>
                      )}

                      {/* ── Model meta footer ── */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-gray-100">
                        {modelInfo.n_classes != null && (
                          <span className="text-[10px] text-gray-400">
                            <span className="font-semibold text-gray-600">{modelInfo.n_classes}</span> kelas
                          </span>
                        )}
                        {modelInfo.n_features != null && (
                          <span className="text-[10px] text-gray-400">
                            <span className="font-semibold text-gray-600">{modelInfo.n_features.toLocaleString()}</span> fitur
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">
                          akurasi per kelas = <span className="font-semibold text-gray-600">recall</span> (sklearn)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Staff Performance List */}
          {staffPerformance.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Staff Performance</h2>
              </div>
              <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
                {staffPerformance.map((staff, index) => (
                  <div
                    key={staff._id}
                    className="p-5 rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:shadow-lg hover:border-blue-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {/* Rank Badge */}
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md ${index === 0
                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                            : index === 1
                              ? 'bg-gradient-to-br from-gray-400 to-gray-600'
                              : index === 2
                                ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                                : 'bg-gradient-to-br from-blue-400 to-blue-600'
                            }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{staff.name}</h4>
                          <p className="text-sm text-gray-500">{staff.position} • {staff.department}</p>
                        </div>
                      </div>
                      {/* Success Rate Badge - Calculate correctly */}
                      <div
                        className={`px-4 py-2 rounded-full text-sm font-bold ${staff.stats.totalAssigned > 0
                          ? ((staff.stats.totalResolved / staff.stats.totalAssigned) * 100) >= 80
                            ? 'bg-green-100 text-green-700'
                            : ((staff.stats.totalResolved / staff.stats.totalAssigned) * 100) >= 50
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                          }`}
                      >
                        {staff.stats.totalAssigned > 0
                          ? `${((staff.stats.totalResolved / staff.stats.totalAssigned) * 100).toFixed(1)}% Success`
                          : '0% Success'
                        }
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 ml-16">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <BellIcon className="w-4 h-4 text-blue-500" />
                          <p className="text-xs font-semibold text-gray-600 uppercase">Assigned</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{staff.stats.totalAssigned}</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          <p className="text-xs font-semibold text-gray-600 uppercase">Resolved</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{staff.stats.totalResolved}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
              {recentAutoFixes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BellIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg">No recent auto-fix activity</p>
                </div>
              ) : (
                recentAutoFixes.slice(0, 20).map((fix) => (
                  <div key={fix.fixId} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">
                        {new Date(fix.createdAt).toLocaleString()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${fix.status === 'success' ? 'bg-green-100 text-green-700' :
                        fix.status === 'failed' ? 'bg-red-100 text-red-700' :
                          fix.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {fix.status}
                      </span>
                    </div>
                    <div className="text-base font-semibold text-gray-900 mb-2">{fix.category}</div>
                    <div className="text-sm text-gray-600 mb-3">{fix.description}</div>
                    {fix.notification && (
                      <div className="flex items-center gap-3 text-sm text-gray-500 bg-white p-2 rounded-lg">
                        <ComputerDesktopIcon className="w-4 h-4" />
                        <span className="font-medium">{fix.notification.deviceName}</span>
                        {fix.notification.roomNo && (
                          <>
                            <span>•</span>
                            <span>Room {fix.notification.roomNo}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Success Rate Trend */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Success Rate Trend</h3>
                <ArrowUpIcon className="w-6 h-6 text-green-500" />
              </div>
              <div className="h-80">
                {loadingCharts ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  Chart && timeSeriesData.length > 0 && (
                    <Chart type="line" data={lineChartData} options={chartOptions} />
                  )
                )}
              </div>
            </div>

            {/* Volume by Status */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Volume by Status</h3>
                <ChartBarIcon className="w-6 h-6 text-blue-500" />
              </div>
              <div className="h-80">
                {loadingCharts ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  Chart && timeSeriesData.length > 0 && (
                    <Chart type="bar" data={barChartData} options={chartOptions} />
                  )
                )}
              </div>
            </div>
          </div>

          {/* Category Distribution & Top Issues */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Category Distribution</h3>
                <SignalIcon className="w-6 h-6 text-purple-500" />
              </div>
              <div className="h-80">
                {loadingNotifications ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Analyzing notification patterns...</p>
                      <p className="text-xs text-gray-400 mt-1">Processing {allNotifications.length} notifications</p>
                    </div>
                  </div>
                ) : Chart && categoryBreakdown.length > 0 ? (
                  <Chart type="doughnut" data={doughnutChartData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No category data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Issue Categories */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Top Issue Categories</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {loadingNotifications ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Categorizing issues...</p>
                      <p className="text-xs text-gray-400 mt-1">This may take a moment for large datasets</p>
                    </div>
                  </div>
                ) : categoryBreakdown.length > 0 ? (
                  categoryBreakdown.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${index === 0 ? 'bg-red-500' :
                          index === 1 ? 'bg-orange-500' :
                            index === 2 ? 'bg-yellow-500' :
                              index === 3 ? 'bg-blue-500' :
                                index === 4 ? 'bg-purple-500' :
                                  'bg-gray-500'
                          }`}>
                          {index + 1}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{category._id}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">{category.count}</div>
                        <div className="text-xs text-gray-500">{category.success} resolved</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No issue categories available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Devices & Rooms */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Devices */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Top Devices with Issues</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {topDevices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">No device data available</div>
                ) : (
                  topDevices.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${index < 3 ? ['bg-red-500', 'bg-orange-500', 'bg-yellow-500'][index] : 'bg-gray-500'
                          }`}>
                          {index + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          <ComputerDesktopIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900 truncate max-w-[180px]" title={item.device}>
                            {item.device.length > 25 ? item.device.substring(0, 25) + '...' : item.device}
                          </span>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                        {item.count}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Rooms */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Top Rooms with Issues</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {topRooms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">No room data available</div>
                ) : (
                  topRooms.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${index < 3 ? ['bg-red-500', 'bg-orange-500', 'bg-yellow-500'][index] : 'bg-gray-500'
                          }`}>
                          {index + 1}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">Room {item.room}</span>
                      </div>
                      <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                        {item.count}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>ML Service Active</span>
            </div>
            {autoRefreshInterval > 0 && (
              <div className="flex items-center gap-2">
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                <span>Auto-refresh: {autoRefreshInterval}s</span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Showing data for last {dateRange} days • Total records: {autoFixStats?.total || 0}
          </div>
        </div>
      </div>
    </div>
  );
}
