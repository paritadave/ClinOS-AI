import React from "react";
import { Sparkles, ShieldAlert, Heart, CalendarDays, CheckCircle2 } from "lucide-react";
import { Patient } from "../types";

interface AIPatientSummaryProps {
  patient: Patient;
}

export default function AIPatientSummary({ patient }: AIPatientSummaryProps) {
  // Generate highly professional, context-rich summary points based on patient profile
  const getSummaryData = () => {
    if (patient.id === "pat-01" || patient.name.includes("Sarah")) {
      return {
        title: "Obstetric & Gestational Briefing",
        ageGender: "32-year-old female",
        gestation: "Pregnant (26 weeks gestation)",
        keyStats: "Last blood pressure: 126/82 mmHg • A1C: Normal (OGTT 7.6 mmol/L)",
        comorbidities: ["Gestational Hypertension", "Postural Chronic Lower Back Pain", "Gestational Diabetes Risk"],
        allergiesAlert: "CRITICAL: Penicillin anaphylaxis risk (avoid all beta-lactams). Avoid NSAIDs in third trimester.",
        recentActivity: "Obstetric Ultrasound completed at 20 weeks (normal fetal anatomy). Referred to Physiotherapy.",
        recommendations: [
          "Evaluate lower back postural strain (physiotherapy pending review).",
          "Monitor daily gestational blood pressure (BP target < 135/85 mmHg).",
          "Prepare postpartum anxiety and thyroiditis pre-screening gaps checklist."
        ],
        badgeColor: "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100"
      };
    } else if (patient.id === "pat-02" || patient.name.includes("Robert")) {
      return {
        title: "Geriatric Nephrology & Cardiology Briefing",
        ageGender: "68-year-old male",
        gestation: "Standard Adult Male",
        keyStats: "eGFR: 28 mL/min/1.73m² (Critical drop) • HbA1c: 7.8% • INR: 2.4 (Therapeutic)",
        comorbidities: ["Type 2 Diabetes", "Chronic Kidney Disease (Stage 4)", "Hypertension", "Atrial Fibrillation"],
        allergiesAlert: "CRITICAL: Sulfa drugs (hypersensitivity risk). Metformin is STRICTLY CONTRAINDICATED (eGFR < 30). Discontinue NSAIDs.",
        recentActivity: "Discontinued Ibuprofen and down-dosed Metformin. Pending urgent Nephrology consult (St. Paul's).",
        recommendations: [
          "Complete Metformin-to-Insulin transition clinical audit.",
          "Urgent Nephrology review due to severe eGFR drop below 30.",
          "Check weekly therapeutic Warfarin INR targets (target range 2.0 - 3.0)."
        ],
        badgeColor: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
      };
    } else if (patient.id === "pat-03" || patient.name.includes("Leo")) {
      return {
        title: "Pediatric Asthma & Allergy Briefing",
        ageGender: "8-year-old male",
        gestation: "Pediatric Patient",
        keyStats: "Peak Flow: 225 L/min • Peanut IgE: 45.2 kU/L (Severe anaphylaxis risk)",
        comorbidities: ["Mild Persistent Asthma Bronchiale", "Atopic Dermatitis (Eczema)", "Peanut Anaphylaxis"],
        allergiesAlert: "CRITICAL: Severe Peanut Anaphylaxis. Amoxicillin allergy (Developed hives; avoid all aminopenicillins).",
        recentActivity: "Pediatric Allergist consult completed. Epinephrine Auto-Injector (EpiPen Jr.) verified.",
        recommendations: [
          "Review Pediatric Written Asthma Action Plan (WAAP) with parents/school staff.",
          "Confirm active, unexpired EpiPen Jr. (0.15mg) presence at home and school.",
          "Co-design barrier skin hydration routine with daily emollient moisturization."
        ],
        badgeColor: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
      };
    } else {
      // Dynamic fallback for newly enrolled patients
      const age = patient.birthDate ? (new Date().getFullYear() - new Date(patient.birthDate).getFullYear()) : 30;
      return {
        title: "Active EMR Patient Briefing",
        ageGender: `${age}-year-old ${patient.gender.toLowerCase()}`,
        gestation: patient.pregnancyStatus !== "None" ? `${patient.pregnancyStatus} Status` : "Standard",
        keyStats: `PHN: ${patient.phn} (${patient.province}) • Initial intake profile`,
        comorbidities: patient.conditions.length > 0 ? patient.conditions : ["No documented chronic conditions"],
        allergiesAlert: patient.allergies.length > 0 
          ? `Documented Allergies: ${patient.allergies.join(", ")}` 
          : "No documented active allergies or safety alerts.",
        recentActivity: "Patient enrolled in clinical directory. Initial EMR baseline records established.",
        recommendations: [
          "Perform clinical history reconciliation and verify pharmacy links.",
          "Check provincial immunization registries and school/work entry gaps.",
          "Establish baseline diagnostic blood work panel if indicated."
        ],
        badgeColor: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
      };
    }
  };

  const summary = getSummaryData();

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl border border-slate-700 shadow-md p-5 relative overflow-hidden" id="ai-patient-summary-card">
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:30px_30px] opacity-10" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
        {/* Left Column: Demographics, Highlights & Diagnoses */}
        <div className="space-y-3.5 max-w-xl flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" id="badge-ai-briefing">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              ClinOS AI Clinical Briefing
            </span>
            <span className="text-[10px] text-slate-400 font-mono" id="summary-update-time">Last updated: Today</span>
          </div>

          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2" id="summary-patient-name">
              {patient.name} 
              <span className="text-slate-400 text-xs font-normal">
                ({summary.ageGender} • DOB: {patient.birthDate})
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-300 font-semibold" id="summary-subtitle">
              <span className="text-indigo-400 font-mono font-bold uppercase tracking-wider">{summary.title}</span>
              <span className="text-slate-500">•</span>
              <span className="bg-slate-800 text-slate-200 border border-slate-700 px-2 py-0.5 rounded-md font-mono text-[10px]">
                PHN: {patient.phn}
              </span>
              {patient.pregnancyStatus !== "None" && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="bg-rose-950/60 text-rose-300 border border-rose-900/40 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase">
                    {patient.pregnancyStatus}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Active Diagnoses / Comorbidities */}
          <div id="summary-conditions-section">
            <span className="text-slate-400 text-[9px] uppercase font-extrabold tracking-wider block mb-1.5">
              Active Diagnoses & Comorbidities
            </span>
            <div className="flex flex-wrap gap-1.5" id="summary-conditions-tags">
              {summary.comorbidities.map((condition, idx) => (
                <span 
                  key={idx} 
                  className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 text-[10.5px] px-2.5 py-0.5 rounded-md font-medium tracking-wide transition-colors"
                >
                  {condition}
                </span>
              ))}
            </div>
          </div>

          {/* Key Highlights */}
          <div className="bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-700/40 text-xs leading-relaxed text-slate-300 font-medium" id="summary-highlights-box">
            <span className="text-indigo-300 text-[9px] uppercase font-extrabold tracking-wider block mb-1">
              Key Diagnostic Highlights & Labs
            </span>
            <p className="text-slate-200 leading-relaxed font-sans">{summary.keyStats}</p>
          </div>
        </div>

        {/* Right Column: Dynamic Bullet Recommendations */}
        <div className="w-full md:w-80 bg-white/5 backdrop-blur-xs rounded-xl p-4 border border-white/10 space-y-3 shrink-0" id="summary-recommendations-box">
          <span className="text-indigo-300 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5" id="title-ai-gaps">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            AI Co-Pilot Care Gaps
          </span>

          <ul className="space-y-2 text-[11px] text-slate-200" id="list-recommendations">
            {summary.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Safety Alert Strip */}
      <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-start gap-2.5 text-rose-300 text-xs font-medium" id="summary-safety-strip">
        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed bg-rose-950/40 border border-rose-900/30 rounded-lg px-2.5 py-1 w-full text-rose-200">
          {summary.allergiesAlert}
        </span>
      </div>
    </div>
  );
}
