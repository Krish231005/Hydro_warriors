import React from "react";
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3, 
  TrendingUp, 
  Sparkles,
  Info,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { SummaryStats, FeatureImportance } from "../types";

interface DashboardTabProps {
  summary: SummaryStats | null;
  bestModelName: string;
  bestModelF1: number;
  importances: FeatureImportance[];
  onTriggerRetrain: () => void;
  isRetraining: boolean;
  onNavigateToPredict: () => void;
}

export default function DashboardTab({
  summary,
  bestModelName,
  bestModelF1,
  importances,
  onTriggerRetrain,
  isRetraining,
  onNavigateToPredict
}: DashboardTabProps) {
  
  // Format long model name for layout
  const formattedModelName = bestModelName 
    ? bestModelName.replace("Classifier", "").trim()
    : "Random Forest";

  // Standard safe limits to list in side panel
  const parameterStandards = [
    { name: "pH (Acidity)", limit: "6.5 - 8.5", status: "Monitor", color: "blue" },
    { name: "Hardness", limit: "< 250 mg/L", status: "Alert", color: "amber" },
    { name: "Sulfate", limit: "< 250 mg/L", status: "Critical", color: "red" },
    { name: "Trihalomethanes", limit: "< 80 ppb", status: "Monitor", color: "blue" },
    { name: "Turbidity", limit: "< 5.0 NTU", status: "Critical", color: "red" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 4 Core Summary KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Samples Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-100 font-mono">
              +100% RAW
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Samples</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 font-display">
              {summary ? summary.total_records.toLocaleString() : "3,276"}
            </h3>
          </div>
        </div>

        {/* Potability Rate Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 font-mono">
              POTABLE
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Potability Rate</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 font-display">
              {summary ? `${summary.safe_percentage}%` : "39.1%"}
            </h3>
          </div>
        </div>

        {/* Hazard/Risk Counter Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100 font-mono">
              HIGH RISK
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Non-Potable Samples</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 font-display">
              {summary ? summary.unsafe_samples.toLocaleString() : "1,998"}
            </h3>
          </div>
        </div>

        {/* Validation Score Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 font-mono">
              F1 METRIC
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">F1 validation Score</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 font-display">
              {bestModelF1 ? bestModelF1.toFixed(3) : "0.684"}
            </h3>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feature Importance Column (Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
            <div>
              <h4 className="text-base font-bold text-slate-900 font-display">Chemical Feature Importances</h4>
              <p className="text-xs text-slate-400">Relative weight contribution calculated by the {formattedModelName} model</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                id="btn-retrain-dashboard"
                onClick={onTriggerRetrain}
                disabled={isRetraining}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 font-mono"
              >
                {isRetraining ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Sparkles className="w-3 h-3 text-blue-400" />
                )}
                {isRetraining ? "RETRAINING..." : "FORCE RETRAIN"}
              </button>
            </div>
          </div>

          {/* Render bar charts */}
          <div className="flex-1 space-y-4">
            {importances && importances.length > 0 ? (
              importances.map((item, index) => (
                <div key={item.feature} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">{item.name}</span>
                    <span className="font-mono text-slate-500 font-bold">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        index === 0 ? "bg-blue-600" :
                        index === 1 ? "bg-blue-500" :
                        index === 2 ? "bg-indigo-500" :
                        index === 3 ? "bg-teal-500" : "bg-slate-400"
                      }`}
                      style={{ width: `${item.percentage * 4}%` }} // Multiply to give visual scale if percentages are small
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              // Fallback default mockup indicators
              <div className="space-y-4">
                {[
                  { name: "Sulfate", pct: 15.4 },
                  { name: "pH Level", pct: 14.1 },
                  { name: "Solids (TDS)", pct: 12.8 },
                  { name: "Hardness", pct: 11.2 },
                  { name: "Chloramines", pct: 9.8 }
                ].map((item, index) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">{item.name}</span>
                      <span className="font-mono text-slate-500 font-bold">{item.pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${index < 3 ? "bg-blue-600" : "bg-slate-400"}`}
                        style={{ width: `${item.pct * 4}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 mt-6 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            <span>Critical Indicator</span>
            <span>Secondary Solutes</span>
            <span>Aqueous Baselines</span>
          </div>
        </div>

        {/* Regulatory Guidelines/WHO Standards Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-slate-500" />
              <h4 className="text-base font-bold text-slate-900 font-display">EPA/WHO Safe Bounds</h4>
            </div>
            
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Standard chemical and physical parameters required to classify fresh water sources as drinking water (potable).
            </p>

            <div className="space-y-4">
              {parameterStandards.map((param) => (
                <div key={param.name} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{param.name}</p>
                    <p className="text-[10px] font-mono text-slate-400 font-semibold">Limit: {param.limit}</p>
                  </div>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                    param.color === "red" ? "bg-red-50 text-red-700 border border-red-100" :
                    param.color === "amber" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                    "bg-blue-50 text-blue-700 border border-blue-100"
                  }`}>
                    {param.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button 
            id="btn-navigate-predict"
            onClick={onNavigateToPredict}
            className="w-full py-2.5 mt-6 border border-blue-200 hover:border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-xs font-bold text-blue-700 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
          >
            Analyze Custom Sample
          </button>
        </div>
      </div>
    </div>
  );
}
