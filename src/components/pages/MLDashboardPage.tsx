"use client";

import { useState, useEffect } from 'react';
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
  oob_score?: number;
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

export default function MLDashboardPage() {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [autoFixStats, setAutoFixStats] = useState<AutoFixStats | null>(null);
  const [recentAutoFixes, setRecentAutoFixes] = useState<AutoFixLog[]>([]);
  const [loadingAutoFix, setLoadingAutoFix] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Advanced filters
  const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('30');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch model info on mount
  useEffect(() => {
    fetchModelInfo();
    fetchAutoFixStats();
    fetchRecentAutoFixes();
    fetchTimeSeriesData();
  }, [dateRange]);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        fetchAutoFixStats();
        fetchRecentAutoFixes();
        fetchTimeSeriesData();
      }, autoRefreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefreshInterval, dateRange]);

  const fetchTimeSeriesData = async () => {
    try {
      setLoadingCharts(true);
      const days = parseInt(dateRange);
      const promises: Promise<AutoFixStatsResponse>[] = [];

      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        promises.push(
          fetch(`/api/auto-fix/stats?period=1&startDate=${date}`).then(res => res.json())
        );
      }

      const results = await Promise.all(promises);
      const timeSeries: TimeSeriesData[] = results.map((result, index) => {
        const date = format(subDays(new Date(), days - 1 - index), 'MMM dd');
        const data = result.data || { byStatus: { success: 0, failed: 0 } };
        return {
          date,
          success: data.byStatus.success || 0,
          failed: data.byStatus.failed || 0,
          total: (data.byStatus.success || 0) + (data.byStatus.failed || 0),
          successRate: data.total ? ((data.byStatus.success || 0) / data.total * 100) : 0,
        };
      });

      setTimeSeriesData(timeSeries.reverse());
    } catch (err) {
      console.error('Error fetching time series data:', err);
    } finally {
      setLoadingCharts(false);
    }
  };

  const fetchAutoFixStats = async () => {
    try {
      setLoadingAutoFix(true);
      const response = await fetch(`/api/auto-fix/stats?period=${dateRange}`);

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
      const response = await fetch('/api/auto-fix/history?limit=50&skip=0');

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

      if (!recentAutoFixes || recentAutoFixes.length === 0) {
        alert('No data to export');
        return;
      }

      const headers = ['Date', 'Category', 'Action', 'Status', 'Device', 'Room', 'Confidence', 'Description'];
      const csvData = recentAutoFixes.map((fix) => [
        new Date(fix.createdAt).toLocaleString(),
        fix.category,
        fix.action,
        fix.status,
        fix.notification?.deviceName || 'N/A',
        fix.notification?.roomNo || 'N/A',
        `${(fix.confidence * 100).toFixed(1)}%`,
        fix.description,
      ]);

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
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
    ]);
  };

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
    labels: autoFixStats?.byCategory.slice(0, 6).map(c => c._id) || [],
    datasets: [
      {
        data: autoFixStats?.byCategory.slice(0, 6).map(c => c.count) || [],
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

  // StatCard component with blue theme
  const StatCard = ({
    title,
    value,
    unit,
    icon: Icon,
    trend,
  }: {
    title: string;
    value: number | string;
    unit: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: number;
  }) => {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-700 mb-1">{title}</p>
            <p className="text-2xl font-bold text-blue-900">
              {typeof value === "number" ? value.toFixed(0) : value}
              <span className="text-sm font-normal text-blue-700 ml-1">
                {unit}
              </span>
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        {typeof trend === "number" && (
          <div className="flex items-center mt-3">
            {trend > 0 ? (
              <ArrowUpIcon className="w-4 h-4 text-green-600 mr-1" />
            ) : (
              <ArrowDownIcon className="w-4 h-4 text-red-600 mr-1" />
            )}
            <span
              className={`text-sm font-medium ${trend > 0 ? "text-green-600" : "text-red-600"
                }`}
            >
              {Math.abs(trend).toFixed(1)}%
            </span>
            <span className="text-xs text-blue-600 ml-1">vs last period</span>
          </div>
        )}
      </div>
    );
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
                          {modelInfo.oob_score ? `${(modelInfo.oob_score * 100).toFixed(1)}%` : 'N/A'} Accuracy
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
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
              disabled={isExporting || recentAutoFixes.length === 0}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 ${isExporting ? "animate-pulse" : ""}`}
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{isExporting ? "Exporting..." : "Export CSV"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column - ML Components */}
        <div className="lg:col-span-2 space-y-6">
          {/* ML Prediction & Training */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MLPredictionForm onPredict={handlePredict} />
            <MLTrainingPanel
              onTrain={handleTrain}
              onDeleteModel={handleDeleteModel}
              onRefresh={fetchModelInfo}
              modelInfo={modelInfo}
            />
          </div>

          {/* ML Results */}
          {predictions.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Predictions</h3>
              <MLResults predictions={predictions} />
            </div>
          )}

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Success Rate Trend */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Success Rate Trend</h3>
                <ArrowUpIcon className="w-5 h-5 text-green-500" />
              </div>
              <div className="h-64">
                {loadingCharts ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                <h3 className="text-lg font-bold text-gray-900">Volume by Status</h3>
                <ChartBarIcon className="w-5 h-5 text-blue-500" />
              </div>
              <div className="h-64">
                {loadingCharts ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  Chart && timeSeriesData.length > 0 && (
                    <Chart type="bar" data={barChartData} options={chartOptions} />
                  )
                )}
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Category Distribution</h3>
              <SignalIcon className="w-5 h-5 text-purple-500" />
            </div>
            <div className="h-64">
              {loadingAutoFix ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                Chart && autoFixStats?.byCategory && autoFixStats.byCategory.length > 0 && (
                  <Chart type="doughnut" data={doughnutChartData} options={chartOptions} />
                )
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Recent Activity */}
        <div className="space-y-6">
          {/* Auto-Fix Stats Cards */}
          {autoFixStats && (
            <>
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Auto-Fix Performance</h2>
                  <button
                    onClick={fetchAutoFixStats}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <ArrowPathIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <StatCard
                    title="Total Attempts"
                    value={autoFixStats.total}
                    unit=""
                    icon={ChartBarIcon}
                  />

                  <StatCard
                    title="Success Rate"
                    value={autoFixStats.successRate}
                    unit=""
                    icon={CheckCircleIcon}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                      <p className="text-yellow-700 text-sm font-medium">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">{autoFixStats.byStatus.pending}</p>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                      <p className="text-red-700 text-sm font-medium">Failed</p>
                      <p className="text-2xl font-bold text-gray-900">{autoFixStats.byStatus.failed}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Issue Categories */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Top Issue Categories</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {autoFixStats.byCategory.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          index === 0 ? 'bg-red-500' :
                          index === 1 ? 'bg-orange-500' :
                          index === 2 ? 'bg-yellow-500' :
                          index === 3 ? 'bg-blue-500' :
                          index === 4 ? 'bg-purple-500' :
                          'bg-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{category._id}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{category.count}</div>
                        <div className="text-xs text-gray-500">{category.success} successful</div>
                      </div>
                    </div>
                  ))}
                  {autoFixStats.byCategory.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No issue categories available
                    </div>
                  )}
                </div>
              </div>

              {/* Top Devices/Channels with Issues */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Top Devices with Issues</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {(() => {
                    // Group by device
                    const deviceIssues: Record<string, number> = {};
                    recentAutoFixes.forEach((fix) => {
                      const device = fix.notification?.deviceName || 'Unknown';
                      deviceIssues[device] = (deviceIssues[device] || 0) + 1;
                    });

                    // Sort all devices by issue count (no filter)
                    const sortedDevices = Object.entries(deviceIssues)
                      .sort(([, a], [, b]) => b - a);

                    return sortedDevices.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No device data available
                      </div>
                    ) : (
                      sortedDevices.map(([device, count], index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                              index === 0 ? 'bg-red-500' :
                              index === 1 ? 'bg-orange-500' :
                              index === 2 ? 'bg-yellow-500' :
                              index === 3 ? 'bg-blue-500' :
                              index === 4 ? 'bg-purple-500' :
                              'bg-gray-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex items-center gap-2">
                              <ComputerDesktopIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]" title={device}>
                                {device.length > 20 ? device.substring(0, 20) + '...' : device}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-600">{count}</div>
                            <div className="text-xs text-gray-500">issues</div>
                          </div>
                        </div>
                      ))
                    );
                  })()}
                </div>
              </div>

              {/* Top Rooms with Issues */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Top Rooms with Issues</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {(() => {
                    // Group by room
                    const roomIssues: Record<string, number> = {};
                    recentAutoFixes.forEach((fix) => {
                      const room = fix.notification?.roomNo || 'Unknown';
                      roomIssues[room] = (roomIssues[room] || 0) + 1;
                    });

                    // Sort all rooms by issue count (no filter)
                    const sortedRooms = Object.entries(roomIssues)
                      .sort(([, a], [, b]) => b - a);

                    return sortedRooms.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No room data available
                      </div>
                    ) : (
                      sortedRooms.map(([room, count], index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                              index === 0 ? 'bg-red-500' :
                              index === 1 ? 'bg-orange-500' :
                              index === 2 ? 'bg-yellow-500' :
                              index === 3 ? 'bg-blue-500' :
                              index === 4 ? 'bg-purple-500' :
                              'bg-gray-500'
                            }`}>
                              {index + 1}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{room}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-600">{count}</div>
                            <div className="text-xs text-gray-500">issues</div>
                          </div>
                        </div>
                      ))
                    );
                  })()}
                </div>
              </div>
            </>
          )}

          {/* Recent Auto-Fix Activity */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentAutoFixes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BellIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No recent auto-fix activity</p>
                </div>
              ) : (
                recentAutoFixes.slice(0, 10).map((fix) => (
                  <div key={fix.fixId} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">
                        {new Date(fix.createdAt).toLocaleString()}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        fix.status === 'success' ? 'bg-green-100 text-green-700' :
                        fix.status === 'failed' ? 'bg-red-100 text-red-700' :
                        fix.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {fix.status}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 mb-1">{fix.category}</div>
                    <div className="text-xs text-gray-600 mb-2">{fix.description}</div>
                    {fix.notification && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <ComputerDesktopIcon className="w-3 h-3" />
                        <span>{fix.notification.deviceName}</span>
                        {fix.notification.roomNo && (
                          <>
                            <span>•</span>
                            <span>{fix.notification.roomNo}</span>
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
      </div>

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
