"use client";

import { useState } from 'react';

interface MLPredictionFormProps {
  onPredict: (text: string) => void;
  disabled?: boolean;
}

export default function MLPredictionForm({ onPredict, disabled }: MLPredictionFormProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) return;

    setLoading(true);
    try {
      await onPredict(text);
      setText('');
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const exampleTexts = [
    'access point broken',
    'channel not found',
    'HDMI no signal',
    'wifi connection slow',
    'Chromecast not working',
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Prediction</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Text Input */}
        <div>
          <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-2">
            Enter Comment Text
          </label>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={disabled || loading}
            placeholder="Type a comment to predict its category..."
            rows={4}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed resize-none transition-all"
          />
        </div>

        {/* Example Texts */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Quick examples:</p>
          <div className="flex flex-wrap gap-2">
            {exampleTexts.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setText(example)}
                disabled={disabled || loading}
                className="text-xs bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-3 py-1.5 text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={disabled || loading || !text.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Predicting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Predict Category
            </>
          )}
        </button>

        {disabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-yellow-700">
              Train a model first to enable predictions
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
