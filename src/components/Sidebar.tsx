import React from "react";
import { 
  Droplet, 
  Activity, 
  FileText, 
  Compass, 
  History, 
  Cpu, 
  AlertTriangle 
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  bestModelName: string;
  bestModelAccuracy: number;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  bestModelName, 
  bestModelAccuracy 
}: SidebarProps) {
  const menuItems = [
    { id: "dashboard", name: "Dashboard", icon: Compass },
    { id: "eda", name: "Exploratory Data", icon: FileText },
    { id: "comparison", name: "Model Comparison", icon: Cpu },
    { id: "predict", name: "Predict Safety", icon: Activity },
    { id: "history", name: "History Log", icon: History },
  ];

  return (
    <aside id="app-sidebar" className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
      {/* Branding Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
            <Droplet className="w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 font-display">AquaLogic</span>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold font-mono">
          Potability Analyzer
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 cursor-pointer text-left ${
                isActive 
                  ? "bg-blue-50 text-blue-700 shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Active Model Summary Widget */}
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <div className="bg-slate-900 rounded-xl p-4 text-white shadow-md relative overflow-hidden">
          {/* Subtle design element */}
          <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-blue-500 opacity-10 rounded-full"></div>
          
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Active Model</p>
          </div>
          
          <p className="text-xs font-bold text-white mb-2 truncate" title={bestModelName}>
            {bestModelName || "Random Forest Classifier"}
          </p>
          
          <div className="w-full bg-slate-700 h-1.5 rounded-full mb-1.5 overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-1000" 
              style={{ width: `${Math.max(10, Math.min(100, bestModelAccuracy * 100))}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-300 font-semibold">
            <span>Accuracy Score</span>
            <span className="text-blue-400">
              {(bestModelAccuracy * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
