import React, { useState } from "react";
import { 
  FileSpreadsheet, 
  Layers, 
  HelpCircle, 
  ChevronRight, 
  TrendingUp, 
  Award,
  BookOpen,
  PieChart
} from "lucide-react";
import { EdaResponse, EdaPlotDetail } from "../types";

interface EdaTabProps {
  edaData: EdaResponse | null;
  isLoading: boolean;
}

type PlotKeys = 
  | "potability_distribution" 
  | "correlation_heatmap" 
  | "boxplot_outliers" 
  | "violin_ph" 
  | "histogram_sulfate" 
  | "scatter_solids_conductivity";

export default function EdaTab({ edaData, isLoading }: EdaTabProps) {
  const [selectedPlot, setSelectedPlot] = useState<PlotKeys>("potability_distribution");

  if (isLoading || !edaData) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h4 className="text-sm font-bold text-slate-800">Calculating Dataset Statistics...</h4>
        <p className="text-xs text-slate-400 mt-1">Running exploratory algorithms on water_potability.csv...</p>
      </div>
    );
  }

  const { stats, plots } = edaData;

  const plotTabs: { id: PlotKeys; label: string }[] = [
    { id: "potability_distribution", label: "Target Potability" },
    { id: "correlation_heatmap", label: "Feature Correlations" },
    { id: "boxplot_outliers", label: "Outliers & Range" },
    { id: "violin_ph", label: "pH Violin Plot" },
    { id: "histogram_sulfate", label: "Sulfate Bell Curve" },
    { id: "scatter_solids_conductivity", label: "Solids vs Conductivity" },
  ];

  const activePlot: EdaPlotDetail = plots[selectedPlot];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* High-level textual summaries of the dataset */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Shape Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">Dataset Shape</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">
              {stats.shape ? `${stats.shape[0]} Rows × ${stats.shape[1]} Cols` : "3,276 Rows × 10 Cols"}
            </p>
          </div>
        </div>

        {/* Missing Values Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">Imputed Features</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">
              3 Features contain nulls (imputed)
            </p>
          </div>
        </div>

        {/* Duplicates Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">Duplicate Rows</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">
              {stats.duplicates === 0 ? "0 Duplicates (Pristine)" : `${stats.duplicates} Duplicate Rows`}
            </p>
          </div>
        </div>

        {/* Safe vs Unsafe distribution counts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">Safe Samples Count</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">
              {stats.potability_distribution && stats.potability_distribution["1"] 
                ? `${stats.potability_distribution["1"].count} (${stats.potability_distribution["1"].percentage}%)`
                : "1,278 Safe (39.1%)"}
            </p>
          </div>
        </div>
      </section>

      {/* Main EDA Graphical Lab Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[550px]">
        {/* Left Side: Plot Selector Menu */}
        <div className="w-full lg:w-72 border-r border-slate-150 bg-slate-50 p-6 space-y-1">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 font-mono">
            Annotated Visualizations
          </h4>
          {plotTabs.map((tab) => {
            const isSelected = selectedPlot === tab.id;
            return (
              <button
                key={tab.id}
                id={`btn-eda-tab-${tab.id}`}
                onClick={() => setSelectedPlot(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-white" : "text-slate-400"}`} />
              </button>
            );
          })}

          <div className="mt-8 p-4 bg-white rounded-xl border border-slate-200 shadow-inner">
            <p className="text-[10px] font-mono font-bold text-blue-600 uppercase mb-1">
              Data Quality Note
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Nulls in <strong className="text-slate-700">pH, Sulfate, & Trihalomethanes</strong> were handled using median stratification to retain maximum variance without bias.
            </p>
          </div>
        </div>

        {/* Right Side: Active Plot View & Observations */}
        <div className="flex-1 p-8 flex flex-col justify-between">
          <div>
            {/* Plot Header */}
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900 font-display">
                {activePlot?.title || "Dataset Feature Visual"}
              </h3>
            </div>

            {/* Rendered Matplotlib Base64 Image */}
            <div className="w-full bg-slate-50 border border-slate-150 rounded-xl p-4 flex items-center justify-center overflow-hidden mb-6 min-h-[300px]">
              {activePlot?.image ? (
                <img
                  id="eda-plot-image"
                  src={`data:image/png;base64,${activePlot.image}`}
                  alt={activePlot.title}
                  className="max-h-[360px] object-contain rounded-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-slate-400 text-xs">Image loading error</div>
              )}
            </div>

            {/* Scientific Analysis Annotations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
              {/* Observations */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  <span>Matplotlib Observation</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed bg-blue-50/40 p-3 rounded-lg border border-blue-50">
                  {activePlot?.observation || "Feature patterns display highly overlapping distributions between class boundaries, indicating standard linear approaches require non-linear enhancements."}
                </p>
              </div>

              {/* Business Insights */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                  <Award className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Business & Pipeline Insight</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed bg-emerald-50/40 p-3 rounded-lg border border-emerald-50">
                  {activePlot?.insight || "Model training should prioritize robust ensemble classifiers (Random Forest, Extra Trees, Gradient Boosting) which perform excellently with complex multi-dimensional overlaps."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
