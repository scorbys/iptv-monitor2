"use client";

import { useState } from 'react';

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

interface MLResultsProps {
  predictions: PredictionResult[];
}

export default function MLResults({ predictions }: MLResultsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (predictions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Predictions Yet</h3>
        <p className="text-gray-500 text-sm">
          Make a prediction to see results here
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Prediction Results</h2>
        <span className="bg-blue-100 border border-blue-200 rounded-lg px-3 py-1 text-blue-700 text-sm font-medium">
          {predictions.length} prediction{predictions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {predictions.map((prediction, index) => (
          <div
            key={index}
            className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
          >
            {/* Header - Always Visible */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-medium line-clamp-1 mb-1">
                    {prediction.text}
                  </p>
                  <p className="text-gray-500 text-sm line-clamp-1">
                    {prediction.cleaned_text}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Predicted Category</p>
                    <p className="text-lg font-bold text-green-600">
                      {prediction.predicted_label}
                    </p>
                  </div>

                  <button
                    className={`text-gray-400 hover:text-gray-600 transition-transform ${
                      expandedIndex === index ? 'rotate-180' : ''
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedIndex === index && (
              <div className="border-t border-gray-200 p-4 space-y-4 bg-white">
                {/* Probabilities */}
                {prediction.probabilities && prediction.probabilities.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Top Probabilities
                    </h4>
                    <div className="space-y-2">
                      {prediction.probabilities.map((prob, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-32 flex-shrink-0 font-medium">
                            {prob.label}
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 transition-all"
                              style={{ width: `${prob.probability * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-700 w-16 text-right flex-shrink-0 font-semibold">
                            {(prob.probability * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Text Features
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-gray-600 mb-1">Text Length</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {prediction.features.text_len}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                      <p className="text-xs text-gray-600 mb-1">Word Count</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {prediction.features.word_count}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preprocessed Text */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Preprocessed Text
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-sm text-gray-700">
                      {prediction.cleaned_text}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Clear All Button */}
      {predictions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              if (confirm('Clear all prediction results?')) {
                predictions.length = 0;
              }
            }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All Results
          </button>
        </div>
      )}
    </div>
  );
}
