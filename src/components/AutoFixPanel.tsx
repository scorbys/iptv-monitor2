"use client";

import { useState, useEffect } from 'react';
import {
  SparklesIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { componentLogger } from "@/utils/debugLogger";

interface AutoFixLog {
  fixId: string;
  notificationId: string;
  fixType: 'automatic' | 'manual' | 'hybrid';
  category: string;
  action: string;
  description: string;
  status: 'pending' | 'executing' | 'success' | 'failed' | 'cancelled';
  confidence: number;
  createdAt: string;
  executedAt: string | null;
  completedAt: string | null;
  result: any;
  errorMessage: string | null;
  retryCount: number;
}

interface MLPrediction {
  predictionId: string;
  notificationId: string;
  predictedCategory: string;
  confidence: number;
  probabilities: Array<{ label: string; probability: number }>;
  suggestedSolutions: string[];
}

interface AutoFixData {
  notification: any;
  mlPrediction: MLPrediction | null;
  autoFixLogs: AutoFixLog[];
  hasAutoFix: boolean;
  autoFixSuccess: number;
}

interface AutoFixPanelProps {
  notificationId: string;
  onClose?: () => void;
}

export default function AutoFixPanel({ notificationId, onClose }: AutoFixPanelProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AutoFixData | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAutoFixData();
  }, [notificationId]);

  const fetchAutoFixData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/autofix?notificationId=${notificationId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch auto-fix data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to auto-fix service');
      componentLogger.error('Error fetching auto-fix data:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerAutoFix = async (action?: string) => {
    try {
      setTriggering(true);
      setError(null);

      const response = await fetch('/api/autofix/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId,
          action
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Refresh data
        await fetchAutoFixData();
      } else {
        setError(result.error || 'Failed to trigger auto-fix');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger auto-fix');
      componentLogger.error('Error triggering auto-fix:', err);
    } finally {
      setTriggering(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case 'executing':
        return <PlayIcon className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-600" />;
      case 'cancelled':
        return <XCircleIcon className="w-5 h-5 text-gray-600" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'executing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'cancelled':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading auto-fix data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg">
            <SparklesIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">ML Auto-Fix</h3>
            <p className="text-sm text-gray-500">
              {data?.hasAutoFix
                ? `${data.autoFixLogs.length} fix attempt(s)`
                : 'No auto-fix attempts yet'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ML Prediction */}
      {data?.mlPrediction && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-blue-600" />
            ML Prediction
          </h4>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-600 mb-1">Predicted Category</p>
              <p className="text-sm font-bold text-gray-900">
                {data.mlPrediction.predictedCategory}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Confidence</p>
              <p className="text-sm font-bold text-gray-900">
                {(data.mlPrediction.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {data.mlPrediction.suggestedSolutions.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 mb-2">Suggested Solutions</p>
              <div className="space-y-1">
                {data.mlPrediction.suggestedSolutions.slice(0, 3).map((solution, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{solution}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auto-Fix Logs */}
      {data?.autoFixLogs && data.autoFixLogs.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Fix Attempts</h4>

          {data.autoFixLogs.map((log) => (
            <div
              key={log.fixId}
              className={`border rounded-lg p-4 ${log.status === 'executing' ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(log.status)}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStatusColor(log.status)}`}>
                      {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </span>
                    {log.fixType === 'automatic' && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                        Auto
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{log.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {log.category} • Confidence: {(log.confidence * 100).toFixed(1)}%
                  </p>
                </div>

                {log.status === 'failed' && log.retryCount < 3 && (
                  <button
                    onClick={() => triggerAutoFix(log.action)}
                    disabled={triggering}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <ArrowPathIcon className="w-3 h-3" />
                    Retry
                  </button>
                )}
              </div>

              {log.result && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                  <p className="font-medium mb-1">Result:</p>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(log.result, null, 2)}
                  </pre>
                </div>
              )}

              {log.errorMessage && (
                <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                  <p className="font-medium mb-1">Error:</p>
                  <p>{log.errorMessage}</p>
                </div>
              )}

              <div className="mt-2 text-xs text-gray-500">
                Created: {new Date(log.createdAt).toLocaleString()}
                {log.completedAt && (
                  <> • Completed: {new Date(log.completedAt).toLocaleString()}</>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <WrenchScrewdriverIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-4">No auto-fix attempts yet</p>
          {data?.mlPrediction && (
            <button
              onClick={() => triggerAutoFix()}
              disabled={triggering}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
            >
              <SparklesIcon className="w-4 h-4" />
              {triggering ? 'Triggering...' : 'Trigger Auto-Fix'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
