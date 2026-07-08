import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  Cpu, 
  Clock, 
  LineChart, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  BarChart4, 
  HelpCircle,
  TrendingUp,
  Award,
  Zap,
  Check
} from "lucide-react";
import { ModelMetricsResponse, MetricDetail } from "../types";

interface ModelComparisonTabProps {
  metrics: ModelMetricsResponse | null;
  isLoading: boolean;
}

export default function ModelComparisonTab({ metrics, isLoading }: ModelComparisonTabProps) {
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [activeVisualTab, setActiveVisualTab] = useState<string>("accuracy_bar");

  // Automatically select the best model when metrics are loaded
  useEffect(() => {
    if (metrics?.best_model_name) {
      setSelectedModel(metrics.best_model_name);
    } else if (metrics?.metrics && Object.keys(metrics.metrics).length > 0) {
      setSelectedModel(Object.keys(metrics.metrics)[0]);
    }
  }, [metrics]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 rounded-2xl"></div>
          <div className="h-96 bg-slate-200 rounded-2xl"></div>
        </div>
        <div className="h-96 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (!metrics || !metrics.metrics || Object.keys(metrics.metrics).length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-lg mx-auto mt-12">
        <Cpu className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">No Comparison Metrics Available</h3>
        <p className="text-sm text-slate-500 mb-6">
          The machine learning models haven't finished training, or the comparison data is missing.
        </p>
      </div>
    );
  }

  const modelNames = Object.keys(metrics.metrics);
  
  // Sort models by F1-Score to create a leaderboard
  const sortedModels = [...modelNames].sort((a, b) => {
    return metrics.metrics[b].f1_score - metrics.metrics[a].f1_score;
  });

  const bestModel = metrics.best_model_name;
  const currentModelData = metrics.metrics[selectedModel] || metrics.metrics[bestModel];

  // Map backend visualization keys to clean labels and descriptions
  const visualTabs = [
    { id: "accuracy_bar", label: "F1 & Accuracy Bar", desc: "Overall performance comparison across all 9 classifiers" },
    { id: "radar_chart", label: "Polar Radar (Top 3)", desc: "Multi-metric comparison of the 3 highest performing models" },
    { id: "roc_curve", label: "ROC Curves", desc: "Trade-off between true-positive and false-positive rates" },
    { id: "confusion_matrix", label: "Confusion Matrix", desc: `True/false prediction ratios for ${bestModel}` }
  ];

  const getVisualImage = (tabId: string) => {
    switch(tabId) {
      case "accuracy_bar": return metrics.visualizations.accuracy_bar;
      case "radar_chart": return metrics.visualizations.radar_chart;
      case "roc_curve": return metrics.visualizations.roc_curve;
      case "confusion_matrix": return metrics.visualizations.confusion_matrix;
      default: return "";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Trophy className="w-40 h-40" />
        </div>
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-mono font-semibold border border-blue-500/30">
              <Award className="w-3.5 h-3.5" />
              <span>TRAINED ONCE & LOCKED</span>
            </div>
            {metrics.trained_at && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-mono font-semibold border border-emerald-500/30">
                <Clock className="w-3 h-3" />
                <span>PIPELINE LOADED: {metrics.trained_at}</span>
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight font-display">Systematic Model Leaderboard</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            The system evaluated 9 distinct machine learning algorithms on 5-fold cross-validation
            and independent test subsets. Models are trained only once, with the optimal pipeline automatically preserved as the active evaluator.
          </p>
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Side: Leaderboard Table (Col-Span 2) */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 font-display">Classifier Performance Leaderboard</h3>
            <p className="text-xs text-slate-500">Models sorted by test F1-Score. Click any model row to load comprehensive metrics.</p>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                  <th className="py-3 px-2">Rank</th>
                  <th className="py-3 px-2">Model Name</th>
                  <th className="py-3 px-2 text-right">F1-Score</th>
                  <th className="py-3 px-2 text-right">Accuracy</th>
                  <th className="py-3 px-2 text-right">Precision</th>
                  <th className="py-3 px-2 text-right">Recall</th>
                  <th className="py-3 px-2 text-right">CV Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedModels.map((name, index) => {
                  const item = metrics.metrics[name];
                  const isBest = name === bestModel;
                  const isSelected = name === selectedModel;
                  
                  return (
                    <tr 
                      key={name}
                      onClick={() => setSelectedModel(name)}
                      className={`group hover:bg-slate-50/80 transition-colors cursor-pointer text-xs ${
                        isSelected ? "bg-blue-50/50 font-medium text-blue-900" : "text-slate-600"
                      }`}
                    >
                      <td className="py-3.5 px-2">
                        <div className="flex items-center gap-2">
                          {index === 0 ? (
                            <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 font-bold flex items-center justify-center text-[10px] border border-amber-200">
                              🥇
                            </span>
                          ) : index === 1 ? (
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                              🥈
                            </span>
                          ) : index === 2 ? (
                            <span className="w-5 h-5 rounded-full bg-orange-50 text-orange-600 font-bold flex items-center justify-center text-[10px] border border-orange-200">
                              🥉
                            </span>
                          ) : (
                            <span className="w-5 h-5 font-mono text-slate-400 flex items-center justify-center">
                              {index + 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-2 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span className={isSelected ? "text-blue-700" : "text-slate-900 group-hover:text-blue-700 transition-colors"}>
                            {name}
                          </span>
                          {isBest && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 bg-blue-600 text-white rounded font-mono">
                              BEST
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono font-bold">
                        <span className={isBest ? "text-slate-900" : "text-slate-500"}>
                          {item.f1_score.toFixed(4)}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono text-slate-500">
                        {item.accuracy.toFixed(4)}
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono text-slate-500">
                        {item.precision.toFixed(4)}
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono text-slate-500">
                        {item.recall.toFixed(4)}
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono text-slate-500">
                        {item.cv_score.toFixed(4)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Detailed Model Card (Col-Span 1) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Model Profile</span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-semibold">
                ID: #{sortedModels.indexOf(selectedModel) + 1}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 truncate font-display mb-1" title={selectedModel}>
              {selectedModel}
            </h3>
            <p className="text-[11px] text-slate-400 italic mb-5">
              {selectedModel === bestModel 
                ? "This is the active production model selected based on optimal F1-Score."
                : "Secondary baseline model preserved on disk for operational comparison."}
            </p>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* F1 Card */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">F1-Score</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{currentModelData?.f1_score.toFixed(4)}</p>
              </div>
              {/* Accuracy Card */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Accuracy</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{currentModelData?.accuracy.toFixed(4)}</p>
              </div>
              {/* Precision Card */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Precision</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{currentModelData?.precision.toFixed(4)}</p>
              </div>
              {/* Recall Card */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Recall</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{currentModelData?.recall.toFixed(4)}</p>
              </div>
            </div>

            {/* Operational Metrics (Time/CV) */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>5-Fold CV Score</span>
                </div>
                <span className="font-mono font-bold text-slate-800">{currentModelData?.cv_score.toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Training Time</span>
                </div>
                <span className="font-mono font-bold text-slate-800">{currentModelData?.train_time.toFixed(4)}s</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <Zap className="w-3.5 h-3.5 text-slate-400" />
                  <span>Prediction Speed</span>
                </div>
                <span className="font-mono font-bold text-slate-800">{currentModelData?.predict_time.toFixed(4)}s</span>
              </div>
            </div>
          </div>

          {/* Classification Report Sub-panel */}
          <div className="border-t border-slate-100 pt-4 mt-6">
            <h4 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wide font-mono">Class Support Ratios</h4>
            
            {currentModelData?.classification_report ? (
              <div className="space-y-3">
                {/* Class 0 (Unsafe) */}
                <div className="bg-slate-50 rounded-lg p-2.5 text-[11px] border border-slate-100">
                  <div className="flex justify-between items-center font-bold text-slate-700 mb-1.5">
                    <span>Class 0: Unsafe Water</span>
                    <span className="text-[10px] font-mono font-normal">Support: {currentModelData.classification_report["0"]?.support || 0}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-slate-500">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-semibold">Precision</p>
                      <p className="font-mono font-bold mt-0.5 text-slate-800">
                        {((currentModelData.classification_report["0"]?.precision || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-semibold">Recall</p>
                      <p className="font-mono font-bold mt-0.5 text-slate-800">
                        {((currentModelData.classification_report["0"]?.recall || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-semibold">F1-Score</p>
                      <p className="font-mono font-bold mt-0.5 text-slate-800">
                        {((currentModelData.classification_report["0"]?.["f1-score"] || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Class 1 (Safe) */}
                <div className="bg-slate-50 rounded-lg p-2.5 text-[11px] border border-slate-100">
                  <div className="flex justify-between items-center font-bold text-slate-700 mb-1.5">
                    <span>Class 1: Safe Drinking</span>
                    <span className="text-[10px] font-mono font-normal">Support: {currentModelData.classification_report["1"]?.support || 0}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-slate-500">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-semibold">Precision</p>
                      <p className="font-mono font-bold mt-0.5 text-slate-800">
                        {((currentModelData.classification_report["1"]?.precision || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-semibold">Recall</p>
                      <p className="font-mono font-bold mt-0.5 text-slate-800">
                        {((currentModelData.classification_report["1"]?.recall || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-mono font-semibold">F1-Score</p>
                      <p className="font-mono font-bold mt-0.5 text-slate-800">
                        {((currentModelData.classification_report["1"]?.["f1-score"] || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-2">Detailed class report missing</p>
            )}
          </div>
        </div>
      </div>

      {/* Visual Charts Comparison Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-base font-bold text-slate-900 font-display">Matplotlib Analytics Outputs</h3>
          <p className="text-xs text-slate-500">Visual graphics rendered directly by Scikit-Learn during the initial validation loop.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap border-b border-slate-100 gap-1.5 mb-6">
          {visualTabs.map((tab) => {
            const isActive = activeVisualTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`visual-tab-${tab.id}`}
                onClick={() => setActiveVisualTab(tab.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 text-left ${
                  isActive 
                    ? "border-blue-600 text-blue-700 bg-blue-50/10 font-bold" 
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Selected Image Render */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col items-center">
          <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold font-mono text-center mb-4">
            {visualTabs.find(t => t.id === activeVisualTab)?.desc}
          </p>

          <div className="w-full max-w-4xl bg-white p-4 rounded-xl shadow-inner border border-slate-200">
            {getVisualImage(activeVisualTab) ? (
              <img 
                src={`data:image/png;base64,${getVisualImage(activeVisualTab)}`}
                alt={visualTabs.find(t => t.id === activeVisualTab)?.label}
                className="w-full h-auto object-contain max-h-[500px]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                Image graphic not loaded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
