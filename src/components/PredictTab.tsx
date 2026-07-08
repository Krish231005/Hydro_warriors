import React from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Droplet, 
  Wrench, 
  ChevronRight, 
  RotateCcw,
  Sparkles,
  HeartPulse
} from "lucide-react";
import { PredictionData } from "../types";

interface PredictTabProps {
  inputs: {
    ph: string;
    Hardness: string;
    Solids: string;
    Chloramines: string;
    Sulfate: string;
    Conductivity: string;
    Organic_carbon: string;
    Trihalomethanes: string;
    Turbidity: string;
  };
  setInputs: React.Dispatch<React.SetStateAction<any>>;
  onPredict: (e: React.FormEvent) => void;
  isPredicting: boolean;
  result: PredictionData | null;
  onClear: () => void;
}

export default function PredictTab({
  inputs,
  setInputs,
  onPredict,
  isPredicting,
  result,
  onClear
}: PredictTabProps) {

  // Field descriptors for forms
  const fields = [
    { key: "ph", label: "pH Level", unit: "pH", placeholder: "6.5 - 8.5", step: "0.01", min: "0", max: "14", desc: "Scientific scale of acidity vs alkalinity." },
    { key: "Hardness", label: "Hardness", unit: "mg/L", placeholder: "100 - 250", step: "0.1", min: "0", max: "1000", desc: "Calcium and magnesium mineral concentrations." },
    { key: "Solids", label: "Total Dissolved Solids", unit: "ppm", placeholder: "0 - 1000", step: "1", min: "0", max: "100000", desc: "Total sum of minerals/salts suspended in water." },
    { key: "Chloramines", label: "Chloramines", unit: "ppm", placeholder: "0.0 - 4.0", step: "0.01", min: "0", max: "20", desc: "Disinfectant compounds safe up to 4.0 ppm." },
    { key: "Sulfate", label: "Sulfate", unit: "mg/L", placeholder: "0 - 250", step: "0.1", min: "0", max: "1000", desc: "Abundant mineral solute; WHO standard is < 250 mg/L." },
    { key: "Conductivity", label: "Conductivity", unit: "μS/cm", placeholder: "0 - 400", step: "1", min: "0", max: "3000", desc: "Electrical conductivity indicating dissolved salts." },
    { key: "Organic_carbon", label: "Total Organic Carbon", unit: "ppm", placeholder: "0.0 - 4.0", step: "0.01", min: "0", max: "40", desc: "Carbon content indicator of organic impurities." },
    { key: "Trihalomethanes", label: "Trihalomethanes", unit: "ppb", placeholder: "0 - 80", step: "0.1", min: "0", max: "300", desc: "Chlorination byproducts; carcinogenic if high." },
    { key: "Turbidity", label: "Turbidity", unit: "NTU", placeholder: "0.0 - 5.0", step: "0.01", min: "0", max: "20", desc: "Cloudiness/clarity indicator of suspended particles." }
  ];

  // Helper presets for fast testing
  const loadSafePreset = () => {
    setInputs({
      ph: "7.25",
      Hardness: "185.3",
      Solids: "810.5",
      Chloramines: "2.95",
      Sulfate: "235.1",
      Conductivity: "370.0",
      Organic_carbon: "2.45",
      Trihalomethanes: "62.4",
      Turbidity: "2.80"
    });
  };

  const loadUnsafePreset = () => {
    setInputs({
      ph: "4.85", // Low pH (acidic)
      Hardness: "310.2", // High hardness
      Solids: "1450.0", // High TDS
      Chloramines: "5.10", // High chloramines
      Sulfate: "380.5", // High sulfate
      Conductivity: "490.0", // High conductivity
      Organic_carbon: "5.40", // High TOC
      Trihalomethanes: "98.3", // High THMs
      Turbidity: "6.12" // High turbidity
    });
  };

  const handleChange = (key: string, val: string) => {
    setInputs((prev: any) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 animate-fade-in">
      
      {/* Left side: Grid Input Form (Span 3) */}
      <div className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          {/* Form Title & Presets */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 pb-4 border-b border-slate-50">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Aqueous Chemistry Form</h3>
              <p className="text-xs text-slate-400">Provide measured physical-chemical water values to trigger evaluation</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                id="btn-preset-safe"
                onClick={loadSafePreset}
                className="px-2.5 py-1.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                PRESET: SAFE
              </button>
              <button
                type="button"
                id="btn-preset-unsafe"
                onClick={loadUnsafePreset}
                className="px-2.5 py-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                PRESET: TOXIC
              </button>
            </div>
          </div>

          {/* Form Elements Grid */}
          <form onSubmit={onPredict} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor={`input-${f.key}`} className="font-bold text-slate-700">{f.label}</label>
                  <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">{f.unit}</span>
                </div>
                <input
                  id={`input-${f.key}`}
                  type="number"
                  step={f.step}
                  min={f.min}
                  max={f.max}
                  placeholder={f.placeholder}
                  value={inputs[f.key as keyof typeof inputs]}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg px-3 py-2 text-sm text-slate-800 font-medium outline-none transition-all"
                  required
                />
                <p className="text-[10px] text-slate-400 leading-snug font-medium line-clamp-1" title={f.desc}>
                  {f.desc}
                </p>
              </div>
            ))}

            <div className="sm:col-span-2 md:col-span-3 pt-6 flex gap-3">
              <button
                type="submit"
                id="btn-submit-predict"
                disabled={isPredicting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-bold shadow-md shadow-blue-100 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPredicting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>CALCULATING...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-blue-200" />
                    <span>ANALYZE WATER POTABILITY</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                id="btn-clear-predict"
                onClick={onClear}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right side: Results Panel (Span 2) */}
      <div className="xl:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[450px]">
        {result ? (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-mono">
              Potability Results
            </h4>

            {/* Prediction Banner Card */}
            {result.prediction === 1 ? (
              <div id="result-safe-card" className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-emerald-800 flex items-start gap-4">
                <div className="p-2.5 bg-emerald-600 text-white rounded-lg shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-emerald-900 font-display">SAFE / POTABLE DRINKING WATER</h4>
                  <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                    This sample passes drinking water safety classifications. Model predicts safe consumption with <strong className="font-mono">{result.confidence_score}%</strong> confidence.
                  </p>
                </div>
              </div>
            ) : (
              <div id="result-unsafe-card" className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-800 flex items-start gap-4">
                <div className="p-2.5 bg-red-600 text-white rounded-lg shadow-sm">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-red-900 font-display">UNSAFE / HAZARDOUS WATER</h4>
                  <p className="text-xs text-red-700 mt-1 leading-relaxed">
                    Aqueous concentrations violate basic chemical standards. Highly recommended to execute mitigation procedures immediately. Confidence: <strong className="font-mono">{result.confidence_score}%</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Risk Level Badge and Violation Summary */}
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white border border-slate-150 rounded-xl p-3 shadow-inner">
                <span className="text-xs font-bold text-slate-600">Rule-Based Risk Rating</span>
                <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                  result.risk_level === "Very High" ? "bg-red-100 text-red-800 border border-red-200" :
                  result.risk_level === "High" ? "bg-orange-100 text-orange-800 border border-orange-200" :
                  result.risk_level === "Medium" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                  "bg-green-100 text-green-800 border border-green-200"
                }`}>
                  {result.risk_level} Risk
                </span>
              </div>

              {/* Chemical Violations List */}
              {result.unsafe_parameters && result.unsafe_parameters.length > 0 ? (
                <div className="space-y-2 bg-white rounded-xl border border-slate-150 p-4 shadow-sm">
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Flagged Violations ({result.unsafe_parameters.length})</span>
                  </p>
                  <div className="max-h-28 overflow-y-auto space-y-2.5 pr-1">
                    {result.unsafe_parameters.map((p) => (
                      <div key={p.parameter} className="text-xs border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                        <div className="flex justify-between items-center">
                          <strong className="text-slate-800 capitalize">
                            {p.parameter.replace("_", " ")}
                          </strong>
                          <span className="font-mono text-red-600 font-bold bg-red-50/50 px-1.5 py-0.5 rounded">
                            {p.value} {p.unit} ({p.condition})
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
                          WHO Safety Bounds: {p.min} - {p.max} {p.unit}. {p.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-150 p-4 text-center">
                  <p className="text-xs font-bold text-green-700 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>No Safety Limit Violations Found</span>
                  </p>
                </div>
              )}
            </div>

            {/* Mitigation Recommendations */}
            {result.recommendation && result.recommendation.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Mitigation & Water Treatment</span>
                </p>
                <div className="bg-white rounded-xl border border-slate-150 p-4 space-y-2 max-h-36 overflow-y-auto">
                  {result.recommendation.map((rec, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start text-xs text-slate-600 leading-relaxed border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-1.5"></div>
                      <p>{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <HeartPulse className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
            <h4 className="text-sm font-bold text-slate-600">Awaiting Sample Data</h4>
            <p className="text-xs text-slate-400 max-w-[240px] mt-1 leading-relaxed">
              Complete the aqueous form or select one of the safe/toxic test presets to run safety predictions.
            </p>
          </div>
        )}

        <div className="text-[10px] text-slate-400 font-medium text-center mt-4">
          Models evaluated dynamically. Recommendations provided according to standard WHO and EPA health regulations.
        </div>
      </div>
    </div>
  );
}
