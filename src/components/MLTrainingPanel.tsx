"use client";

import { useState } from 'react';
import { componentLogger } from "@/utils/debugLogger";

interface ModelInfo {
  is_trained: boolean;
  n_classes?: number;
  classes?: string[];
  n_features?: number;
  accuracy?: number;
  oob_score?: number;
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

interface MLTrainingPanelProps {
  modelInfo: ModelInfo | null;
  onTrain: (file: File, sheetName: string) => Promise<TrainingResult>;
  onDeleteModel: () => void;
  onRefresh: () => void;
}

export default function MLTrainingPanel({
  modelInfo,
  onTrain,
  onDeleteModel,
  onRefresh,
}: MLTrainingPanelProps) {
  const [training, setTraining] = useState(false);
  const [sheetName, setSheetName] = useState('Sheet1');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
        alert('Please upload an Excel file (.xlsx or .xls)');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleTrain = async () => {
    if (!file) return;

    setTraining(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      await onTrain(file, sheetName);
      setProgress(100);
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      componentLogger.error('Training failed:', err);
    } finally {
      clearInterval(progressInterval);
      setTraining(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Model Training</h2>

      {!modelInfo?.is_trained ? (
        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Upload Training Dataset (Excel)
            </label>
            <div className="relative">
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={training}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className={`flex items-center justify-center gap-3 w-full border-2 border-dashed rounded-xl px-4 py-8 transition-all cursor-pointer ${
                  training
                    ? 'border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 bg-gray-50'
                }`}
              >
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500">Excel files (.xlsx, .xls) up to 50MB</p>
                </div>
              </label>
            </div>
          </div>

          {/* Advanced Options */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
            >
              {showAdvanced ? '−' : '+'} Advanced options
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor="sheet-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Sheet Name
                  </label>
                  <input
                    id="sheet-name"
                    type="text"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    disabled={training}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 transition-all"
                    placeholder="Sheet1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {training && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Training model...</span>
                <span className="text-gray-900 font-semibold">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Train Button */}
          <button
            onClick={handleTrain}
            disabled={!file || training}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            {training ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Training...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Train Model
              </>
            )}
          </button>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Dataset Requirements:</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Excel file with columns for comments and categories</li>
              <li>• Comment column should contain "comment", "update", or similar keywords</li>
              <li>• Category column should contain "kategori", "category", or "class"</li>
              <li>• Minimum 2 samples per category</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Model is trained */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-green-900">Model is Trained</h3>
                <p className="text-xs text-green-700">
                  {modelInfo.n_classes} classes • {modelInfo.n_features} features
                </p>
              </div>
            </div>
            {modelInfo.accuracy && (
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <p className="text-xs text-gray-600 mb-1">Accuracy</p>
                <p className="text-lg font-bold text-green-700">
                  {(modelInfo.accuracy * 100).toFixed(2)}%
                </p>
              </div>
            )}
            {modelInfo.oob_score && (
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <p className="text-xs text-gray-600 mb-1">Out-of-Bag Score</p>
                <p className="text-lg font-bold text-green-700">
                  {(modelInfo.oob_score * 100).toFixed(2)}%
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onRefresh}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={onDeleteModel}
              className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>

          {/* Retrain Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-yellow-900 mb-2">Want to retrain?</h3>
            <p className="text-xs text-yellow-800">
              Delete the current model first to train with a new dataset.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
