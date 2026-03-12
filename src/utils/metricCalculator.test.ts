// Test file for UI utility functions
// NOTE: Business logic (label calculations, categorization) is now in backend
// This file only tests UI helper functions
import {
  getLabelColorClass,
  getLabelBadgeStyle,
  formatMetricValue,
  getMetricIcon,
  getStatusBadgeClass,
  type MetricLabel
} from './metricCalculator';

console.log('=== Testing Frontend UI Utilities ===\n');

// Mock label objects for testing
const mockLabels: Record<string, MetricLabel> = {
  green: { label: 5, category: "Excellent", color: "green", description: "Optimal" },
  blue: { label: 4, category: "Good", color: "blue", description: "Acceptable" },
  yellow: { label: 3, category: "Fair", color: "yellow", description: "Needs attention" },
  orange: { label: 2, category: "Poor", color: "orange", description: "Degraded" },
  red: { label: 1, category: "Very Poor", color: "red", description: "Critical" }
};

// Test color class functions
console.log('Testing Label Color Classes:');
console.log('Green:', getLabelColorClass(mockLabels.green));
console.log('Blue:', getLabelColorClass(mockLabels.blue));
console.log('Yellow:', getLabelColorClass(mockLabels.yellow));
console.log('Orange:', getLabelColorClass(mockLabels.orange));
console.log('Red:', getLabelColorClass(mockLabels.red));

// Test badge style functions
console.log('\nTesting Badge Styles:');
console.log('Green badge:', getLabelBadgeStyle(mockLabels.green));
console.log('Blue badge:', getLabelBadgeStyle(mockLabels.blue));
console.log('Yellow badge:', getLabelBadgeStyle(mockLabels.yellow));
console.log('Orange badge:', getLabelBadgeStyle(mockLabels.orange));
console.log('Red badge:', getLabelBadgeStyle(mockLabels.red));

// Test format metric value
console.log('\nTesting Metric Value Formatting:');
console.log('Latency 45ms:', formatMetricValue(45, 'ms'));
console.log('Packet loss 0.5%:', formatMetricValue(0.5, '%'));
console.log('Null value:', formatMetricValue(null, 'ms'));
console.log('Recovery time 3.5s:', formatMetricValue(3.5, 's'));

// Test metric icons
console.log('\nTesting Metric Icons:');
console.log('Latency icon:', getMetricIcon('latency'));
console.log('Jitter icon:', getMetricIcon('jitter'));
console.log('Packet loss icon:', getMetricIcon('packetLoss'));
console.log('Error icon:', getMetricIcon('error'));
console.log('Recovery time icon:', getMetricIcon('recoveryTime'));

// Test status badge
console.log('\nTesting Status Badge:');
console.log('Online:', getStatusBadgeClass('online'));
console.log('Offline:', getStatusBadgeClass('offline'));

console.log('\n=== All UI Utility Tests Completed ===\n');

console.log('NOTE: Business logic (label calculations, categorization) has moved to backend.');
console.log('Backend: backend/utils/metricCalculator.js');
console.log('Frontend: Only UI helpers (colors, formatting, icons)');
