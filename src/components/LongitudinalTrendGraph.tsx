import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, 
  Activity, 
  Plus, 
  Calendar, 
  ChevronRight, 
  Sparkles, 
  ClipboardList, 
  Check, 
  Info,
  ShieldCheck,
  AlertTriangle,
  FileText
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceArea
} from "recharts";
import { Patient } from "../types";

// Standard medical reference ranges for alerts/tooltips
const REFERENCE_RANGES = {
  // Vitals
  systolic: { min: 90, max: 130, unit: "mmHg", label: "Systolic Blood Pressure" },
  diastolic: { min: 60, max: 80, unit: "mmHg", label: "Diastolic Blood Pressure" },
  heartRate: { min: 60, max: 100, unit: "bpm", label: "Heart Rate" },
  peakFlow: { min: 400, max: 600, unit: "L/min", label: "Peak Flow" },
  bloodGlucose: { min: 4.0, max: 7.0, unit: "mmol/L", label: "Fasting Glucose" },
  // Labs
  egfr: { min: 60, max: 150, unit: "mL/min/1.73m²", label: "eGFR" },
  creatinine: { min: 50, max: 110, unit: "umol/L", label: "Serum Creatinine" },
  hba1c: { min: 4.0, max: 6.0, unit: "%", label: "Hemoglobin A1c" },
  inr: { min: 2.0, max: 3.0, unit: "ratio", label: "Therapeutic INR" },
  tsh: { min: 0.4, max: 4.0, unit: "mIU/L", label: "TSH" },
  // PROs (Max bounds for diagnostic scores)
  phq9: { min: 0, max: 9, unit: "score", label: "PHQ-9 (Mild/Normal < 10)" },
  gad7: { min: 0, max: 7, unit: "score", label: "GAD-7 (Mild/Normal < 8)" },
  epds: { min: 0, max: 9, unit: "score", label: "EPDS (Postpartum Depression < 10)" },
  vasBackPain: { min: 0, max: 3, unit: "score", label: "VAS Pain Scale (0-10)" },
  kneeStiffness: { min: 0, max: 40, unit: "%", label: "WOMAC Knee Stiffness (0-100)" }
};

interface LongitudinalTrendGraphProps {
  patient: Patient;
  onLogAudit: (action: string, details: string) => Promise<void> | void;
}

