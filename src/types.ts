export interface SummaryStats {
  total_records: number;
  total_features: number;
  missing_cells: number;
  duplicate_rows: number;
  safe_samples: number;
  unsafe_samples: number;
  safe_percentage: number;
}

export interface UnsafeParameter {
  parameter: string;
  value: number;
  condition: "LOW" | "HIGH";
  min: number;
  max: number;
  unit: string;
  description: string;
}

export interface PredictionData {
  id?: number;
  ph: number | null;
  hardness: number;
  solids: number;
  chloramines: number;
  sulfate: number;
  conductivity: number;
  organic_carbon: number;
  trihalomethanes: number;
  turbidity: number;
  prediction: number;
  confidence_score: number;
  risk_level: "Low" | "Medium" | "High" | "Very High";
  unsafe_parameters: UnsafeParameter[];
  recommendation: string[];
  timestamp?: string;
}

export interface MetricDetail {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  cv_score: number;
  train_time: number;
  predict_time: number;
  confusion_matrix: number[][];
  classification_report: Record<string, any>;
}

export interface ModelMetricsResponse {
  best_model_name: string;
  metrics: Record<string, MetricDetail>;
  visualizations: {
    accuracy_bar: string;
    radar_chart: string;
    confusion_matrix: string;
    roc_curve: string;
  };
}

export interface FeatureImportance {
  feature: string;
  name: string;
  importance: number;
  percentage: number;
}

export interface EdaPlotDetail {
  image: string;
  title: string;
  observation: string;
  insight: string;
}

export interface EdaResponse {
  stats: {
    shape: [number, number];
    missing_values: Record<string, { count: number; percentage: number }>;
    duplicates: number;
    data_types: Record<string, string>;
    summary_statistics: Record<string, Record<string, number>>;
    skewness: Record<string, number>;
    kurtosis: Record<string, number>;
    variance: Record<string, number>;
    standard_deviation: Record<string, number>;
    covariance: Record<string, Record<string, number>>;
    correlation: Record<string, Record<string, number>>;
    potability_distribution: Record<string, { count: number; percentage: number }>;
    outlier_analysis: Record<string, { count: number; percentage: number; lower_bound: number; upper_bound: number }>;
  };
  plots: {
    potability_distribution: EdaPlotDetail;
    correlation_heatmap: EdaPlotDetail;
    boxplot_outliers: EdaPlotDetail;
    violin_ph: EdaPlotDetail;
    histogram_sulfate: EdaPlotDetail;
    scatter_solids_conductivity: EdaPlotDetail;
  };
}
