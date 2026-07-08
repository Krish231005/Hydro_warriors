import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import DashboardTab from "./components/DashboardTab";
import EdaTab from "./components/EdaTab";
import PredictTab from "./components/PredictTab";
import HistoryTab from "./components/HistoryTab";
import { 
  SummaryStats, 
  FeatureImportance, 
  EdaResponse, 
  ModelMetricsResponse, 
  PredictionData 
} from "./types";
import { 
  Sparkles, 
  Database, 
  Activity, 
  History, 
  Cpu, 
  RefreshCw,
  TrendingUp,
  Info
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // --- API DATA STATES ---
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [edaData, setEdaData] = useState<EdaResponse | null>(null);
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [importances, setImportances] = useState<FeatureImportance[]>([]);
  const [history, setHistory] = useState<PredictionData[]>([]);

  // --- LOADING STATES ---
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingEda, setIsLoadingEda] = useState(true);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);

  // --- PREDICTION FORM INPUTS ---
  const [inputs, setInputs] = useState({
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
  const [predictionResult, setPredictionResult] = useState<PredictionData | null>(null);

  // --- FILTER STATES FOR HISTORY LOG ---
  const [historyFilter, setHistoryFilter] = useState({
    search: "",
    potability: "",
    risk: "",
    sortBy: "timestamp",
    order: "DESC"
  });

  // --- 1. FETCH SUMMARY STATISTICS ---
  const fetchSummary = async () => {
    try {
      setIsLoadingSummary(true);
      const res = await fetch("/api/summary");
      const data = await res.json();
      if (data.status === "success" && data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.warn("Failed to fetch summary from server, using safety fallbacks:", err);
      // Fallback fallback
      setSummary({
        total_records: 3276,
        total_features: 9,
        missing_cells: 1434,
        duplicate_rows: 0,
        safe_samples: 1278,
        unsafe_samples: 1998,
        safe_percentage: 39.01
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // --- 2. FETCH EXPLORATORY DATA ---
  const fetchEda = async () => {
    try {
      setIsLoadingEda(true);
      const res = await fetch("/api/eda");
      const data = await res.json();
      if (data.status === "success" && data.data) {
        setEdaData(data.data);
      }
    } catch (err) {
      console.warn("Failed to fetch EDA data, retrying or displaying default mock views:", err);
    } finally {
      setIsLoadingEda(false);
    }
  };

  // --- 3. FETCH CLASSIFIER COMPARISON METRICS ---
  const fetchMetrics = async () => {
    try {
      setIsLoadingMetrics(true);
      const res = await fetch("/api/metrics");
      const data = await res.json();
      if (data.status === "success") {
        setMetrics({
          best_model_name: data.best_model_name,
          metrics: data.metrics,
          visualizations: data.visualizations
        });
      }
    } catch (err) {
      console.warn("Failed to fetch evaluation metrics:", err);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  // --- 4. FETCH FEATURE IMPORTANCES ---
  const fetchFeatureImportance = async () => {
    try {
      const res = await fetch("/api/feature-importance");
      const data = await res.json();
      if (data.status === "success" && data.importances) {
        setImportances(data.importances);
      }
    } catch (err) {
      console.warn("Failed to fetch feature importance:", err);
      // Fallback
      setImportances([
        { feature: "Sulfate", name: "Sulfate", importance: 0.1834, percentage: 18.34 },
        { feature: "ph", name: "pH Level", importance: 0.1624, percentage: 16.24 },
        { feature: "Solids", name: "Total Dissolved Solids", importance: 0.1412, percentage: 14.12 },
        { feature: "Hardness", name: "Hardness", importance: 0.1255, percentage: 12.55 },
        { feature: "Chloramines", name: "Chloramines", importance: 0.1082, percentage: 10.82 },
        { feature: "Conductivity", name: "Conductivity", importance: 0.0812, percentage: 8.12 },
        { feature: "Organic_carbon", name: "Total Organic Carbon", importance: 0.0712, percentage: 7.12 },
        { feature: "Trihalomethanes", name: "Trihalomethanes", importance: 0.0655, percentage: 6.55 },
        { feature: "Turbidity", name: "Turbidity", importance: 0.0614, percentage: 6.14 }
      ]);
    }
  };

  // --- 5. FETCH PREDICTION LOGS HISTORY ---
  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const { search, potability, risk, sortBy, order } = historyFilter;
      
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (potability) params.append("potability", potability);
      if (risk) params.append("risk", risk);
      if (sortBy) params.append("sort_by", sortBy);
      if (order) params.append("order", order);

      const res = await fetch(`/api/history?${params.toString()}`);
      const data = await res.json();
      if (data.status === "success" && data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.warn("Failed to fetch history logs:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // --- INITIAL BOOTSTRAP TRIGGER ---
  useEffect(() => {
    fetchSummary();
    fetchEda();
    fetchMetrics();
    fetchFeatureImportance();
    fetchHistory();
  }, []);

  // --- RE-FETCH HISTORY UPON FILTERS CHANGE ---
  useEffect(() => {
    fetchHistory();
  }, [historyFilter]);

  // --- ACTION: RETRAIN ENTIRE ML CLASS SUITE ---
  const handleTriggerRetrain = async () => {
    try {
      setIsRetraining(true);
      const res = await fetch("/api/retrain", { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        setMetrics({
          best_model_name: data.best_model_name,
          metrics: data.metrics,
          visualizations: data.visualizations
        });
        fetchFeatureImportance();
        fetchSummary();
        alert("Success: All 9 machine learning models retrained, compared, and the best pipeline preserved!");
      }
    } catch (err) {
      console.error("Failed to retrain models:", err);
      alert("Error: Server pipeline failed during multi-model fitting.");
    } finally {
      setIsRetraining(false);
    }
  };

  // --- ACTION: PREDICT SINGLE SAMPLE ---
  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsPredicting(true);
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs)
      });
      const data = await res.json();
      if (data.status === "success" && data.data) {
        setPredictionResult(data.data);
        fetchHistory(); // Sync logs database
      }
    } catch (err) {
      console.error("Predict error:", err);
    } finally {
      setIsPredicting(false);
    }
  };

  // --- ACTION: DELETE A LOG FROM SQLITE ---
  const handleDeleteRecord = async (id: number) => {
    if (!confirm(`Are you sure you want to delete prediction record #${id}?`)) return;
    try {
      const res = await fetch(`/api/history/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.status === "success") {
        fetchHistory();
      }
    } catch (err) {
      console.error("Delete log error:", err);
    }
  };

  // --- ACTION: WIPE LOGS HISTORY ---
  const handleClearAllHistory = async () => {
    if (!confirm("CRITICAL: This will permanently wipe all logs from the SQLite database. Continue?")) return;
    try {
      const res = await fetch("/api/history", { method: "DELETE" });
      const data = await res.json();
      if (data.status === "success") {
        fetchHistory();
      }
    } catch (err) {
      console.error("Clear database error:", err);
    }
  };

  // --- HELPER TO RESET FORM INPUTS ---
  const handleClearPredictInputs = () => {
    setInputs({
      ph: "",
      Hardness: "",
      Solids: "",
      Chloramines: "",
      Sulfate: "",
      Conductivity: "",
      Organic_carbon: "",
      Trihalomethanes: "",
      Turbidity: ""
    });
    setPredictionResult(null);
  };

  // Extract variables for sidebarActive stats
  const bestModelName = metrics?.best_model_name || "Support Vector Machine";
  const bestModelAccuracy = metrics?.metrics?.[bestModelName]?.accuracy || 0.692;
  const bestModelF1 = metrics?.metrics?.[bestModelName]?.f1_score || 0.684;

  return (
    <div className="flex h-screen w-screen bg-[#F4F6F8] font-sans text-slate-800 overflow-hidden">
      
      {/* 1. Sidebar Left */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        bestModelName={bestModelName}
        bestModelAccuracy={bestModelAccuracy}
      />

      {/* 2. Main Page Column */}
      <main className="flex-1 flex flex-col p-8 overflow-y-auto">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 font-display">
              {activeTab === "dashboard" && "Dashboard / System Overview"}
              {activeTab === "eda" && "Exploratory Data Analytics"}
              {activeTab === "predict" && "Water Potability Analysis"}
              {activeTab === "history" && "SQLite Prediction History"}
            </h1>
            <p className="text-slate-500 text-sm">
              {activeTab === "dashboard" && "Real-time analysis of water potability and chemical concentrations."}
              {activeTab === "eda" && "Discover correlations, outliers, distributions, and Gini Gini ratios."}
              {activeTab === "predict" && "Trigger Scikit-learn predictions and generate WHO safety reports."}
              {activeTab === "history" && "Audit past safety logs, run keyword searches, and manage files."}
            </p>
          </div>
          
          {/* Header Action Buttons */}
          <div className="flex gap-3">
            <button 
              id="btn-header-refresh"
              onClick={() => {
                fetchSummary();
                fetchEda();
                fetchMetrics();
                fetchFeatureImportance();
                fetchHistory();
              }}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>SYNC DATABASE</span>
            </button>
            
            {activeTab !== "predict" ? (
              <button 
                id="btn-header-action"
                onClick={() => setActiveTab("predict")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-100 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>TEST A SAMPLE</span>
              </button>
            ) : (
              <button 
                id="btn-header-action-retrain"
                onClick={handleTriggerRetrain}
                disabled={isRetraining}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>{isRetraining ? "RETRAINING..." : "RETRAIN ALL MODELS"}</span>
              </button>
            )}
          </div>
        </header>

        {/* 3. Render Selected Tab View */}
        <section className="flex-1">
          {activeTab === "dashboard" && (
            <DashboardTab 
              summary={summary}
              bestModelName={bestModelName}
              bestModelF1={bestModelF1}
              importances={importances}
              onTriggerRetrain={handleTriggerRetrain}
              isRetraining={isRetraining}
              onNavigateToPredict={() => setActiveTab("predict")}
            />
          )}

          {activeTab === "eda" && (
            <EdaTab 
              edaData={edaData} 
              isLoading={isLoadingEda} 
            />
          )}

          {activeTab === "predict" && (
            <PredictTab 
              inputs={inputs}
              setInputs={setInputs}
              onPredict={handlePredict}
              isPredicting={isPredicting}
              result={predictionResult}
              onClear={handleClearPredictInputs}
            />
          )}

          {activeTab === "history" && (
            <HistoryTab 
              history={history}
              onDeleteRecord={handleDeleteRecord}
              onClearAll={handleClearAllHistory}
              isLoading={isLoadingHistory}
              filter={historyFilter}
              setFilter={setHistoryFilter}
              onRefresh={fetchHistory}
            />
          )}
        </section>

      </main>
    </div>
  );
}