// Initial high-fidelity pre-populated longitudinal records mapped specifically to patient clinical histories
const INITIAL_LONGITUDINAL_DATA: Record<string, {
  vitals: any[];
  labs: any[];
  pros: any[];
  symptoms: any[];
}> = {
  // Sarah Jenkins (Pregnancy Hypertension, gestational diabetes risk, lower back postural pain)
  "pat-01": {
    vitals: [
      { date: "2026-02-15", systolic: 120, diastolic: 78, heartRate: 72, bloodGlucose: 4.8 },
      { date: "2026-03-15", systolic: 124, diastolic: 80, heartRate: 75, bloodGlucose: 4.9 },
      { date: "2026-04-10", systolic: 135, diastolic: 85, heartRate: 78, bloodGlucose: 5.2 }, // BP elevated
      { date: "2026-05-10", systolic: 138, diastolic: 88, heartRate: 80, bloodGlucose: 5.4 }, // Methyldopa started
      { date: "2026-06-10", systolic: 132, diastolic: 82, heartRate: 74, bloodGlucose: 7.6 }, // Glucose elevated (OGTT test)
      { date: "2026-07-15", systolic: 126, diastolic: 80, heartRate: 72, bloodGlucose: 5.1 }  // Diet controlled / controlled BP
    ],
    labs: [
      { date: "2026-02-15", creatinine: 64, egfr: 104, hemoglobin: 132 },
      { date: "2026-04-10", creatinine: 66, egfr: 101, hemoglobin: 125 },
      { date: "2026-06-20", creatinine: 68, egfr: 98, hemoglobin: 118 }, // Mild pregnancy hemodilution
      { date: "2026-07-15", creatinine: 65, egfr: 99, hemoglobin: 119 }
    ],
    pros: [
      { date: "2026-02-15", vasBackPain: 1, gad7: 4, wellnessScale: 90 },
      { date: "2026-04-10", vasBackPain: 2, gad7: 6, wellnessScale: 85 }, // POSTURAL Back pain begins
      { date: "2026-05-10", vasBackPain: 4, gad7: 8, wellnessScale: 80 },
      { date: "2026-06-10", vasBackPain: 5, gad7: 9, wellnessScale: 72 }, // Referred to physio
      { date: "2026-07-15", vasBackPain: 3, gad7: 5, wellnessScale: 78 }  // Better with physical therapy
    ],
    symptoms: [
      { date: "2026-04-10", "Lower Back Pain": 2, "Gestational Reflux": 0 },
      { date: "2026-05-10", "Lower Back Pain": 4, "Gestational Reflux": 1 },
      { date: "2026-06-10", "Lower Back Pain": 5, "Gestational Reflux": 3 },
      { date: "2026-07-15", "Lower Back Pain": 3, "Gestational Reflux": 6 }
    ]
  },
  // Robert Vance (CKD Stage 4, Diabetes, Hypertension, AFib)
  "pat-02": {
    vitals: [
      { date: "2026-03-01", systolic: 148, diastolic: 92, heartRate: 88 },
      { date: "2026-04-15", systolic: 144, diastolic: 89, heartRate: 94 },
      { date: "2026-06-01", systolic: 152, diastolic: 94, heartRate: 104 }, // irregular, beta blocker started
      { date: "2026-07-15", systolic: 138, diastolic: 82, heartRate: 78 }
    ],
    labs: [
      { date: "2026-03-01", egfr: 34, creatinine: 155, hba1c: 7.2, inr: 1.5 },
      { date: "2026-04-15", egfr: 32, creatinine: 168, hba1c: 7.5, inr: 1.8 },
      { date: "2026-06-01", egfr: 30, creatinine: 175, hba1c: 7.6, inr: 2.1 },
      { date: "2026-07-01", egfr: 28, creatinine: 185, hba1c: 7.8, inr: 2.3 }, // Metformin dose reduced
      { date: "2026-07-10", egfr: 28, creatinine: 184, hba1c: 7.8, inr: 2.4 }, // INR therapeutic
      { date: "2026-07-15", egfr: 29, creatinine: 181, hba1c: 7.6, inr: 2.5 }
    ],
    pros: [
      { date: "2026-03-01", phq9: 5, kneeStiffness: 30 },
      { date: "2026-04-15", phq9: 6, kneeStiffness: 42 },
      { date: "2026-06-01", phq9: 9, kneeStiffness: 60 },
      { date: "2026-07-15", phq9: 12, kneeStiffness: 70 } // Moderate depression (due to renal decline & chronic knee OA flare)
    ],
    symptoms: [
      { date: "2026-03-01", "Knee Joint Stiffness": 3, "Uremic Fatigue": 1 },
      { date: "2026-04-15", "Knee Joint Stiffness": 4, "Uremic Fatigue": 2 },
      { date: "2026-05-01", "Knee Joint Stiffness": 5, "Uremic Fatigue": 3 },
      { date: "2026-06-01", "Knee Joint Stiffness": 6, "Uremic Fatigue": 4 },
      { date: "2026-07-15", "Knee Joint Stiffness": 7, "Uremic Fatigue": 6 }
    ]
  },
  // Emily Chen (Postpartum Anxiety, Asthma)
  "pat-03": {
    vitals: [
      { date: "2026-04-01", peakFlow: 410, heartRate: 88, respiratoryRate: 20 },
      { date: "2026-05-01", peakFlow: 430, heartRate: 82, respiratoryRate: 18 }, // Sertraline started
      { date: "2026-06-01", peakFlow: 445, heartRate: 76, respiratoryRate: 16 },
      { date: "2026-07-15", peakFlow: 460, heartRate: 74, respiratoryRate: 15 }
    ],
    labs: [
      { date: "2026-04-01", tsh: 2.5, hemoglobin: 110 }, // Postpartum mild anemia
      { date: "2026-05-10", tsh: 2.1, hemoglobin: 122 },
      { date: "2026-07-15", tsh: 2.0, hemoglobin: 130 }
    ],
    pros: [
      { date: "2026-04-01", gad7: 16, epds: 18 }, // Severe postpartum anxiety & depression risk
      { date: "2026-05-01", gad7: 11, epds: 12 }, // Gradual Zoloft response
      { date: "2026-06-01", gad7: 7, epds: 8 },   // Well controlled
      { date: "2026-07-15", gad7: 4, epds: 5 }
    ],
    symptoms: [
      { date: "2026-04-01", "Postpartum Anxiety": 7, "Asthma Wheezing": 3 },
      { date: "2026-04-10", "Postpartum Anxiety": 6, "Asthma Wheezing": 4 }, // Spring pollen trigger
      { date: "2026-05-10", "Postpartum Anxiety": 5, "Asthma Wheezing": 2 },
      { date: "2026-06-01", "Postpartum Anxiety": 3, "Asthma Wheezing": 1 },
      { date: "2026-07-15", "Postpartum Anxiety": 2, "Asthma Wheezing": 1 }
    ]
  }
};

