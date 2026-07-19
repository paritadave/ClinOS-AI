import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Syringe, 
  FileText, 
  Plus, 
  Check, 
  Info, 
  TrendingUp, 
  BookOpen, 
  Sparkles, 
  X,
  AlertCircle
} from "lucide-react";
import { Patient } from "../types";

// Official Clinical Guidelines & Preventative Care Recommendations by Patient Diagnosis
interface CareGap {
  id: string;
  category: "screening" | "vaccination" | "lifestyle";
  title: string;
  recommendation: string;
  evidenceSource: string;
  status: "Overdue" | "Due" | "Completed" | "Scheduled";
  dueDate: string;
  chronicConditionTag: string;
  severity: "high" | "medium" | "low";
}

const INITIAL_CARE_GAPS: Record<string, CareGap[]> = {
  // Sarah Jenkins (Pregnancy Hypertension, gestational diabetes risk)
  "pat-01": [
    {
      id: "gap-1",
      category: "screening",
      title: "Urine Protein / Albumin-to-Creatinine Ratio (ACR)",
      recommendation: "Bi-weekly screening recommended in gestational hypertension to monitor for preeclampsia development.",
      evidenceSource: "SOGC Hypertension in Pregnancy Guidelines (2022)",
      status: "Overdue",
      dueDate: "2026-07-10",
      chronicConditionTag: "Gestational Hypertension",
      severity: "high"
    },
    {
      id: "gap-2",
      category: "vaccination",
      title: "Tdap Vaccination (Pertussis booster)",
      recommendation: "1 dose of Tdap vaccine recommended during each pregnancy, ideally between 27 and 32 weeks of gestation.",
      evidenceSource: "Public Health Agency of Canada (NACI)",
      status: "Overdue",
      dueDate: "2026-07-01",
      chronicConditionTag: "Pregnancy Wellness",
      severity: "high"
    },
    {
      id: "gap-3",
      category: "screening",
      title: "Postpartum Glucose Tolerance Test (OGTT) Planning",
      recommendation: "Given borderline elevated gestational readings, schedule oral glucose screening at 6-12 weeks postpartum.",
      evidenceSource: "Diabetes Canada Clinical Practice Guidelines",
      status: "Due",
      dueDate: "2026-09-15",
      chronicConditionTag: "Gestational Diabetes Risk",
      severity: "medium"
    },
    {
      id: "gap-4",
      category: "vaccination",
      title: "Seasonal Influenza Vaccine",
      recommendation: "Annual inactivated influenza vaccination is safe and highly recommended for all pregnant individuals.",
      evidenceSource: "SOGC Maternal Immunization Consensus",
      status: "Completed",
      dueDate: "2025-11-15",
      chronicConditionTag: "Pregnancy Wellness",
      severity: "medium"
    },
    {
      id: "gap-5",
      category: "screening",
      title: "Postural Back Pain Physiotherapy Follow-up",
      recommendation: "Assess posture changes and pelvic girdle alignment following 4 weeks of prescribed home exercises.",
      evidenceSource: "Physical Therapy Postpartum Association Standards",
      status: "Due",
      dueDate: "2026-07-25",
      chronicConditionTag: "Lower Back Postural Pain",
      severity: "low"
    }
  ],
  // Robert Vance (CKD Stage 4, Diabetes, Hypertension, AFib)
  "pat-02": [
    {
      id: "gap-1",
      category: "vaccination",
      title: "Pneumococcal Vaccination (PCV20 / PPSV23)",
      recommendation: "Overdue for pneumococcal conjugate immunization. Indicated for all stage 4 CKD and diabetic adults.",
      evidenceSource: "NACI Guidelines for Immunization of Immunocompromised",
      status: "Overdue",
      dueDate: "2026-05-15",
      chronicConditionTag: "CKD Stage 4 / Diabetes",
      severity: "high"
    },
    {
      id: "gap-2",
      category: "screening",
      title: "Diabetic Retinopathy Screening (Fundus Exam)",
      recommendation: "Annual dilated eye examination is required to detect early microvascular retinal changes.",
      evidenceSource: "Diabetes Canada Clinical Practice Guidelines",
      status: "Overdue",
      dueDate: "2026-06-01",
      chronicConditionTag: "Diabetes Mellitus Type 2",
      severity: "high"
    },
    {
      id: "gap-3",
      category: "screening",
      title: "Comprehensive Diabetic Foot Examination",
      recommendation: "Annual clinical sensory evaluation using 10g monofilament + vascular pulse palpation.",
      evidenceSource: "Wounds Canada / Diabetes Canada Foot Care Guide",
      status: "Due",
      dueDate: "2026-07-30",
      chronicConditionTag: "Diabetes Mellitus Type 2",
      severity: "medium"
    },
    {
      id: "gap-4",
      category: "screening",
      title: "Urine Albumin-to-Creatinine Ratio (ACR)",
      recommendation: "Check renal protein excretion to assess CKD progression alongside eGFR values.",
      evidenceSource: "KDIGO Clinical Practice Guideline for CKD Care",
      status: "Completed",
      dueDate: "2026-07-01",
      chronicConditionTag: "CKD Stage 4",
      severity: "high"
    },
    {
      id: "gap-5",
      category: "screening",
      title: "HbA1c Glycemic Monitoring",
      recommendation: "Standard target HbA1c < 7.5% for elderly patients with severe CKD to prevent hypoglycemic injury.",
      evidenceSource: "Diabetes Canada / Kidney Foundation Consensus",
      status: "Due",
      dueDate: "2026-08-15",
      chronicConditionTag: "Diabetes & Chronic Renal Disease",
      severity: "medium"
    }
  ],
  // Emily Chen (Postpartum Anxiety, Asthma)
  "pat-03": [
    {
      id: "gap-1",
      category: "lifestyle",
      title: "Written Asthma Action Plan (WAAP) Review",
      recommendation: "Co-design personalized peak-flow response plan. Red zone, yellow zone, and emergency criteria.",
      evidenceSource: "Canadian Thoracic Society Asthma Guidelines",
      status: "Overdue",
      dueDate: "2026-06-10",
      chronicConditionTag: "Asthma Bronchiale",
      severity: "high"
    },
    {
      id: "gap-2",
      category: "screening",
      title: "6-Month Postpartum Thyroiditis TSH Screening",
      recommendation: "Given previous postpartum thyroid instability, follow-up serum TSH levels are indicated.",
      evidenceSource: "American Thyroid Association Postpartum Guidelines",
      status: "Due",
      dueDate: "2026-08-01",
      chronicConditionTag: "Postpartum Thyroiditis Risk",
      severity: "medium"
    },
    {
      id: "gap-3",
      category: "screening",
      title: "Cervical Cancer Screening (Pap Smear)",
      recommendation: "Triennial liquid-based cytology screening indicated for adult females aged 25-69.",
      evidenceSource: "Canadian Task Force on Preventive Health Care",
      status: "Overdue",
      dueDate: "2026-04-15",
      chronicConditionTag: "General Preventive Screen",
      severity: "medium"
    },
    {
      id: "gap-4",
      category: "screening",
      title: "Postpartum Depression Index (EPDS) Review",
      recommendation: "Score postpartum anxiety and depressive symptoms at key pediatric check intervals.",
      evidenceSource: "SOGC Maternal Mental Health Recommendations",
      status: "Completed",
      dueDate: "2026-05-10",
      chronicConditionTag: "Postpartum Anxiety (PPA)",
      severity: "high"
    }
  ]
};

