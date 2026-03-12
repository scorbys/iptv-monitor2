// UI Utility functions for displaying metric labels
// This module only handles presentation logic - all metric calculations are done on the backend

export interface MetricLabel {
  label: number;
  category: string;
  color: string;
  description: string;
}

export interface ChannelMetrics {
  packetLoss: number;
  latency: number;
  jitter: number;
  error: number;
  recoveryTime: number;
}

export interface LabeledMetrics extends ChannelMetrics {
  packetLossLabel: MetricLabel;
  latencyLabel: MetricLabel;
  jitterLabel: MetricLabel;
  errorLabel: MetricLabel;
  recoveryTimeLabel: MetricLabel;
  overallLabel: MetricLabel;
}

/**
 * Get Tailwind CSS color classes for metric labels
 * Used for styling metric displays in the UI
 * @param label - Metric label object
 * @returns string of Tailwind CSS classes
 */
export function getLabelColorClass(label: MetricLabel): string {
  switch (label.color) {
    case "green":
      return "text-green-700 bg-green-50 border-green-200";
    case "blue":
      return "text-blue-700 bg-blue-50 border-blue-200";
    case "yellow":
      return "text-yellow-700 bg-yellow-50 border-yellow-200";
    case "orange":
      return "text-orange-700 bg-orange-50 border-orange-200";
    case "red":
      return "text-red-700 bg-red-50 border-red-200";
    default:
      return "text-gray-700 bg-gray-50 border-gray-200";
  }
}

/**
 * Get badge style classes for metric labels
 * Used for styling badges and chips in the UI
 * @param label - Metric label object
 * @returns string of Tailwind CSS classes for badges
 */
export function getLabelBadgeStyle(label: MetricLabel): string {
  switch (label.color) {
    case "green":
      return "bg-green-100 text-green-800 border-green-200";
    case "blue":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "yellow":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "orange":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "red":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

/**
 * Get color class for progress bars
 * @param label - Metric label object
 * @returns string of Tailwind CSS classes for progress bars
 */
export function getProgressBarColor(label: MetricLabel): string {
  switch (label.color) {
    case "green":
      return "bg-green-500";
    case "blue":
      return "bg-blue-500";
    case "yellow":
      return "bg-yellow-500";
    case "orange":
      return "bg-orange-500";
    case "red":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

/**
 * Get text color class for metric values
 * @param label - Metric label object
 * @returns string of Tailwind CSS classes for text color
 */
export function getLabelTextColor(label: MetricLabel): string {
  switch (label.color) {
    case "green":
      return "text-green-600";
    case "blue":
      return "text-blue-600";
    case "yellow":
      return "text-yellow-600";
    case "orange":
      return "text-orange-600";
    case "red":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

/**
 * Format metric value for display
 * @param value - Raw metric value
 * @param unit - Unit of measurement (ms, %, s, etc.)
 * @returns Formatted string with value and unit
 */
export function formatMetricValue(value: number | null, unit: string = ""): string {
  if (value === null || value === undefined) {
    return "N/A";
  }

  // Round to appropriate decimal places
  let formattedValue: string;
  if (unit === "%") {
    formattedValue = value.toFixed(1);
  } else if (unit === "s") {
    formattedValue = value.toFixed(1);
  } else {
    formattedValue = Math.round(value).toString();
  }

  return unit ? `${formattedValue}${unit}` : formattedValue;
}

/**
 * Get metric icon based on metric type
 * @param metricType - Type of metric (latency, jitter, packetLoss, etc.)
 * @returns Icon name or emoji
 */
export function getMetricIcon(metricType: string): string {
  const icons: Record<string, string> = {
    latency: "⚡",
    jitter: "📊",
    packetLoss: "📉",
    error: "❌",
    recoveryTime: "🔄",
    signalStrength: "📶",
    bandwidth: "💾"
  };

  return icons[metricType] || "📊";
}

/**
 * Get status badge class for device status
 * @param status - Device status (online, offline)
 * @returns string of Tailwind CSS classes
 */
export function getStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case "online":
      return "bg-green-100 text-green-800 border-green-200";
    case "offline":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

/**
 * Calculate quality score for individual metric based on thresholds
 * @param value - Metric value
 * @param metricType - Type of metric (packetLoss, latency, jitter, error, recoveryTime)
 * @returns Score from 1 (Very Poor) to 5 (Excellent)
 */
export function calculateMetricScore(value: number, metricType: keyof ChannelMetrics): number {
  switch (metricType) {
    case 'packetLoss':
      if (value < 1) return 5;      // Excellent
      if (value <= 2) return 4;     // Good
      if (value <= 5) return 3;     // Fair
      if (value <= 10) return 2;    // Poor
      return 1;                     // Very Poor (>10%)

    case 'latency':
      if (value < 50) return 5;     // Excellent
      if (value <= 100) return 4;   // Good
      if (value <= 200) return 3;   // Fair
      if (value <= 500) return 2;   // Poor
      return 1;                     // Very Poor (>500ms)

    case 'jitter':
      if (value < 30) return 5;     // Excellent
      if (value <= 50) return 4;    // Good
      if (value <= 100) return 3;   // Fair
      if (value <= 200) return 2;   // Poor
      return 1;                     // Very Poor (>200ms)

    case 'error':
      if (value <= 2) return 5;     // Excellent
      if (value <= 5) return 4;     // Good
      if (value <= 10) return 3;    // Fair
      if (value <= 20) return 2;    // Poor
      return 1;                     // Very Poor (>20%)

    case 'recoveryTime':
      if (value < 5) return 5;      // Excellent
      if (value <= 10) return 4;    // Good
      if (value <= 20) return 3;    // Fair
      if (value <= 30) return 2;    // Poor
      return 1;                     // Very Poor (>30s)

    default:
      return 3; // Default to Fair
  }
}

/**
 * Get quality label text based on score
 * @param score - Score from 1 to 5
 * @returns Quality label text
 */
export function getQualityLabelText(score: number): string {
  switch (score) {
    case 5: return 'Excellent';
    case 4: return 'Good';
    case 3: return 'Fair';
    case 2: return 'Poor';
    case 1: return 'Very Poor';
    default: return 'Unknown';
  }
}

/**
 * Calculate overall quality score from all metrics
 * @param metrics - Channel metrics object
 * @returns Overall quality score from 1 to 5
 */
export function calculateOverallQualityScore(metrics: ChannelMetrics): number {
  if (!metrics || typeof metrics !== 'object') {
    return 1; // Very Poor if no metrics
  }

  const scores = [
    calculateMetricScore(metrics.packetLoss || 0, 'packetLoss'),
    calculateMetricScore(metrics.latency || 0, 'latency'),
    calculateMetricScore(metrics.jitter || 0, 'jitter'),
    calculateMetricScore(metrics.error || 0, 'error'),
    calculateMetricScore(metrics.recoveryTime || 0, 'recoveryTime')
  ];

  // Calculate average (round to nearest integer)
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(average);
}

/**
 * Get color class for quality score
 * @param score - Score from 1 to 5
 * @returns Tailwind CSS color class
 */
export function getQualityScoreColor(score: number): string {
  switch (score) {
    case 5: return 'text-green-600 bg-green-50 border-green-200';
    case 4: return 'text-blue-600 bg-blue-50 border-blue-200';
    case 3: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 2: return 'text-orange-600 bg-orange-50 border-orange-200';
    case 1: return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}
