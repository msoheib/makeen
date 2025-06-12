// Chart utility functions for data validation and formatting

export interface ChartDataset {
  data: number[];
  color?: (opacity?: number) => string;
  strokeWidth?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
  legend?: string[];
}

/**
 * Validates and formats chart data to prevent crashes
 */
export const validateChartData = (data: any): ChartData | null => {
  // Check if data exists and has required properties
  if (!data || typeof data !== 'object') {
    return null;
  }

  // Validate labels array
  if (!Array.isArray(data.labels) || data.labels.length === 0) {
    return null;
  }

  // Validate datasets array
  if (!Array.isArray(data.datasets) || data.datasets.length === 0) {
    return null;
  }

  // Validate each dataset
  const validDatasets = data.datasets.filter((dataset: any) => {
    return dataset && 
           Array.isArray(dataset.data) && 
           dataset.data.length > 0 &&
           dataset.data.every((value: any) => typeof value === 'number' && !isNaN(value));
  });

  if (validDatasets.length === 0) {
    return null;
  }

  // Return validated data structure
  return {
    labels: data.labels,
    datasets: validDatasets,
    legend: data.legend || []
  };
};

/**
 * Creates default empty chart data
 */
export const createEmptyChartData = (labelCount: number = 6): ChartData => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return {
    labels: months.slice(0, labelCount),
    datasets: [{
      data: new Array(labelCount).fill(0),
      color: (opacity = 1) => `rgba(158, 158, 158, ${opacity})`,
      strokeWidth: 2,
    }],
    legend: ['No Data']
  };
};

/**
 * Formats currency values for Saudi Riyal
 */
export const formatSAR = (amount: number): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formats percentage values
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
}; 