export default function PreventativeCareGaps({ 
  patient, 
  onLogAudit 
}: { 
  patient: Patient; 
  onLogAudit: (action: string, details: string) => Promise<void> | void; 
}) {
  const [gapsDataset, setGapsDataset] = useState<Record<string, CareGap[]>>(INITIAL_CARE_GAPS);
  const [selectedGap, setSelectedGap] = useState<CareGap | null>(null);
  
  // Custom interactive gap form states
  const [isAddingCustomGap, setIsAddingCustomGap] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customCategory, setCustomCategory] = useState<"screening" | "vaccination" | "lifestyle">("screening");
  const [customRec, setCustomRec] = useState("");
  const [customSource, setCustomSource] = useState("");
  const [customDueDate, setCustomDueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [customTag, setCustomTag] = useState("Custom Wellness Goal");
  const [customSeverity, setCustomSeverity] = useState<"high" | "medium" | "low">("medium");

  const [filterCategory, setFilterCategory] = useState<"all" | "screening" | "vaccination" | "lifestyle">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "outstanding" | "completed">("all");

  // Load patient specific care gaps or generate default ones if missing
  const getPatientGaps = (): CareGap[] => {
    if (gapsDataset[patient.id]) {
      return gapsDataset[patient.id];
    }
    
    // Generate simple age-based default items for any dynamic added patients
    return [
      {
        id: `gen-gap-1`,
        category: "screening",
        title: "Annual Cardiovascular Risk Check",
        recommendation: "Assess blood pressure, Framingham score, and lipid panels regularly.",
        evidenceSource: "Canadian Task Force on Preventive Health",
        status: "Due",
        dueDate: "2026-09-01",
        chronicConditionTag: "General Wellness",
        severity: "medium"
      },
      {
        id: `gen-gap-2`,
        category: "vaccination",
        title: "Tetanus-Diphtheria booster (Td)",
        recommendation: "A decennial booster is recommended for all healthy adults.",
        evidenceSource: "NACI immunization guidelines",
        status: "Overdue",
        dueDate: "2026-05-15",
        chronicConditionTag: "Immunization Alignment",
        severity: "low"
      }
    ];
  };

  const patientGaps = getPatientGaps();

  // Reset states when patient switches
  useEffect(() => {
    setSelectedGap(null);
    setIsAddingCustomGap(false);
    clearCustomForm();
  }, [patient]);

  const clearCustomForm = () => {
    setCustomTitle("");
    setCustomRec("");
    setCustomSource("");
    setCustomTag("Custom Wellness Goal");
    setCustomSeverity("medium");
  };

  // Compute stats for compliance rings
  const totalGaps = patientGaps.length;
  const completedGaps = patientGaps.filter(g => g.status === "Completed" || g.status === "Scheduled").length;
  const overdueGaps = patientGaps.filter(g => g.status === "Overdue").length;
  const dueGaps = patientGaps.filter(g => g.status === "Due").length;
  const compliancePercentage = totalGaps > 0 ? Math.round((completedGaps / totalGaps) * 100) : 100;

  // Perform dynamic status modification (Schedule screening, Administer vaccine, Mark completed)
  const handleModifyStatus = (gapId: string, nextStatus: "Completed" | "Scheduled" | "Due") => {
    const activeGaps = [...patientGaps];
    const index = activeGaps.findIndex(g => g.id === gapId);
    if (index === -1) return;

    const originalGap = activeGaps[index];
    const updatedGap = { ...originalGap, status: nextStatus };
    activeGaps[index] = updatedGap;

    setGapsDataset(prev => ({
      ...prev,
      [patient.id || "default"]: activeGaps
    }));

    if (selectedGap && selectedGap.id === gapId) {
      setSelectedGap(updatedGap);
    }

    // Dynamic Clinical Audit Logging
    const actionMap = {
      Completed: "RESOLVE_CARE_GAP_COMPLETE",
      Scheduled: "RESOLVE_CARE_GAP_SCHEDULE",
      Due: "REVERT_CARE_GAP_STATUS"
    };

    onLogAudit(
      actionMap[nextStatus],
      `Updated preventative care gap [${originalGap.title}] status for ${patient.name} from "${originalGap.status}" to "${nextStatus}". Guidelines referenced: ${originalGap.evidenceSource}.`
    );
  };

  // Add custom preventive care goal
  const handleAddCustomGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newGap: CareGap = {
      id: `custom-${Date.now()}`,
      category: customCategory,
      title: customTitle,
      recommendation: customRec || "Custom preventative guideline mapped by clinician.",
      evidenceSource: customSource || "Clinician Custom Directive",
      status: "Due",
      dueDate: customDueDate,
      chronicConditionTag: customTag,
      severity: customSeverity
    };

    const updatedGaps = [...patientGaps, newGap];
    setGapsDataset(prev => ({
      ...prev,
      [patient.id || "default"]: updatedGaps
    }));

    onLogAudit(
      "CREATE_CUSTOM_PREVENTATIVE_GOAL",
      `Added custom preventative health goal: [${customTitle}] target date ${customDueDate} mapped for ${patient.name}.`
    );

    setIsAddingCustomGap(false);
    clearCustomForm();
  };

  // Filter conditions
  const filteredGaps = patientGaps.filter(gap => {
    const matchesCategory = filterCategory === "all" || gap.category === filterCategory;
    
    let matchesStatus = true;
    if (filterStatus === "outstanding") {
      matchesStatus = gap.status === "Overdue" || gap.status === "Due";
    } else if (filterStatus === "completed") {
      matchesStatus = gap.status === "Completed" || gap.status === "Scheduled";
    }

    return matchesCategory && matchesStatus;
  });

  return (
    <div className="flex flex-col h-full bg-white text-slate-800" id="preventative-care-gap-system">
      
      {/* Top Compliance Tracker & Action Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5 border-b border-slate-100 pb-5">
        
        {/* Compliance Progress Widget */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Compliance Index
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 leading-none">{compliancePercentage}%</span>
              <span className="text-[10px] text-slate-400 font-bold">Health Score</span>
            </div>
            <p className="text-[9px] text-slate-500 leading-relaxed font-semibold max-w-[150px]">
              {completedGaps} of {totalGaps} standards scheduled or finalized
            </p>
          </div>

          {/* Animated Gauge Ring */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="26"
                className="stroke-slate-200 fill-transparent"
                strokeWidth="4"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                className={`fill-transparent transition-all duration-700 ease-out ${
                  compliancePercentage > 70 
                    ? "stroke-emerald-500" 
                    : compliancePercentage > 40 
                      ? "stroke-amber-500" 
                      : "stroke-rose-500"
                }`}
                strokeWidth="4"
                strokeDasharray={163.3}
                strokeDashoffset={163.3 - (163.3 * compliancePercentage) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-extrabold text-slate-700">
              {completedGaps}/{totalGaps}
            </span>
          </div>
        </div>

        {/* Dynamic Highlight summary boxes */}
        <div className="lg:col-span-7 grid grid-cols-3 gap-3">
          
          {/* Overdue alerts */}
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block">Overdue Now</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-rose-700">{overdueGaps}</span>
              <span className="text-[8px] text-rose-500 font-bold">Standard{overdueGaps !== 1 && "s"}</span>
            </div>
            <span className="text-[8px] text-rose-400 font-bold uppercase mt-1">Requires Action</span>
          </div>

          {/* Due soon */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider block">Due Soon</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-amber-700">{dueGaps}</span>
              <span className="text-[8px] text-amber-500 font-bold">Standard{dueGaps !== 1 && "s"}</span>
            </div>
            <span className="text-[8px] text-amber-400 font-bold uppercase mt-1">Plan Preventive</span>
          </div>

          {/* Completed / Saved */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider block">Secured</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-emerald-700">{completedGaps}</span>
              <span className="text-[8px] text-emerald-500 font-bold">Aligned</span>
            </div>
            <span className="text-[8px] text-emerald-400 font-bold uppercase mt-1">Compliant ✓</span>
          </div>

        </div>

      </div>

      {/* Interactive Controls & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        
        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-1.5">
          
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 rounded-lg px-2.5 py-1.5 cursor-pointer outline-hidden focus:border-blue-500"
          >
            <option value="all">All Guidelines</option>
            <option value="screening">🔬 Screenings</option>
            <option value="vaccination">💉 Vaccinations</option>
            <option value="lifestyle">🏃 Care Goals</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 rounded-lg px-2.5 py-1.5 cursor-pointer outline-hidden focus:border-blue-500"
          >
            <option value="all">All States</option>
            <option value="outstanding">⚠️ Outstanding Gaps</option>
            <option value="completed">✓ Secured Standards</option>
          </select>

        </div>

        {/* Add custom preventative task */}
        <button
          onClick={() => setIsAddingCustomGap(!isAddingCustomGap)}
          className="px-2.5 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100/80 rounded-lg border border-blue-200 flex items-center justify-center gap-1 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Set Customized Care Goal
        </button>

      </div>

      {/* Main Core Area: List of Care Gaps & Side Guideline Details */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 flex-1 relative min-h-[300px]">
        
        {/* Care Gaps Cards (XL: 7 columns) */}
        <div className={`space-y-2.5 overflow-y-auto max-h-[360px] custom-scrollbar pr-1 ${selectedGap ? "xl:col-span-7" : "xl:col-span-12"}`}>
          
          {/* AnimatePresence for custom overlay form */}
          <AnimatePresence mode="wait">
            {isAddingCustomGap && (
              <motion.form
                key="custom-gap-form"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleAddCustomGoal}
                className="bg-slate-50 border border-blue-200 p-4 rounded-2xl space-y-3 shadow-xs mb-3"
              >
                <div className="flex items-center justify-between border-b border-slate-200/65 pb-1.5">
                  <span className="text-[10px] font-extrabold uppercase text-blue-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 fill-blue-100" /> New Patient Preventative Directive
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingCustomGap(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold block">Gap/Goal Title</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Diabetic Retinopathy Examination" 
                      value={customTitle} 
                      onChange={e => setCustomTitle(e.target.value)} 
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold block">Category</label>
                    <select
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-hidden"
                    >
                      <option value="screening">🔬 Screening</option>
                      <option value="vaccination">💉 Vaccination</option>
                      <option value="lifestyle">🏃 Chronic Lifestyle</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold block">Official Guideline Recommendation</label>
                  <textarea 
                    rows={2} 
                    placeholder="Enter precise clinical guidelines criteria for patient demographics..." 
                    value={customRec} 
                    onChange={e => setCustomRec(e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-hidden resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold block">Evidence Source</label>
                    <input 
                      type="text" 
                      placeholder="e.g. USPSTF Grade A" 
                      value={customSource} 
                      onChange={e => setCustomSource(e.target.value)} 
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold block">Target Date</label>
                    <input 
                      type="date" 
                      value={customDueDate} 
                      onChange={e => setCustomDueDate(e.target.value)} 
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold block">Chronic Tag / Group</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Diabetes Mellitus" 
                      value={customTag} 
                      onChange={e => setCustomTag(e.target.value)} 
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1 border-t border-slate-200/65">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingCustomGap(false)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-extrabold"
                  >
                    Log Guideline
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* List of active CareGaps */}
          {filteredGaps.length > 0 ? (
            filteredGaps.map(gap => {
              const isSelected = selectedGap?.id === gap.id;
              
              // Define color schemes for gaps
              const borderStyles = 
                gap.status === "Overdue" 
                  ? "border-rose-200 bg-rose-50/20 hover:bg-rose-50/40" 
                  : gap.status === "Completed" || gap.status === "Scheduled"
                    ? "border-emerald-200 bg-emerald-50/10 hover:bg-emerald-50/25"
                    : "border-slate-200 bg-white hover:bg-slate-50/40";

              return (
                <div
                  key={gap.id}
                  onClick={() => setSelectedGap(gap)}
                  className={`border rounded-2xl p-3.5 transition-all cursor-pointer flex items-start justify-between gap-3 ${borderStyles} ${
                    isSelected ? "ring-2 ring-indigo-500 shadow-sm" : ""
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    
                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        gap.category === "screening" 
                          ? "bg-purple-100 text-purple-700" 
                          : gap.category === "vaccination" 
                            ? "bg-blue-100 text-blue-700" 
                            : "bg-amber-100 text-amber-700"
                      }`}>
                        {gap.category === "screening" ? "🔬 Screening" : gap.category === "vaccination" ? "💉 Immunization" : "🏃 Lifestyle"}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono font-bold">
                        {gap.chronicConditionTag}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-xs font-extrabold text-slate-800 leading-snug truncate">
                      {gap.title}
                    </h4>

                    {/* Due details */}
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Due: {gap.dueDate}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        gap.status === "Overdue" 
                          ? "bg-rose-100 text-rose-700" 
                          : gap.status === "Due"
                            ? "bg-amber-100 text-amber-700"
                            : gap.status === "Scheduled"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {gap.status}
                      </span>
                    </div>

                  </div>

                  {/* Actions shortcut on the right */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0 self-center">
                    {gap.status === "Overdue" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModifyStatus(gap.id, "Completed");
                        }}
                        className="px-2 py-1 text-[9px] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg flex items-center gap-0.5 transition-colors cursor-pointer"
                      >
                        <Check className="w-2.5 h-2.5" /> Resolve Gap
                      </button>
                    )}
                    {gap.status === "Due" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModifyStatus(gap.id, "Scheduled");
                        }}
                        className="px-2 py-1 text-[9px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg flex items-center gap-0.5 transition-colors cursor-pointer"
                      >
                        <Clock className="w-2.5 h-2.5" /> Schedule
                      </button>
                    )}
                    {(gap.status === "Completed" || gap.status === "Scheduled") && (
                      <span className="text-emerald-600 flex items-center gap-0.5 text-[10px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Secured
                      </span>
                    )}
                  </div>

                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed">
              <AlertCircle className="w-8 h-8 text-slate-300 mb-1.5" />
              <p className="text-xs font-bold">No preventative standards filtered</p>
              <p className="text-[10px] text-slate-400">Try adjusting your category or state criteria selectors</p>
            </div>
          )}

        </div>

        {/* Guideline Details drawer on the right (XL: 5 columns) */}
        <AnimatePresence>
          {selectedGap ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="xl:col-span-5 bg-[#0F172A] text-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-lg max-h-[360px] overflow-y-auto"
            >
              <div className="space-y-4">
                
                {/* Header detail */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest block">Clinical Guideline Audit</span>
                    <h4 className="text-xs font-black text-white leading-snug mt-1">{selectedGap.title}</h4>
                  </div>
                  <button 
                    onClick={() => setSelectedGap(null)}
                    className="p-1 text-slate-500 hover:text-slate-300 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-slate-400 font-medium">Validation Source:</span>
                  <span className="bg-indigo-950 text-indigo-300 border border-indigo-900 font-mono font-bold px-1.5 py-0.5 rounded text-[9px]">
                    {selectedGap.evidenceSource}
                  </span>
                </div>

                {/* Chronic disease clinical reasoning */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[10px]">
                  <span className="font-extrabold text-slate-400 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Guideline Rationale & Criteria:
                  </span>
                  <p className="text-slate-300 leading-relaxed font-medium">
                    {selectedGap.recommendation}
                  </p>
                </div>

                {/* Target Date alert */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Regulatory Target Expiration:</span>
                  <strong className="text-white font-mono">{selectedGap.dueDate}</strong>
                </div>

              </div>

              {/* Resolution Action Station */}
              <div className="pt-4 border-t border-slate-800 mt-4 flex items-center gap-2">
                
                {selectedGap.status === "Overdue" && (
                  <button
                    onClick={() => handleModifyStatus(selectedGap.id, "Completed")}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] py-2 rounded-xl text-center transition-colors shadow-xs cursor-pointer"
                  >
                    Administer / Record Screening Done
                  </button>
                )}

                {selectedGap.status === "Due" && (
                  <button
                    onClick={() => handleModifyStatus(selectedGap.id, "Scheduled")}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] py-2 rounded-xl text-center transition-colors shadow-xs cursor-pointer"
                  >
                    Schedule Action Appointment
                  </button>
                )}

                {(selectedGap.status === "Completed" || selectedGap.status === "Scheduled") && (
                  <button
                    onClick={() => handleModifyStatus(selectedGap.id, "Due")}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] py-2 rounded-xl text-center transition-colors cursor-pointer"
                  >
                    Mark as Pending / Outstanding
                  </button>
                )}

              </div>

            </motion.div>
          ) : (
            <div className="hidden xl:flex xl:col-span-5 border border-dashed border-slate-200 rounded-2xl flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-50/50">
              <ShieldAlert className="w-8 h-8 text-slate-300 mb-2 animate-bounce" />
              <p className="text-xs font-bold">Select Guideline Element</p>
              <p className="text-[10px] text-slate-400 max-w-[180px] mx-auto mt-1 leading-relaxed">
                Click any standard on the left to inspect evidence, rationales, and resolve care gaps instantly.
              </p>
            </div>
          )}
        </AnimatePresence>

      </div>

      {/* Footer warning bar */}
      <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-[9px] font-mono font-bold text-slate-400 uppercase">
        <span>Preventative Compliance Protocol R2</span>
        <span>Secure ClinOS Session</span>
      </div>

    </div>
  );
}
