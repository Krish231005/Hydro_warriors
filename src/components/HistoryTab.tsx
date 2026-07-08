import React, { useState } from "react";
import { 
  Search, 
  Trash2, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  Droplet, 
  ShieldCheck, 
  ShieldAlert,
  Download,
  AlertTriangle,
  Layers
} from "lucide-react";
import { PredictionData } from "../types";

interface HistoryTabProps {
  history: PredictionData[];
  onDeleteRecord: (id: number) => void;
  onClearAll: () => void;
  isLoading: boolean;
  filter: {
    search: string;
    potability: string;
    risk: string;
    sortBy: string;
    order: string;
  };
  setFilter: React.Dispatch<React.SetStateAction<any>>;
  onRefresh: () => void;
}

export default function HistoryTab({
  history,
  onDeleteRecord,
  onClearAll,
  isLoading,
  filter,
  setFilter,
  onRefresh
}: HistoryTabProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleSearchChange = (val: string) => {
    setFilter((prev: any) => ({ ...prev, search: val }));
  };

  const handleFilterChange = (key: string, val: string) => {
    setFilter((prev: any) => ({ ...prev, [key]: val }));
  };

  const handleSortToggle = () => {
    setFilter((prev: any) => ({
      ...prev,
      order: prev.order === "DESC" ? "ASC" : "DESC"
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by values, recommendation text, or custom key..."
            value={filter.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 font-medium outline-none transition-all"
          />
        </div>

        {/* Multi-Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Potability Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filter.potability}
              onChange={(e) => handleFilterChange("potability", e.target.value)}
              className="bg-transparent border-0 text-xs font-semibold text-slate-600 outline-none cursor-pointer"
            >
              <option value="">All Outcomes</option>
              <option value="1">Potable (Safe)</option>
              <option value="0">Unsafe</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filter.risk}
              onChange={(e) => handleFilterChange("risk", e.target.value)}
              className="bg-transparent border-0 text-xs font-semibold text-slate-600 outline-none cursor-pointer"
            >
              <option value="">All Risks</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
              <option value="Very High">Very High Risk</option>
            </select>
          </div>

          {/* Sort Toggler */}
          <button
            onClick={handleSortToggle}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 cursor-pointer transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Sort: {filter.order}</span>
          </button>

          {/* Clear All Database Action */}
          <button
            id="btn-clear-all-history"
            onClick={onClearAll}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span>Wipe Logs</span>
          </button>
        </div>
      </div>

      {/* Grid List of Historical Records */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs text-slate-500 font-bold">Querying prediction logs...</p>
        </div>
      ) : history && history.length > 0 ? (
        <div className="space-y-4">
          {history.map((record) => {
            const isExpanded = expandedId === record.id;
            return (
              <div 
                key={record.id} 
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-sm transition-all overflow-hidden"
              >
                {/* Collapsed Header Bar */}
                <div 
                  onClick={() => toggleExpand(record.id!)}
                  className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-slate-50 select-none"
                >
                  <div className="flex items-center gap-3">
                    {record.prediction === 1 ? (
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">
                          Sample ID #{record.id}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                          record.prediction === 1 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                            : "bg-red-50 text-red-700 border border-red-100"
                        }`}>
                          {record.prediction === 1 ? "POTABLE" : "UNSAFE"}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                          record.risk_level === "Very High" ? "bg-red-50 text-red-700" :
                          record.risk_level === "High" ? "bg-orange-50 text-orange-700" :
                          record.risk_level === "Medium" ? "bg-amber-50 text-amber-700" :
                          "bg-green-50 text-green-700"
                        }`}>
                          {record.risk_level} Risk
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>{record.timestamp ? new Date(record.timestamp).toLocaleString() : "Unknown"}</span>
                        <span className="text-slate-200">|</span>
                        <span>Confidence: {record.confidence_score}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <span className="text-xs font-bold text-blue-600 shrink-0">
                      {isExpanded ? "Collapse Details" : "View Details"}
                    </span>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-5 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                    
                    {/* Chemistry Inputs Summary */}
                    <div className="md:col-span-2 space-y-3">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                        Chemistry Profile (9 Parameters)
                      </h5>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-150 shadow-sm">
                        {[
                          { name: "pH Level", val: record.ph ?? "N/A", unit: "pH" },
                          { name: "Hardness", val: record.hardness, unit: "mg/L" },
                          { name: "Solids", val: record.solids, unit: "ppm" },
                          { name: "Chloramines", val: record.chloramines, unit: "ppm" },
                          { name: "Sulfate", val: record.sulfate, unit: "mg/L" },
                          { name: "Conductivity", val: record.conductivity, unit: "uS/cm" },
                          { name: "Organic Carbon", val: record.organic_carbon, unit: "ppm" },
                          { name: "Trihalomethanes", val: record.trihalomethanes, unit: "ppb" },
                          { name: "Turbidity", val: record.turbidity, unit: "NTU" }
                        ].map((chem) => (
                          <div key={chem.name} className="p-2 border-b border-slate-50 last:border-0 last:pb-0">
                            <p className="text-[10px] text-slate-400 font-bold">{chem.name}</p>
                            <p className="text-xs font-bold text-slate-700 mt-0.5 font-mono">
                              {chem.val} <span className="text-[9px] text-slate-400 uppercase font-medium">{chem.unit}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Violations & treatment comments */}
                    <div className="space-y-4">
                      {/* Safety violations if any */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                          <span>Violated Thresholds</span>
                        </h5>
                        <div className="bg-white rounded-xl border border-slate-150 p-3.5 shadow-sm max-h-36 overflow-y-auto space-y-2">
                          {record.unsafe_parameters && record.unsafe_parameters.length > 0 ? (
                            record.unsafe_parameters.map((p) => (
                              <div key={p.parameter} className="text-xs flex justify-between items-start border-b border-slate-50 last:border-0 pb-1.5 last:pb-0">
                                <span className="capitalize text-slate-700 font-semibold">{p.parameter.replace("_", " ")}</span>
                                <span className="font-mono font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded text-[10px]">
                                  {p.value} ({p.condition})
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-[11px] text-green-700 font-bold text-center py-2">
                              No scientific threshold violations.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Summary Recommendations */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                          Treatments Provided
                        </h5>
                        <div className="bg-white rounded-xl border border-slate-150 p-3 shadow-sm max-h-24 overflow-y-auto text-[10px] text-slate-500 leading-relaxed space-y-1">
                          {record.recommendation && record.recommendation.length > 0 ? (
                            record.recommendation.slice(0, 3).map((rec, i) => (
                              <p key={i} className="line-clamp-1 truncate" title={rec}>
                                • {rec}
                              </p>
                            ))
                          ) : (
                            <p className="italic">No treatments required.</p>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <Calendar className="w-12 h-12 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-700">No Historical Records Found</h4>
          <p className="text-xs text-slate-400 max-w-[280px] mt-1 leading-relaxed">
            There are no logs matching your filter parameters in the database. Run predictions to store them dynamically.
          </p>
          <button
            onClick={onRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm"
          >
            Refresh Database
          </button>
        </div>
      )}

    </div>
  );
}
