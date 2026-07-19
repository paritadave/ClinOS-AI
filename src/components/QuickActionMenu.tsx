import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Zap, 
  X, 
  Users, 
  ShieldAlert, 
  RefreshCw, 
  FileDown, 
  LayoutGrid, 
  List, 
  UserCheck, 
  Check, 
  Heart, 
  Sparkles,
  Database
} from "lucide-react";
import { Patient, UserRole } from "../types";

interface QuickActionMenuProps {
  patients: Patient[];
  selectedPatientId: string;
  onPatientSelect: (id: string) => void;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  layoutMode: "tabs" | "bento";
  onLayoutChange: (mode: "tabs" | "bento") => void;
  activeModule: string;
  onModuleChange: (module: any) => void;
  onLogAudit: (action: string, details: string) => void;
  onRefresh: () => void;
}

export default function QuickActionMenu({
  patients,
  selectedPatientId,
  onPatientSelect,
  activeRole,
  onRoleChange,
  layoutMode,
  onLayoutChange,
  activeModule,
  onModuleChange,
  onLogAudit,
  onRefresh
}: QuickActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success">("idle");

  const activePatient = patients.find(p => p.id === selectedPatientId);

  // Trigger rapid clinical database synchronization macro
  const handleEMRSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncStatus("syncing");
    onLogAudit("QUICK_ACTION_EMR_SYNC", "Triggered rapid multi-system EMR gateway sync from Quick Action Hub.");
    
    setTimeout(() => {
      onRefresh();
      setSyncStatus("success");
      setIsSyncing(false);
      onLogAudit("QUICK_ACTION_EMR_SYNC_SUCCESS", "Rapid EMR database sync finalized: Toronto main node updated.");
      
      setTimeout(() => {
        setSyncStatus("idle");
      }, 1500);
    }, 1000);
  };

  const handlePatientSwitch = (patId: string) => {
    onPatientSelect(patId);
    setIsOpen(false);
  };

  const handleRoleSelect = (role: UserRole) => {
    onRoleChange(role);
  };

  const handleLayoutSwitch = () => {
    const nextLayout = layoutMode === "bento" ? "tabs" : "bento";
    onLayoutChange(nextLayout);
    onLogAudit("QUICK_ACTION_TOGGLE_LAYOUT", `Swapped EMR workspace visualization mode to ${nextLayout} via Quick Action Hub.`);
  };

  const triggerExportHandout = () => {
    // 1. Shift module focus to patient summary handout
    onModuleChange("patientSummary");
    if (layoutMode === "bento") {
      // In bento mode, scroll down to the patient summary card
      setTimeout(() => {
        const el = document.getElementById("patient-take-home-summary");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-blue-500", "transition-all");
          setTimeout(() => el.classList.remove("ring-2", "ring-blue-500"), 1500);
        }
      }, 100);
    }
    setIsOpen(false);
    onLogAudit("QUICK_ACTION_EXPORT_HANDOUT", `Triggered Care Plan Handout focus for ${activePatient?.name || "active patient"}.`);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans print:hidden">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Dim overlay for clean focus */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900 z-40 cursor-pointer"
            />

            {/* Quick Actions Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 180, damping: 20 }}
              className="absolute bottom-16 right-0 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[500px]"
            >
              {/* Header */}
              <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400">
                    <Zap className="w-4 h-4 fill-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider">ClinOS Quick Actions</h3>
                    <p className="text-[10px] text-slate-400">Rapid single-encounter workflow macros</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable actions container */}
              <div className="p-4 space-y-4.5 overflow-y-auto custom-scrollbar flex-1">
                
                {/* 1. Switch Active Patient */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" /> Switch Patient Record
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {patients.map((pat) => {
                      const isCurrent = pat.id === selectedPatientId;
                      return (
                        <button
                          key={pat.id}
                          onClick={() => handlePatientSwitch(pat.id)}
                          className={`p-2 rounded-xl text-[11px] font-bold text-left border transition-all cursor-pointer truncate ${
                            isCurrent
                              ? "bg-blue-50 border-blue-200 text-blue-700"
                              : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                          }`}
                        >
                          <div className="truncate">{pat.name}</div>
                          <span className="text-[9px] text-slate-400 font-normal font-mono">PHN: {pat.phn.slice(-4)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Fast Clinical Action Macros */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-slate-400" /> Rapid Operations
                  </span>
                  
                  <div className="space-y-1.5">
                    {/* Synchronize EMR database */}
                    <button
                      onClick={handleEMRSync}
                      disabled={isSyncing}
                      className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-semibold text-slate-700 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <RefreshCw className={`w-3.5 h-3.5 text-blue-500 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
                        Sync Local EMR Database
                      </span>
                      {syncStatus === "success" && (
                        <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 animate-fade-in">Updated ✓</span>
                      )}
                    </button>

                    {/* Direct Care Plan Handout Export */}
                    <button
                      onClick={triggerExportHandout}
                      className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-semibold text-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5 text-rose-500" />
                      Compile Care Plan PDF / Handout
                    </button>

                    {/* Toggle Layout visualization mode */}
                    <button
                      onClick={handleLayoutSwitch}
                      className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-semibold text-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      {layoutMode === "bento" ? (
                        <>
                          <List className="w-3.5 h-3.5 text-slate-500" />
                          Switch to Tabbed Workstations
                        </>
                      ) : (
                        <>
                          <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                          Switch to Bento Grid View
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 3. Escalate/Switch RBAC Role */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-slate-400" /> Fast RBAC Escalation
                  </span>
                  
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.values(UserRole).map((role) => {
                      const isActive = role === activeRole;
                      return (
                        <button
                          key={role}
                          onClick={() => handleRoleSelect(role)}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-bold text-left border transition-all cursor-pointer flex items-center justify-between ${
                            isActive
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold"
                              : "bg-slate-50 hover:bg-slate-100 border-slate-150 text-slate-600"
                          }`}
                        >
                          <span className="truncate">{role}</span>
                          {isActive && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Clinic identification footer */}
              <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-150 text-[9px] font-mono font-bold text-slate-400 flex items-center justify-between uppercase">
                <span>Secure Terminal</span>
                <span>Port: 3000 • SSL</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Primary Floating Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-12 h-12 bg-[#0F172A] hover:bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer border border-slate-700/50 relative"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="zap-icon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <Zap className="w-5 h-5 text-blue-400 fill-blue-400/20" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
