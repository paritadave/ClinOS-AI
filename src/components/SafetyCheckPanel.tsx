import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  ShieldAlert, 
  Pill, 
  Check, 
  AlertTriangle, 
  Info, 
  Zap, 
  Trash2, 
  Plus, 
  RefreshCw 
} from "lucide-react";
import { Patient, SafetyAlert, Medication } from "../types";

interface SafetyCheckPanelProps {
  patient: Patient;
  onRefresh: () => void;
  onLogAudit: (action: string, details: string) => void;
}

export default function SafetyCheckPanel({ patient, onRefresh, onLogAudit }: SafetyCheckPanelProps) {
  const [drugName, setDrugName] = useState<string>("");
  const [dosage, setDosage] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("Once Daily");
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [checkSource, setCheckSource] = useState<string>("");
  const [prescribedList, setPrescribedList] = useState<Medication[]>(patient.currentMedications);

  const triggerSafetyCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!drugName) return;

    setIsChecking(true);
    setSafetyAlerts([]);
    
    try {
      const res = await fetch(`/api/patients/${patient.id}/prescribe-safety-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drugName,
          dosage,
          clinicianName: "Dr. Alistair Vance",
          clinicianRole: "Family Physician"
        })
      });
      const data = await res.json();
      if (data.alerts) {
        // Map alerts to include tracking fields
        const mappedAlerts = data.alerts.map((alert: any, idx: number) => ({
          ...alert,
          id: `alert-${idx}-${Date.now()}`,
          reviewStatus: "Pending"
        }));
        setSafetyAlerts(mappedAlerts);
        setCheckSource(data.source || "Clinical Intelligence Engine");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleUpdateStatus = (alertId: string, status: "Acknowledged" | "Resolved") => {
    setSafetyAlerts(prev => prev.map(a => {
      if (a.id === alertId) {
        onLogAudit("REVIEW_SAFETY_ALERT", `Clinician reviewed and marked safety alert "${a.title}" (${a.category}) as ${status}.`);
        return { ...a, reviewStatus: status };
      }
      return a;
    }));
  };

  const handleAddMedication = () => {
    if (!drugName) return;
    const newMed: Medication = {
      id: `med-${Date.now()}`,
      name: drugName,
      dosage: dosage || "Standard Dose",
      frequency,
      status: "Active",
      prescribedBy: "Dr. Alistair Vance",
      startDate: new Date().toISOString().split("T")[0],
      adherence: "Good",
      notes: "Newly added from clinical copilot session"
    };

    setPrescribedList([newMed, ...prescribedList]);
    onLogAudit("PRESCRIBE_MEDICATION", `Prescribed ${drugName} ${dosage || ""}. Safety evaluation performed.`);
    
    // Clear inputs and safety alerts
    setDrugName("");
    setDosage("");
    setSafetyAlerts([]);
  };

  // Quick select items to trigger high-fidelity alerts as specified in the safety examples
  const quickMedications = [
    { name: "Ibuprofen", dose: "800mg", label: "Ibuprofen 800mg (Pregnancy Check)" },
    { name: "Metformin", dose: "500mg", label: "Metformin 500mg (Kidney eGFR Check)" },
    { name: "Clarithromycin", dose: "500mg", label: "Clarithromycin (Warfarin Interaction)" },
    { name: "Propranolol", dose: "40mg", label: "Propranolol Beta-blocker (Asthma Conflict)" },
    { name: "Amoxicillin", dose: "500mg", label: "Amoxicillin (Allergy Alert Check)" }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full animate-fade-in" id="safety-panel">
      {/* Panel Title */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            Clinical Safety Intelligence
          </h2>
          <p className="text-xs text-slate-400 font-medium">Prevent prescribing errors by continuously checking patient records</p>
        </div>
        <span className="text-[10px] uppercase font-mono bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-100 font-bold">
          Alert Engine Active
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* Left Hand: Prescription Builder */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          <form onSubmit={triggerSafetyCheck} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                New Prescription Name
              </label>
              <input
                type="text"
                value={drugName}
                onChange={(e) => setDrugName(e.target.value)}
                placeholder="e.g. Ibuprofen, Metformin, Clarithromycin..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Dosage
                </label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 800mg, 500mg"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-hidden focus:border-blue-500 transition-all font-medium"
                >
                  <option>Once Daily</option>
                  <option>BID (Twice Daily)</option>
                  <option>TID (Thrice Daily)</option>
                  <option>QID (Four Times Daily)</option>
                  <option>Q4-6H PRN (As Needed)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isChecking || !drugName}
              className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] disabled:bg-slate-300 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Clinical Safeties...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  Trigger Safety Agent Check
                </>
              )}
            </button>
          </form>

          {/* Quick clinical sandbox presets to easily showcase features */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Clinical Safety Sandbox Presets
            </h4>
            <div className="space-y-1.5">
              {quickMedications.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDrugName(item.name);
                    setDosage(item.dose);
                  }}
                  className="w-full text-left px-3 py-2 text-xs bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-slate-600 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-semibold"
                >
                  <Plus className="w-3 h-3 text-blue-500" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Hand: AI Safety Alerts Display */}
        <div className="lg:col-span-7 flex flex-col h-[380px] justify-between border-l border-slate-100 pl-4">
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {isChecking ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-medium">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full mb-3"
                />
                <p className="text-xs font-bold animate-pulse text-slate-700">Analyzing Patient Record...</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs text-center">
                  Reviewing gestational status, allergies, drug-drug pathways, and eGFR/creatinine lab results.
                </p>
              </div>
            ) : safetyAlerts.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-100 pb-1.5 mb-1">
                  <span>SAFETY LOGS ({safetyAlerts.length})</span>
                  <span className="font-mono text-blue-600 font-semibold">Source: {checkSource}</span>
                </div>

                {safetyAlerts.map((alert, idx) => {
                  const isDanger = alert.type === "danger";
                  const isWarning = alert.type === "warning";
                  const status = alert.reviewStatus || "Pending";

                  return (
                    <motion.div
                      key={alert.id || idx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.08 }}
                      className={`border rounded-xl p-4 flex flex-col gap-3 transition-all ${
                        status === "Resolved"
                          ? "bg-emerald-50/30 border-emerald-200/80 text-emerald-950"
                          : status === "Acknowledged"
                          ? "bg-blue-50/30 border-blue-200/80 text-blue-950"
                          : isDanger
                          ? "bg-rose-50/55 border-rose-200 text-rose-900"
                          : isWarning
                          ? "bg-amber-50/55 border-amber-200 text-amber-900"
                          : "bg-blue-50/55 border-blue-200 text-blue-900"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5 shrink-0">
                          {status === "Resolved" ? (
                            <Check className="w-4 h-4 text-emerald-600 font-bold" />
                          ) : (
                            <AlertTriangle className={`w-4 h-4 ${isDanger ? "text-rose-500" : "text-amber-500"}`} />
                          )}
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-bold leading-tight">{alert.title}</h4>
                              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-white/80 border border-slate-200/80 rounded-md text-slate-500 font-bold">
                                {alert.category}
                              </span>
                            </div>
                            
                            {/* Review Status Indicator Badge */}
                            <div>
                              {status === "Pending" && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-amber-50 border-amber-200 text-amber-700 animate-pulse">
                                  ● Pending Review
                                </span>
                              )}
                              {status === "Acknowledged" && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-blue-50 border-blue-200 text-blue-700">
                                  ✓ Acknowledged
                                </span>
                              )}
                              {status === "Resolved" && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-700">
                                  ✓ Resolved
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs leading-relaxed text-slate-700 font-medium">{alert.message}</p>
                        </div>
                      </div>

                      {/* Interactive Review Controls Row */}
                      <div className="mt-1 pt-2.5 border-t border-slate-100/50 flex justify-end gap-2 items-center text-xs">
                        {status === "Pending" && (
                          <>
                            <span className="text-[10px] text-slate-400 italic mr-auto">Clinician validation required</span>
                            <button
                              onClick={() => handleUpdateStatus(alert.id || "", "Acknowledged")}
                              className="px-2.5 py-1 font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200/50 rounded-lg transition-all cursor-pointer text-[11px]"
                            >
                              Acknowledge
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(alert.id || "", "Resolved")}
                              className="px-2.5 py-1 font-semibold text-emerald-700 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 rounded-lg transition-all cursor-pointer text-[11px]"
                            >
                              Resolve Alert
                            </button>
                          </>
                        )}
                        {status === "Acknowledged" && (
                          <>
                            <span className="text-[10px] text-blue-600/70 font-semibold mr-auto">Reviewed: Acknowledged risk</span>
                            <button
                              onClick={() => handleUpdateStatus(alert.id || "", "Resolved")}
                              className="px-2.5 py-1 font-semibold text-emerald-700 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 rounded-lg transition-all cursor-pointer text-[11px]"
                            >
                              Mark Resolved
                            </button>
                          </>
                        )}
                        {status === "Resolved" && (
                          <>
                            <span className="text-[10px] text-emerald-600/80 font-semibold mr-auto">Resolved by Clinician</span>
                            <button
                              onClick={() => {
                                setSafetyAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, reviewStatus: "Pending" } : a));
                                onLogAudit("REVIEW_SAFETY_ALERT", `Reopened safety alert "${alert.title}" to pending status.`);
                              }}
                              className="px-2 py-0.5 text-[10px] font-medium text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                            >
                              Reopen Alert
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Confirm Prescribe Button if checks passed or reviewed */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleAddMedication}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Bypass Safety & Prescribe
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 h-full">
                <ShieldAlert className="w-12 h-12 stroke-1 mb-2.5 text-slate-300" />
                <h4 className="text-sm font-medium text-slate-700">No Drug Evaluated</h4>
                <p className="text-xs text-slate-400 text-center max-w-xs mt-1">
                  Type a medication (e.g. Ibuprofen, Metformin) or click one of the quick Sandbox presets to run continuous AI safety evaluation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
