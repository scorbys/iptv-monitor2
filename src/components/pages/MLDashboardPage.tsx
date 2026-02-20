"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

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

export default function MLDashboardPage() {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);

  // Fetch model info on mount
  useEffect(() => {
    fetchModelInfo();
  }, []);

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
      console.error('Error fetching model info:', err);
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
      console.error('Error predicting:', err);
    }
  };

  const handleTrain = async (file: File, sheetName: string): Promise<TrainingResult> => {
    try {
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('sheet_name', sheetName);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

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
          // Refresh model info after training
          await fetchModelInfo();
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
      console.error('Error training:', err);
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
      console.error('Error deleting model:', err);
    }
  };

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
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white">
                    ML Dashboard
                  </h1>
                </div>
                <p className="text-indigo-100 text-lg mb-4">
                  Machine Learning untuk Klasifikasi Komentar IPTV
                </p>

                {/* Quick Stats Row */}
                <div className="flex flex-wrap gap-6 text-white">
                  {modelInfo?.is_trained && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-sm font-medium">
                          {modelInfo.n_classes || 0} Classes
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="text-sm">
                          {modelInfo.n_features || 0} Features
                        </span>
                      </div>
                      {modelInfo.oob_score && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm">
                            Accuracy: {(modelInfo.oob_score * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Status Indicator */}
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                  <div className="flex items-center gap-2">
                    {loading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    ) : (
                      <div
                        className={`w-3 h-3 rounded-full ${
                          modelInfo?.is_trained ? "bg-green-400 animate-pulse" : "bg-yellow-400"
                        }`}
                      />
                    )}
                    <span className="text-white font-semibold text-sm">
                      {loading ? "Loading..." : modelInfo?.is_trained ? "Model Ready" : "Not Trained"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-red-700 font-semibold">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Prediction & Training */}
          <div className="lg:col-span-1 space-y-6">
            {/* Prediction Form */}
            <MLPredictionForm
              onPredict={handlePredict}
              disabled={!modelInfo?.is_trained}
            />

            {/* Training Panel */}
            <MLTrainingPanel
              modelInfo={modelInfo}
              onTrain={handleTrain}
              onDeleteModel={handleDeleteModel}
              onRefresh={fetchModelInfo}
            />
          </div>

          {/* Right Column - Results & Model Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Model Info Card */}
            {modelInfo && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Model Information</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-blue-600 text-sm mb-1">Status</p>
                    <p className="text-gray-900 font-semibold">
                      {modelInfo.is_trained ? 'Trained' : 'Not Trained'}
                    </p>
                  </div>

                  {modelInfo.n_classes && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-green-600 text-sm mb-1">Classes</p>
                      <p className="text-gray-900 font-semibold">{modelInfo.n_classes}</p>
                    </div>
                  )}

                  {modelInfo.n_features && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-purple-600 text-sm mb-1">Features</p>
                      <p className="text-gray-900 font-semibold">{modelInfo.n_features}</p>
                    </div>
                  )}

                  {modelInfo.oob_score && (
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-orange-600 text-sm mb-1">OOB Score</p>
                      <p className="text-green-700 font-semibold">
                        {(modelInfo.oob_score * 100).toFixed(2)}%
                      </p>
                    </div>
                  )}
                </div>

                {modelInfo.classes && modelInfo.classes.length > 0 && (
                  <div className="mt-4">
                    <p className="text-gray-600 text-sm mb-2">Categories:</p>
                    <div className="flex flex-wrap gap-2">
                      {modelInfo.classes.map((cls) => (
                        <span
                          key={cls}
                          className="bg-blue-100 border border-blue-200 rounded-lg px-3 py-1 text-blue-700 text-sm"
                        >
                          {cls}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Results */}
            <MLResults predictions={predictions} />
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="max-w-7xl mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-gray-700 font-medium text-sm">ML Dashboard Active</p>
              <p className="text-gray-600 text-xs">
                Machine Learning service untuk klasifikasi komentar IPTV dengan Balanced Random Forest
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