export default function LongitudinalTrendGraph({ patient, onLogAudit }: LongitudinalTrendGraphProps) {
  // Category tabs
  const [activeCategory, setActiveCategory] = useState<"vitals" | "labs" | "pros" | "symptoms">("symptoms");
  
  // State containing all patient data
  const [chartDataset, setChartDataset] = useState(INITIAL_LONGITUDINAL_DATA);
  
  // Interactive entry states
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [newEntryDate, setNewEntryDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newEntryMetric, setNewEntryMetric] = useState("");
  const [newEntryValue, setNewEntryValue] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Active records for current patient
  const patientData = chartDataset[patient.id] || { vitals: [], labs: [], pros: [], symptoms: [] };
  const records = patientData[activeCategory] || [];

  // Re-sync primary symptom if patient changes
  useEffect(() => {
    setIsAddingEntry(false);
    setIsSuccess(false);
    // Reset inputs
    setNewEntryValue("");
    // Select default metric based on category and patient
    const metrics = getAvailableMetrics();
    if (metrics.length > 0) {
      setNewEntryMetric(metrics[0].key);
    }
  }, [patient, activeCategory]);

  // Helper to extract list of keys (metrics) available for the current category and patient
  const getAvailableMetrics = () => {
    const defaultList: { key: string; label: string; unit: string; color: string }[] = [];
    
    if (activeCategory === "vitals") {
      if (patient.id === "pat-01") {
        defaultList.push(
          { key: "systolic", label: "BP Systolic", unit: "mmHg", color: "#EF4444" },
          { key: "diastolic", label: "BP Diastolic", unit: "mmHg", color: "#3B82F6" },
          { key: "bloodGlucose", label: "Blood Glucose", unit: "mmol/L", color: "#F59E0B" },
          { key: "heartRate", label: "Heart Rate", unit: "bpm", color: "#10B981" }
        );
      } else if (patient.id === "pat-02") {
        defaultList.push(
          { key: "systolic", label: "BP Systolic", unit: "mmHg", color: "#EF4444" },
          { key: "diastolic", label: "BP Diastolic", unit: "mmHg", color: "#3B82F6" },
          { key: "heartRate", label: "Heart Rate (AFib)", unit: "bpm", color: "#EC4899" }
        );
      } else {
        defaultList.push(
          { key: "peakFlow", label: "Peak Flow (PEF)", unit: "L/min", color: "#6366F1" },
          { key: "respiratoryRate", label: "Respiratory Rate", unit: "breaths/min", color: "#F59E0B" },
          { key: "heartRate", label: "Heart Rate", unit: "bpm", color: "#10B981" }
        );
      }
    } else if (activeCategory === "labs") {
      if (patient.id === "pat-01") {
        defaultList.push(
          { key: "egfr", label: "eGFR", unit: "mL/min/1.73m²", color: "#10B981" },
          { key: "creatinine", label: "Serum Creatinine", unit: "umol/L", color: "#F59E0B" },
          { key: "hemoglobin", label: "Hemoglobin", unit: "g/L", color: "#EF4444" }
        );
      } else if (patient.id === "pat-02") {
        defaultList.push(
          { key: "egfr", label: "eGFR (CKD Stage 4)", unit: "mL/min/1.73m²", color: "#EF4444" },
          { key: "creatinine", label: "Serum Creatinine", unit: "umol/L", color: "#F59E0B" },
          { key: "hba1c", label: "Hemoglobin A1c", unit: "%", color: "#6366F1" },
          { key: "inr", label: "Therapeutic INR", unit: "ratio", color: "#10B981" }
        );
      } else {
        defaultList.push(
          { key: "tsh", label: "TSH (Thyroid)", unit: "mIU/L", color: "#3B82F6" },
          { key: "hemoglobin", label: "Hemoglobin", unit: "g/L", color: "#EF4444" }
        );
      }
    } else if (activeCategory === "pros") {
      if (patient.id === "pat-01") {
        defaultList.push(
          { key: "vasBackPain", label: "VAS Back Pain (0-10)", unit: "score", color: "#F59E0B" },
          { key: "gad7", label: "GAD-7 Anxiety Index", unit: "score", color: "#3B82F6" },
          { key: "wellnessScale", label: "Functional Wellness Index", unit: "%", color: "#10B981" }
        );
      } else if (patient.id === "pat-02") {
        defaultList.push(
          { key: "phq9", label: "PHQ-9 Depression Index", unit: "score", color: "#8B5CF6" },
          { key: "kneeStiffness", label: "Knee Stiffness (WOMAC)", unit: "%", color: "#EF4444" }
        );
      } else {
        defaultList.push(
          { key: "gad7", label: "GAD-7 Postpartum Anxiety", unit: "score", color: "#3B82F6" },
          { key: "epds", label: "EPDS Depression Score", unit: "score", color: "#EC4899" }
        );
      }
    } else {
      // Symptoms
      if (patient.id === "pat-01") {
        defaultList.push(
          { key: "Lower Back Pain", label: "Lower Back Pain Severity", unit: "0-10", color: "#EF4444" },
          { key: "Gestational Reflux", label: "Gestational Reflux Severity", unit: "0-10", color: "#F59E0B" }
        );
      } else if (patient.id === "pat-02") {
        defaultList.push(
          { key: "Knee Joint Stiffness", label: "Knee Joint Stiffness", unit: "0-10", color: "#EF4444" },
          { key: "Uremic Fatigue", label: "Uremic Fatigue Severity", unit: "0-10", color: "#6366F1" }
        );
      } else {
        defaultList.push(
          { key: "Postpartum Anxiety", label: "Postpartum Anxiety Severity", unit: "0-10", color: "#3B82F6" },
          { key: "Asthma Wheezing", label: "Asthma Wheezing Severity", unit: "0-10", color: "#10B981" }
        );
      }
    }
    
    return defaultList;
  };

  const availableMetrics = getAvailableMetrics();

  // Set default metric key when list loaded
  useEffect(() => {
    if (availableMetrics.length > 0 && !availableMetrics.some(m => m.key === newEntryMetric)) {
      setNewEntryMetric(availableMetrics[0].key);
    }
  }, [activeCategory, patient.id]);

  // Handle Recording dynamic observations in client memory
  const handleAddEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newEntryValue);
    if (isNaN(val)) return;

    const metricObj = availableMetrics.find(m => m.key === newEntryMetric);
    if (!metricObj) return;

    // Build the new point or merge with existing date
    const updatedCategoryData = [...(patientData[activeCategory] || [])];
    const existingIndex = updatedCategoryData.findIndex(item => item.date === newEntryDate);

    if (existingIndex > -1) {
      updatedCategoryData[existingIndex] = {
        ...updatedCategoryData[existingIndex],
        [newEntryMetric]: val
      };
    } else {
      updatedCategoryData.push({
        date: newEntryDate,
        [newEntryMetric]: val
      });
    }

    // Sort chronologically by date string
    updatedCategoryData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Update state
    setChartDataset(prev => ({
      ...prev,
      [patient.id]: {
        ...prev[patient.id],
        [activeCategory]: updatedCategoryData
      }
    }));

    // Log the transaction in clinical audit log
    const friendlyName = metricObj.label;
    onLogAudit(
      "RECORD_LONGITUDINAL_METRIC",
      `Recorded manual clinical observation point: [${friendlyName}] = ${val} ${metricObj.unit} on ${newEntryDate} for ${patient.name}.`
    );

    setIsSuccess(true);
    setNewEntryValue("");
    setTimeout(() => {
      setIsSuccess(false);
      setIsAddingEntry(false);
    }, 1200);
  };

  // Format date for chart axis label (e.g., "Jun 12")
  const formatDateLabel = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  // Check if current values exceed thresholds to show clinical highlight boxes
  const getAbnormalAlerts = () => {
    const alerts: { metricLabel: string; value: number; ref: any; severity: "warning" | "critical" }[] = [];
    if (records.length === 0) return alerts;

    // Examine latest record
    const latestRecord = records[records.length - 1];
    
    availableMetrics.forEach(m => {
      const val = latestRecord[m.key];
      if (val !== undefined && val !== null) {
        const bounds = REFERENCE_RANGES[m.key as keyof typeof REFERENCE_RANGES];
        if (bounds) {
          if (val > bounds.max) {
            alerts.push({
              metricLabel: m.label,
              value: val,
              ref: bounds,
              severity: m.key === "egfr" && val < 30 ? "critical" : "warning"
            });
          } else if (val < bounds.min) {
            alerts.push({
              metricLabel: m.label,
              value: val,
              ref: bounds,
              severity: m.key === "egfr" && val < 30 ? "critical" : "warning"
            });
          }
        }
      }
    });

    return alerts;
  };

  const activeAlerts = getAbnormalAlerts();

  return (
    <div className="flex flex-col h-full justify-between" id="longitudinal-trends-viewer">
      {/* Category Toggle Headers */}
      <div className="flex flex-col space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-500 animate-pulse" />
              Longitudinal Clinical Trend Station
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              Interact, filter, and track physiological trends alongside patient response parameters
            </p>
          </div>

          <button
            onClick={() => setIsAddingEntry(!isAddingEntry)}
            className="px-2 py-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100/80 rounded-lg transition-all flex items-center gap-1 border border-blue-200 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Record Observation
          </button>
        </div>

        {/* Categories Toggles */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveCategory("symptoms")}
            className={`py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeCategory === "symptoms"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🧠 Symptoms
          </button>
          <button
            onClick={() => setActiveCategory("vitals")}
            className={`py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeCategory === "vitals"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🌡️ Vitals
          </button>
          <button
            onClick={() => setActiveCategory("labs")}
            className={`py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeCategory === "labs"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🧪 Labs
          </button>
          <button
            onClick={() => setActiveCategory("pros")}
            className={`py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeCategory === "pros"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            📋 PROs
          </button>
        </div>
      </div>

      {/* Main Panel Content (Interlaced with Form or Recharts) */}
      <div className="flex-1 min-h-[220px] relative">
        <AnimatePresence mode="wait">
          {isAddingEntry ? (
            /* Clinician Observation Input Form overlay */
            <motion.form
              key="observation-form"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              onSubmit={handleAddEntrySubmit}
              className="absolute inset-0 bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-xs z-20"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                    <Activity className="w-3 h-3 text-blue-500" /> New Observation Point
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingEntry(false)}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Select Metric Parameter */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                      Parameter Name
                    </label>
                    <select
                      value={newEntryMetric}
                      onChange={(e) => setNewEntryMetric(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 font-bold focus:outline-hidden focus:border-blue-500 cursor-pointer"
                    >
                      {availableMetrics.map(m => (
                        <option key={m.key} value={m.key}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Date */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                      Observation Date
                    </label>
                    <input
                      type="date"
                      required
                      value={newEntryDate}
                      onChange={(e) => setNewEntryDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-bold focus:outline-hidden focus:border-blue-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Enter value */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                    Observed Metric Value ({availableMetrics.find(m => m.key === newEntryMetric)?.unit || "0-10"})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 120, 7.8, or 5"
                      value={newEntryValue}
                      onChange={(e) => setNewEntryValue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-hidden focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-1.5 text-[10px] text-slate-400 font-mono font-bold">
                      {availableMetrics.find(m => m.key === newEntryMetric)?.unit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSuccess}
                  className={`w-full font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                    isSuccess
                      ? "bg-emerald-600 text-white"
                      : "bg-[#0F172A] hover:bg-black text-white"
                  }`}
                >
                  {isSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Clinical Point Saved ✓
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Save to Local Patient Profile
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          ) : null}
        </AnimatePresence>

        {/* High-Fidelity Recharts Area */}
        {records.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={records} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 9, fill: "#94A3B8", fontWeight: "600" }} 
                tickFormatter={formatDateLabel}
              />
              <YAxis 
                tick={{ fontSize: 9, fill: "#94A3B8", fontWeight: "600" }} 
                domain={activeCategory === "symptoms" ? [0, 10] : ["auto", "auto"]}
              />
              <Tooltip 
                contentStyle={{ background: "#0F172A", borderRadius: "12px", border: "none", color: "#FFF", fontSize: "11px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                labelFormatter={(label) => `Observed: ${new Date(label).toLocaleDateString("en-CA", { dateStyle: "long" })}`}
              />
              <Legend wrapperStyle={{ fontSize: "10px", fontWeight: "bold", paddingTop: "5px" }} />
              
              {availableMetrics.map(metric => (
                <Line 
                  key={metric.key}
                  type="monotone" 
                  dataKey={metric.key} 
                  stroke={metric.color} 
                  strokeWidth={3} 
                  activeDot={{ r: 6 }} 
                  name={`${metric.label} (${metric.unit})`}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
            <Info className="w-8 h-8 text-slate-300 mb-1" />
            <p className="text-xs font-semibold">No longitudinal data registered for {activeCategory}</p>
            <p className="text-[10px] text-slate-400">Click "Record Observation" above to register clinical telemetry</p>
          </div>
        )}
      </div>

      {/* Under-Graph Context Banner (Medical Reference/Threshold Indicators) */}
      <div className="mt-4 border-t border-slate-100 pt-3">
        <AnimatePresence mode="wait">
          {activeAlerts.length > 0 ? (
            /* Warning/Alert box when abnormal values are visible */
            <motion.div 
              key="abnormal-alerts"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              className={`p-2.5 rounded-xl border flex items-center justify-between text-[10px] leading-snug font-medium ${
                activeAlerts.some(a => a.severity === "critical")
                  ? "bg-rose-50 border-rose-200 text-rose-950"
                  : "bg-amber-50 border-amber-200 text-amber-950"
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${activeAlerts.some(a => a.severity === "critical") ? "text-rose-600 animate-pulse" : "text-amber-600"}`} />
                <div>
                  <span className="font-extrabold block">Clinical Out-Of-Range Detected</span>
                  <p className="text-[9px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                    {activeAlerts.map(alert => (
                      <span key={alert.metricLabel} className="block">
                        • {alert.metricLabel} latest reading is <strong className={alert.severity === "critical" ? "text-rose-600" : "text-amber-700"}>{alert.value}</strong> (Ref range: {alert.ref.min}-{alert.ref.max} {alert.ref.unit})
                      </span>
                    ))}
                  </p>
                </div>
              </div>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase self-start shrink-0 ${
                activeAlerts.some(a => a.severity === "critical")
                  ? "bg-rose-100 text-rose-800"
                  : "bg-amber-100 text-amber-800"
              }`}>
                {activeAlerts.some(a => a.severity === "critical") ? "Immediate Review" : "Attention"}
              </span>
            </motion.div>
          ) : (
            /* Green Cleared indicator */
            <motion.div 
              key="cleared-ref"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              className="bg-slate-50 border border-slate-150 p-2.5 rounded-xl flex items-center justify-between text-[10px] font-medium text-slate-600"
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Longitudinal observations align with therapeutic standards</span>
              </div>
              <span className="text-[9px] font-extrabold text-slate-400 font-mono uppercase">
                Ref Ranges Applied
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
