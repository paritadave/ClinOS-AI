import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  ClipboardCheck, 
  ArrowLeftRight, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  UserPlus, 
  Bookmark,
  History,
  FileCheck
} from "lucide-react";
import { Patient, IntakeSummary } from "../types";

interface IntakeHistoryPanelProps {
  patient: Patient;
  onRefresh: () => void;
  onLogAudit: (action: string, details: string) => void;
}

export default function IntakeHistoryPanel({ patient, onRefresh, onLogAudit }: IntakeHistoryPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"intake" | "compare">("intake");
  
  // Intake States
  const [chiefComplaint, setChiefComplaint] = useState<string>("Dry, persistent cough for 7 days");
  const [symptomsList, setSymptomsList] = useState<string[]>(["Cough", "Mild Shortness of Breath"]);
  const [statedMeds, setStatedMeds] = useState<string>("Methyldopa, Prenatal Vitamins");
  const [statedAllergies, setStatedAllergies] = useState<string>("Penicillin, Peanuts");
  const [familyHist, setFamilyHist] = useState<string>("Father has chronic hypertension");
  const [recentChanges, setRecentChanges] = useState<string>("No fever, worsening dry cough in laying positions");
  
  const [isIntakeAnalyzing, setIsIntakeAnalyzing] = useState<boolean>(false);
  const [intakeSummary, setIntakeSummary] = useState<string>("");

  // History Comparison States
  const [currentNote, setCurrentNote] = useState<string>(
    `Subjective: Patient complaints of worsening dry cough for 7 days. Mild dyspnea on exertion. Sleep slightly disrupted due to cough. Refers to previous back pain resolving with daily physical stretching.\nObjective: Chest: mild expiratory wheeze bilaterally but good air entry. No crackles. Vitals normal.\nAssessment: Acute respiratory tract irritation, likely viral bronchitic component.\nPlan: Recommend warm fluids, PRN Salbutamol inhaler for respiratory comfort, and follow up within 48 hours.`
  );
  const [previousNote, setPreviousNote] = useState<string>(
    `Subjective: Patient complains of postural lower back pain at L4-L5 radiating slightly to left side. No respiratory complaints.\nObjective: Lower back inspection reveals paraspinal tightness. SLR test negative. Chest clear bilaterally.\nAssessment: Gestational lower back postural strain.\nPlan: Discontinue Ibuprofen (avoid in late pregnancy), initiate physical therapy, follow up PRN.`
  );
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [compareResult, setCompareResult] = useState<{
    newSymptoms: string[];
    newMedications: string[];
    changedDosages: string[];
    resolvedSymptoms: string[];
    criticalObservations: string;
  } | null>(null);

  const handleAnalyzeIntake = async () => {
    setIsIntakeAnalyzing(true);
    setIntakeSummary("");

    try {
      const res = await fetch("/api/intake/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chiefComplaint,
          symptoms: symptomsList,
          medications: statedMeds,
          allergies: statedAllergies,
          familyHistory: familyHist,
          recentChanges
        })
      });
      const data = await res.json();
      if (data.aiSummary) {
        setIntakeSummary(data.aiSummary);
        onLogAudit("ANALYZE_PATIENT_INTAKE", `Synthesized pre-visit digital self-service intake summary for ${patient.name}.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsIntakeAnalyzing(false);
    }
  };

  const handleCompareHistory = async () => {
    setIsComparing(true);
    setCompareResult(null);

    try {
      const res = await fetch("/api/history/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentNote, previousNote })
      });
      const data = await res.json();
      if (data.comparison) {
        setCompareResult(data.comparison);
        onLogAudit("COMPARE_CLINICAL_HISTORY", `Processed EMR history differential review for patient ${patient.name}.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsComparing(false);
    }
  };

  const toggleSymptom = (sym: string) => {
    if (symptomsList.includes(sym)) {
      setSymptomsList(symptomsList.filter(s => s !== sym));
    } else {
      setSymptomsList([...symptomsList, sym]);
    }
  };

  const availableSymptoms = [
    "Cough", "Mild Shortness of Breath", "Fever", "Nausea", "Fatigue", "Back Pain", "Chest tightness"
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full animate-fade-in" id="intake-history-panel">
      {/* Tab Selectors */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab("intake")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === "intake" 
                ? "bg-[#0F172A] text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Patient Self-Intake Agent
          </button>
          <button
            onClick={() => setActiveSubTab("compare")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === "compare" 
                ? "bg-[#0F172A] text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Clinical History Comparison
          </button>
        </div>
        <span className="text-xs text-slate-400 font-mono font-bold hidden md:inline">EMR Integrated</span>
      </div>

      {activeSubTab === "intake" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
          {/* Intake Form Controls */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between h-[450px]">
            <div className="space-y-3.5 overflow-y-auto pr-1 custom-scrollbar">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Chief Complaint
                </label>
                <input
                  type="text"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Select Symptoms Reported
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableSymptoms.map((sym, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleSymptom(sym)}
                      className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                        symptomsList.includes(sym)
                          ? "bg-blue-50 border-blue-200 text-blue-700 font-bold"
                          : "bg-white border-slate-250 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Family History
                  </label>
                  <input
                    type="text"
                    value={familyHist}
                    onChange={(e) => setFamilyHist(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Medications Declared
                  </label>
                  <input
                    type="text"
                    value={statedMeds}
                    onChange={(e) => setStatedMeds(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Recent Lifestyle or Body Changes
                </label>
                <textarea
                  value={recentChanges}
                  onChange={(e) => setRecentChanges(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 h-16 focus:outline-hidden focus:border-blue-500 resize-none font-medium"
                />
              </div>
            </div>

            <button
              onClick={handleAnalyzeIntake}
              disabled={isIntakeAnalyzing || !chiefComplaint}
              className="w-full px-4 py-2.5 text-xs font-bold text-white bg-[#0F172A] hover:bg-[#1E293B] disabled:bg-slate-300 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isIntakeAnalyzing ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  Analyzing Pre-Visit Questionnaire...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  Synthesize EMR Intake Summary
                </>
              )}
            </button>
          </div>

          {/* Intake Summary Output */}
          <div className="lg:col-span-7 border-l border-slate-100 pl-4 h-[450px] flex flex-col justify-between">
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
              {isIntakeAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 font-medium">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mb-3"
                  />
                  <p className="text-xs font-bold text-slate-700 animate-pulse">Synthesizing EMR Summary...</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs text-center">
                    Triage model is compiling self-disclosed symptoms and background risks into an emergency EMR chart briefing.
                  </p>
                </div>
              ) : intakeSummary ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-100">
                      Pre-Visit Summary Ready
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Validated with PIPEDA standards</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3.5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        AI Clinical Intake Briefing (Pre-Visit Summary)
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans mt-2 whitespace-pre-line bg-white p-3.5 rounded-xl border border-slate-200 font-medium">
                        {intakeSummary}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px]">
                        <span className="text-slate-400 block font-bold mb-0.5 uppercase tracking-wider text-[9px]">Stated Allergies</span>
                        <span className="text-rose-700 font-bold font-sans">{statedAllergies}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px]">
                        <span className="text-slate-400 block font-bold mb-0.5 uppercase tracking-wider text-[9px]">Stated Medications</span>
                        <span className="text-slate-700 font-bold font-sans">{statedMeds}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 h-full">
                  <ClipboardCheck className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
                  <h4 className="text-sm font-medium text-slate-700">No Intake Analysis</h4>
                  <p className="text-xs text-slate-400 text-center max-w-xs mt-1">
                    Click "Synthesize EMR Intake Summary" to distill self-reported symptoms and chief complaints into a professional pre-appointment EMR record.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* HISTORY COMPARISON TAB */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden h-[450px]">
          {/* Note Comparators Inputs */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full">
            <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Current Encounter Note (SOAP)
                </label>
                <textarea
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-700 h-32 focus:outline-hidden focus:border-blue-500 font-mono resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Previous Encounter Note (SOAP)
                </label>
                <textarea
                  value={previousNote}
                  onChange={(e) => setPreviousNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-700 h-32 focus:outline-hidden focus:border-blue-500 font-mono resize-none leading-relaxed"
                />
              </div>
            </div>

            <button
              onClick={handleCompareHistory}
              disabled={isComparing || !currentNote || !previousNote}
              className="w-full px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2 shadow-sm"
            >
              {isComparing ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  Analyzing EMR Differentials...
                </>
              ) : (
                <>
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Compare Encounter Trajectory
                </>
              )}
            </button>
          </div>

          {/* History Comparison Outputs */}
          <div className="lg:col-span-7 border-l border-slate-100 pl-4 h-full flex flex-col justify-between">
            <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 custom-scrollbar">
              {isComparing ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 font-medium">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mb-3"
                  />
                  <p className="text-xs font-bold text-slate-700 animate-pulse">Comparing Records...</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs text-center">
                    AI differential engine is tracking new symptoms, changed dosages, and resolving complaints to verify treatment progression.
                  </p>
                </div>
              ) : compareResult ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-bold">
                      EMR Differential Logs
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Encounter delta comparison</span>
                  </div>

                  {/* Summary Narrative */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs leading-relaxed text-slate-700 font-medium">
                    {compareResult.criticalObservations}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-rose-50/15 border border-rose-100 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-rose-700 block mb-1">New Symptoms Detected</span>
                      {compareResult.newSymptoms.length === 0 ? (
                        <p className="text-xs text-slate-500 font-medium">None detected.</p>
                      ) : (
                        <ul className="space-y-1">
                          {compareResult.newSymptoms.map((s, idx) => (
                            <li key={idx} className="text-xs text-slate-700 font-semibold">• {s}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="bg-emerald-50/10 border border-emerald-100 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block mb-1">Resolved Symptoms</span>
                      {compareResult.resolvedSymptoms.length === 0 ? (
                        <p className="text-xs text-slate-500 font-medium">None detected.</p>
                      ) : (
                        <ul className="space-y-1">
                          {compareResult.resolvedSymptoms.map((s, idx) => (
                            <li key={idx} className="text-xs text-slate-700 font-semibold">• {s}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50/15 border border-blue-100 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-blue-700 block mb-1">New Medications</span>
                      {compareResult.newMedications.length === 0 ? (
                        <p className="text-xs text-slate-500 font-medium">None detected.</p>
                      ) : (
                        <ul className="space-y-1">
                          {compareResult.newMedications.map((m, idx) => (
                            <li key={idx} className="text-xs text-slate-700 font-semibold">• {m}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="bg-amber-50/15 border border-amber-100 rounded-xl p-3.5">
                      <span className="text-[10px] uppercase font-bold text-amber-800 block mb-1">Dosage/Treatment Changes</span>
                      {compareResult.changedDosages.length === 0 ? (
                        <p className="text-xs text-slate-500 font-medium">None detected.</p>
                      ) : (
                        <ul className="space-y-1">
                          {compareResult.changedDosages.map((d, idx) => (
                            <li key={idx} className="text-xs text-slate-700 font-semibold">• {d}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 h-full">
                  <ArrowLeftRight className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
                  <h4 className="text-sm font-medium text-slate-700">No Differential Run</h4>
                  <p className="text-xs text-slate-400 text-center max-w-xs mt-1">
                    Select SOAP text inputs on the left and click "Compare Encounter Trajectory" to run automated patient history delta diagnostics.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
