import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Activity, 
  Pill, 
  FileText, 
  Search, 
  Clock, 
  ChevronRight, 
  Sliders, 
  Plus, 
  Layers, 
  HelpCircle,
  Sparkles,
  ClipboardList
} from "lucide-react";
import { Patient, ImagingResult } from "../types";

interface TimelinePanelProps {
  patient: Patient;
  onRefresh: () => void;
  onLogAudit: (action: string, details: string) => void;
}

export default function TimelinePanel({ patient, onRefresh, onLogAudit }: TimelinePanelProps) {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedImaging, setSelectedImaging] = useState<ImagingResult | null>(null);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [summaryOutput, setSummaryOutput] = useState<{
    clinicalOverview: string;
    patientExplanation: string;
    recommendedFollowUps: string[];
  } | null>(null);

  interface TimelineEvent {
    date: string;
    category: string;
    title: string;
    detail: string;
    status: string;
    icon: any;
    color: string;
    originalObject?: ImagingResult;
  }

  // Compile timeline events from patient record
  const timelineEvents: TimelineEvent[] = [
    ...patient.conditions.map(c => ({
      date: "Active",
      category: "condition",
      title: c,
      detail: "Chronic Condition",
      status: "Active",
      icon: Activity,
      color: "text-amber-600 bg-amber-50 border-amber-200"
    })),
    ...patient.currentMedications.map(m => ({
      date: m.startDate,
      category: "medication",
      title: `${m.name} ${m.dosage}`,
      detail: `${m.frequency} • Adherence: ${m.adherence || "Good"}`,
      status: m.status,
      icon: Pill,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200"
    })),
    ...patient.labs.map(l => ({
      date: l.date,
      category: "lab",
      title: l.testName,
      detail: `Value: ${l.value} (Range: ${l.referenceRange})`,
      status: l.status,
      icon: ClipboardList,
      color: l.status === "Critical" 
        ? "text-red-600 bg-red-50 border-red-200" 
        : l.status === "Abnormal" 
        ? "text-orange-600 bg-orange-50 border-orange-200" 
        : "text-blue-600 bg-blue-50 border-blue-200"
    })),
    ...patient.imaging.map(i => ({
      date: i.date,
      category: "imaging",
      title: `${i.type} - ${i.area}`,
      detail: `Status: ${i.status}`,
      status: i.status,
      originalObject: i,
      icon: FileText,
      color: "text-blue-600 bg-blue-50 border-blue-200"
    })),
    ...patient.referrals.map(r => ({
      date: r.date,
      category: "referral",
      title: `Referral: ${r.specialty}`,
      detail: `Consultant: ${r.consultant} • Status: ${r.status}`,
      status: r.status,
      icon: ChevronRight,
      color: "text-purple-600 bg-purple-50 border-purple-200"
    })),
    ...(patient.soapNotes || []).map(s => ({
      date: s.date,
      category: "scribe",
      title: "EMR SOAP Progress Note",
      detail: `Assessment: ${s.assessment} • Summary: ${s.summary || "Manual review note"}`,
      status: "Synced",
      icon: ClipboardList,
      color: "text-indigo-600 bg-indigo-50 border-indigo-200"
    }))
  ];

  const filteredEvents = filterCategory === "all" 
    ? timelineEvents 
    : timelineEvents.filter(e => e.category === filterCategory);

  const handleSummarizeImaging = async (img: ImagingResult) => {
    setSummarizingId(img.id);
    setSelectedImaging(img);
    setSummaryOutput(null);

    try {
      const res = await fetch("/api/imaging/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportText: img.report,
          imagingType: img.type
        })
      });
      const data = await res.json();
      if (data.summary) {
        setSummaryOutput(data.summary);
        onLogAudit("SUMMARIZE_IMAGING_REPORT", `Generated AI imaging summaries for ${img.type} of ${img.area}.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSummarizingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full animate-fade-in" id="timeline-panel">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Unified Patient Timeline
          </h2>
          <p className="text-xs text-slate-400 font-medium">Longitudinal clinical history & imaging tracking</p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {["all", "condition", "medication", "lab", "imaging", "scribe"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                filterCategory === cat 
                  ? "bg-[#0F172A] text-white shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {cat === "all" ? "All" : cat === "lab" ? "Labs" : cat === "scribe" ? "Scribe" : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* Left Side: Timeline Feed */}
        <div className="lg:col-span-6 flex flex-col h-[520px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <ClipboardList className="w-10 h-10 stroke-1 mb-2" />
              <p className="text-sm">No items matching this category filter.</p>
            </div>
          ) : (
            <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-5">
              {filteredEvents.map((evt, idx) => {
                const Icon = evt.icon;
                return (
                  <div key={idx} className="relative group">
                    {/* Circle Node indicator */}
                    <div className="absolute -left-[35px] top-1 bg-white p-1 rounded-full border border-slate-200 z-10">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${evt.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="bg-slate-50/60 hover:bg-slate-50 rounded-xl p-3.5 border border-slate-200 transition-all flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold font-mono uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                            {evt.category}
                          </span>
                          <span className="text-xs text-slate-400 font-mono font-medium">{evt.date}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">{evt.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{evt.detail}</p>
                      </div>

                      {evt.category === "imaging" && evt.originalObject && (
                        <button
                          onClick={() => handleSummarizeImaging(evt.originalObject as ImagingResult)}
                          className="px-3 py-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          Summarize
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Diagnostic Imaging Agent Detail & AI Summarization */}
        <div className="lg:col-span-6 border-l border-slate-100 pl-4 flex flex-col h-[520px] justify-between">
          {selectedImaging ? (
            <div className="flex flex-col h-full overflow-y-auto pr-1">
              <div className="flex items-center justify-between mb-3.5 border-b border-slate-100 pb-2">
                <div>
                  <span className="text-[10px] font-mono uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-100">
                    {selectedImaging.type} Diagnostic Summary
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 mt-1">
                    {selectedImaging.area} ({selectedImaging.date})
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedImaging(null)} 
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer font-medium"
                >
                  Clear Selection
                </button>
              </div>

              {/* Main Report Body */}
              <div className="space-y-4">
                <div>
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Original Radiologist Report
                  </h5>
                  <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3.5 leading-relaxed font-mono whitespace-pre-line max-h-40 overflow-y-auto">
                    {selectedImaging.report}
                  </p>
                </div>

                {summarizingId === selectedImaging.id ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mb-3"
                    />
                    <p className="text-xs font-semibold animate-pulse">Diagnostic Imaging Agent analyzing radiological findings...</p>
                    <p className="text-[10px] text-slate-400 mt-1">Generating layperson explanation and physician review notes</p>
                  </div>
                ) : summaryOutput ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Clinical Overview */}
                    <div className="border border-blue-150 rounded-xl p-3.5 bg-blue-50/10">
                      <h6 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                        Clinical Overview (Physician Facing)
                      </h6>
                      <p className="text-xs text-slate-700 mt-1.5 leading-relaxed font-medium">
                        {summaryOutput.clinicalOverview}
                      </p>
                    </div>

                    {/* Patient Layperson Explanation */}
                    <div className="border border-emerald-100 rounded-xl p-3.5 bg-emerald-50/10">
                      <h6 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Patient-Friendly Explanation (PHIPA Shareable)
                      </h6>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed italic font-medium">
                        "{summaryOutput.patientExplanation}"
                      </p>
                    </div>

                    {/* Follow up Action Items */}
                    <div>
                      <h6 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Safety Recommended Follow-Ups
                      </h6>
                      <ul className="space-y-1.5">
                        {summaryOutput.recommendedFollowUps.map((act, idx) => (
                          <li key={idx} className="text-xs text-slate-600 flex items-start gap-2 font-medium">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                            {act}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center">
                    <p className="text-xs text-slate-500 font-medium">
                      Summary not generated yet. Click "Analyze & Summarize Report" to parse the clinical findings with Gemini.
                    </p>
                    <button
                      onClick={() => handleSummarizeImaging(selectedImaging)}
                      className="mt-3 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Analyze & Summarize Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 h-full">
              <FileText className="w-12 h-12 stroke-1 mb-3 text-slate-300" />
              <h4 className="text-sm font-medium text-slate-700">No Imaging Selected</h4>
              <p className="text-xs text-slate-400 text-center max-w-xs mt-1">
                Select an imaging record (X-Ray, MRI, Ultrasound) from the timeline feed to review or generate an AI layperson summary.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
