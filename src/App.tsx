import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Activity, 
  User, 
  Pill, 
  ShieldCheck, 
  Mic, 
  Clock, 
  ClipboardCheck, 
  TrendingUp, 
  AlertCircle, 
  Bell, 
  Check, 
  ShieldAlert,
  Server,
  FileText,
  Lock,
  HeartPulse,
  Heart,
  CalendarDays,
  LayoutGrid,
  List,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  ClipboardList
} from "lucide-react";
import { Patient, AuditLog, UserRole } from "./types";
import TimelinePanel from "./components/TimelinePanel";
import SafetyCheckPanel from "./components/SafetyCheckPanel";
import ScribePanel from "./components/ScribePanel";
import IntakeHistoryPanel from "./components/IntakeHistoryPanel";
import CompliancePanel from "./components/CompliancePanel";
import HistoryDashboardPanel from "./components/HistoryDashboardPanel";
import AppointmentScheduler from "./components/AppointmentScheduler";
import PatientTakeHomePanel from "./components/PatientTakeHomePanel";
import QuickActionMenu from "./components/QuickActionMenu";

export default function App() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("pat-01");
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.PHYSICIAN);
  const [activeModule, setActiveModule] = useState<"dashboard" | "timeline" | "scribe" | "safety" | "intake" | "compliance" | "appointments" | "patientSummary">("dashboard");
  const [layoutMode, setLayoutMode] = useState<"tabs" | "bento">("bento");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: "critical" | "info" }>>([]);
  
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [quickNotes, setQuickNotes] = useState<Array<{ id: string; patientId: string; content: string; timestamp: string }>>(() => {
    try {
      const saved = localStorage.getItem("clinos_quick_notes");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: "note-1", patientId: "pat-01", content: "Note: Maternal BP is stable but warrants spot ACR evaluation due to mild gestational history.", timestamp: "2026-07-18 14:32" },
      { id: "note-2", patientId: "pat-01", content: "Scheduled pertussis (Tdap) booster for today's visit.", timestamp: "2026-07-18 14:35" },
      { id: "note-3", patientId: "pat-02", content: "eGFR at 28 requires consultation with nephrologist regarding metformin discontinuation strategy.", timestamp: "2026-07-18 11:20" },
      { id: "note-4", patientId: "pat-02", content: "Remind patient regarding annual dilated eye fundus screening.", timestamp: "2026-07-18 11:24" },
      { id: "note-5", patientId: "pat-03", content: "Postpartum mental health: Sertraline tolerated well. Improved GAD-7 / EPDS indicators.", timestamp: "2026-07-18 16:15" },
      { id: "note-6", patientId: "pat-03", content: "Co-design Written Asthma Action Plan today due to minor spring pollen exacerbation.", timestamp: "2026-07-18 16:18" }
    ];
  });

  // Save quick notes to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("clinos_quick_notes", JSON.stringify(quickNotes));
  }, [quickNotes]);

  const handleAddQuickNote = (content: string) => {
    if (!content.trim()) return;
    const nowStr = new Date().toLocaleString("en-CA", { hour12: false }).replace(",", "");
    const newNote = {
      id: "note-" + Date.now(),
      patientId: selectedPatientId,
      content: content.trim(),
      timestamp: nowStr.substring(0, 16)
    };
    setQuickNotes(prev => [newNote, ...prev]);
    const activePat = patients.find(p => p.id === selectedPatientId);
    handleLogAudit("ADD_QUICK_NOTE", `Added persistent clinical scratchpad note for patient ${activePat?.name || "Unknown"}: "${content.substring(0, 40)}..."`);
  };

  const handleDeleteQuickNote = (noteId: string) => {
    const noteToDelete = quickNotes.find(n => n.id === noteId);
    setQuickNotes(prev => prev.filter(n => n.id !== noteId));
    const activePat = patients.find(p => p.id === selectedPatientId);
    handleLogAudit("DELETE_QUICK_NOTE", `Removed persistent clinical scratchpad note for patient ${activePat?.name || "Unknown"}: "${noteToDelete?.content.substring(0, 40)}..."`);
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      // Fetch Patients
      const patientRes = await fetch("/api/patients");
      const patientData = await patientRes.json();
      setPatients(patientData);

      // Fetch Audit Logs
      const auditRes = await fetch("/api/audit-logs");
      const auditData = await auditRes.json();
      setAuditLogs(auditData);

      // Fetch System Health
      const healthRes = await fetch("/api/system-health");
      const healthData = await healthRes.json();
      setSystemHealth(healthData);
    } catch (err) {
      console.error("Error fetching clinical workspace data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Seed an initial clinical notification to demonstrate the real-time alerting requested in PRD
    setNotifications([
      { 
        id: "not-1", 
        message: "ALERT: Robert Vance's latest eGFR is 28 mL/min (Stage 4 Renal Risk). Review active Metformin prescriptions.", 
        type: "critical" 
      }
    ]);
  }, []);

  const handleLogAudit = async (action: string, details: string) => {
    try {
      const activePatientObj = patients.find(p => p.id === selectedPatientId);
      const res = await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          clinicianName: "Dr. Alistair Vance",
          clinicianRole: activeRole,
          details,
          patientId: selectedPatientId,
          patientName: activePatientObj?.name
        })
      });
      const data = await res.json();
      if (data.log) {
        setAuditLogs(prev => [data.log, ...prev]);
      }
    } catch (err) {
      console.error("Failed to write clinical audit log:", err);
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setActiveRole(newRole);
    handleLogAudit("CHANGE_ROLE_PERMISSION", `Clinician changed active session role privilege to ${newRole}.`);
  };

  const handlePatientSelect = (id: string) => {
    setSelectedPatientId(id);
    const selectedPat = patients.find(p => p.id === id);
    if (selectedPat) {
      handleLogAudit("VIEW_PATIENT_RECORD", `Accessed full EMR longitudinal record for ${selectedPat.name}.`);
      
      // Update notifications based on active patient to stay contextually relevant!
      if (selectedPat.id === "pat-02") {
        setNotifications([
          { 
            id: "not-1", 
            message: "ALERT: Robert Vance's latest eGFR is 28 mL/min. Metformin requires review.", 
            type: "critical" 
          }
        ]);
      } else if (selectedPat.id === "pat-01") {
        setNotifications([
          { 
            id: "not-2", 
            message: "Notice: Sarah Jenkins is 26 weeks pregnant. Verify gestational BP ranges.", 
            type: "info" 
          }
        ]);
      } else {
        setNotifications([]);
      }
    }
  };

  const activePatient = patients.find(p => p.id === selectedPatientId);

  const getBentoCards = () => {
    const cards = [
      {
        id: "safety",
        title: "Safety Check Intelligence",
        icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />,
        span: "xl:col-span-6",
        minHeight: "min-h-[500px]",
        focusModule: "safety",
        component: activePatient ? (
          <SafetyCheckPanel 
            patient={activePatient} 
            onRefresh={fetchData} 
            onLogAudit={handleLogAudit} 
          />
        ) : null
      },
      {
        id: "appointments",
        title: "Scheduling & Consults",
        icon: <CalendarDays className="w-3.5 h-3.5 text-blue-600" />,
        span: "xl:col-span-6",
        minHeight: "min-h-[500px]",
        focusModule: "appointments",
        component: activePatient ? (
          <AppointmentScheduler 
            patient={activePatient} 
            onRefresh={fetchData} 
            onLogAudit={handleLogAudit} 
          />
        ) : null
      },
      {
        id: "patientSummary",
        title: "Patient Care Plan Summary (Take-Home Handout)",
        icon: <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/10" />,
        span: "xl:col-span-6",
        minHeight: "min-h-[520px]",
        focusModule: "patientSummary",
        component: activePatient ? (
          <PatientTakeHomePanel 
            patient={activePatient} 
            onLogAudit={handleLogAudit} 
          />
        ) : null
      },
      {
        id: "dashboard",
        title: "Patient History & EMR Sync",
        icon: <HeartPulse className="w-3.5 h-3.5 text-blue-500" />,
        span: "xl:col-span-6",
        minHeight: "min-h-[480px]",
        focusModule: "dashboard",
        component: activePatient ? (
          <HistoryDashboardPanel 
            patient={activePatient} 
            onRefresh={fetchData} 
            onLogAudit={handleLogAudit} 
          />
        ) : null
      },
      {
        id: "scribe",
        title: "Ambient Scribe & Translate",
        icon: <Mic className="w-3.5 h-3.5 text-red-500" />,
        span: "xl:col-span-6",
        minHeight: "min-h-[500px]",
        focusModule: "scribe",
        component: activePatient ? (
          <ScribePanel 
            patient={activePatient} 
            onRefresh={fetchData} 
            onLogAudit={handleLogAudit} 
          />
        ) : null
      },
      {
        id: "timeline",
        title: "Timeline, Labs & Imaging",
        icon: <Clock className="w-3.5 h-3.5 text-indigo-500" />,
        span: "xl:col-span-6",
        minHeight: "min-h-[520px]",
        focusModule: "timeline",
        component: activePatient ? (
          <TimelinePanel 
            patient={activePatient} 
            onRefresh={fetchData} 
            onLogAudit={handleLogAudit} 
          />
        ) : null
      },
      {
        id: "intake",
        title: "Intake Form Diff Engine",
        icon: <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" />,
        span: "xl:col-span-6",
        minHeight: "min-h-[520px]",
        focusModule: "intake",
        component: activePatient ? (
          <IntakeHistoryPanel 
            patient={activePatient} 
            onRefresh={fetchData} 
            onLogAudit={handleLogAudit} 
          />
        ) : null
      }
    ];

    // Rearrange or adjust based on active role!
    if (activeRole === UserRole.PHYSICIAN || activeRole === UserRole.SPECIALIST) {
      // Physician sees 'Safety Alerts' (safety) first! Let's elevate Safety and make it span xl:col-span-8 to be extremely prominent!
      const safetyCard = cards.find(c => c.id === "safety")!;
      safetyCard.span = "xl:col-span-8";
      
      const apptsCard = cards.find(c => c.id === "appointments")!;
      apptsCard.span = "xl:col-span-4";

      const dashboardCard = cards.find(c => c.id === "dashboard")!;
      dashboardCard.span = "xl:col-span-12";

      // Order: Safety, Appointments, Dashboard, Patient Summary, Timeline, Scribe, Intake
      return [
        safetyCard,
        apptsCard,
        dashboardCard,
        cards.find(c => c.id === "patientSummary")!,
        cards.find(c => c.id === "timeline")!,
        cards.find(c => c.id === "scribe")!,
        cards.find(c => c.id === "intake")!
      ];
    } else if (activeRole === UserRole.ALLIED_HEALTH || activeRole === UserRole.NURSE_PRACTITIONER) {
      // Allied Health sees 'Clinic Schedule' (appointments) first and prominent!
      const apptsCard = cards.find(c => c.id === "appointments")!;
      apptsCard.span = "xl:col-span-8"; // elevate schedule to be super wide and detailed
      
      const safetyCard = cards.find(c => c.id === "safety")!;
      safetyCard.span = "xl:col-span-4";

      const summaryCard = cards.find(c => c.id === "patientSummary")!;
      summaryCard.span = "xl:col-span-12";

      // Order: Appointments (Schedule) first, Safety, Summary, Dashboard, Scribe, Timeline, Intake
      return [
        apptsCard,
        safetyCard,
        summaryCard,
        cards.find(c => c.id === "dashboard")!,
        cards.find(c => c.id === "scribe")!,
        cards.find(c => c.id === "timeline")!,
        cards.find(c => c.id === "intake")!
      ];
    }

    // Default for Walk-In, Admin, etc.
    const dbCard = cards.find(c => c.id === "dashboard")!;
    dbCard.span = "xl:col-span-8";
    const apptsCard = cards.find(c => c.id === "appointments")!;
    apptsCard.span = "xl:col-span-4";

    return [
      dbCard,
      apptsCard,
      cards.find(c => c.id === "patientSummary")!,
      cards.find(c => c.id === "scribe")!,
      cards.find(c => c.id === "safety")!,
      cards.find(c => c.id === "timeline")!,
      cards.find(c => c.id === "intake")!
    ];
  };

  // Quick helper to display eGFR status badge
  const displayEgfrBadge = (pat: Patient) => {
    const egfrLab = pat.labs.find(l => l.testName.includes("eGFR"));
    if (!egfrLab) return null;
    const value = parseFloat(egfrLab.value);
    if (value < 30) {
      return (
        <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold">
          eGFR: {egfrLab.value} (Stage 4 Kidney Disease)
        </span>
      );
    }
    return (
      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold">
        eGFR: {egfrLab.value} (Normal)
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-500">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"
        />
        <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-700">Loading Clinical Workspace...</h2>
        <p className="text-xs text-slate-400 mt-1">Acquiring PHIPA certified local audit channels</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col justify-between" id="app-root">
      {/* Top Banner Navigation */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <div className="w-5 h-5 border-2 border-white rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-slate-800">
              ClinOS <span className="text-blue-600">AI</span>
            </h1>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold leading-tight">
              Clinical Copilot • CAN-East Region
            </span>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-slate-600 italic">Scribe Active</span>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-4">
          {/* Global Role Select Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase hidden md:inline">Privilege level:</span>
            <select
              value={activeRole}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              {Object.values(UserRole).map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {activePatient && (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-800 leading-tight">
                  {activePatient.name}, {activePatient.birthDate ? (new Date().getFullYear() - new Date(activePatient.birthDate).getFullYear()) : '26'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono uppercase">
                  ID: {activePatient.phn} • {activePatient.pregnancyStatus !== "None" ? activePatient.pregnancyStatus : "Standard"}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-bold">
                {activePatient.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Patient Cohort Selector & EMR Demographics */}
        <div className="lg:col-span-3 space-y-6 flex flex-col">
          {/* Patient Directory */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3.5">
              Patient Enrolment Directory
            </h3>
            
            <div className="space-y-2">
              {patients.map((pat) => {
                const isActive = pat.id === selectedPatientId;
                return (
                  <button
                    key={pat.id}
                    onClick={() => handlePatientSelect(pat.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isActive 
                        ? "bg-[#0F172A] border-[#0F172A] text-white shadow-md shadow-slate-900/20" 
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200/50 text-slate-700"
                    }`}
                  >
                    <div className="space-y-1 truncate pr-2">
                      <h4 className="text-xs font-semibold">{pat.name}</h4>
                      <p className={`text-[10px] font-mono ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                        PHN: {pat.phn} ({pat.province})
                      </p>
                    </div>
                    {pat.pregnancyStatus !== "None" && (
                      <span className={`text-[9px] uppercase font-bold font-mono px-1.5 py-0.5 rounded ${
                        isActive ? "bg-rose-900/60 text-rose-100 border border-rose-800" : "bg-rose-50 text-rose-700 border border-rose-100"
                      }`}>
                        {pat.pregnancyStatus}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Demographic Card of Selected Patient */}
          {activePatient && (
            <motion.div 
              key={activePatient.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex-1 space-y-4"
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Provincial EMR Demographics</span>
                <h3 className="text-sm font-bold text-slate-800 mt-0.5">{activePatient.name}</h3>
                <p className="text-xs text-slate-500 font-medium">Born: {activePatient.birthDate} ({activePatient.gender})</p>
              </div>

              <div className="border-t border-slate-100 pt-3.5 space-y-3 text-xs">
                {/* Critical Indicators / Allergies */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Documented Allergies
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activePatient.allergies.map((al, idx) => (
                      <span key={idx} className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] px-2 py-0.5 rounded-md font-semibold font-sans">
                        {al}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Chronic Conditions */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Chronic Diagnoses
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activePatient.conditions.map((co, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-md font-medium">
                        {co}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Lab Highlights */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Lab Highlights
                  </span>
                  <div className="space-y-1">
                    {displayEgfrBadge(activePatient)}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-[11px] space-y-1 font-sans">
                <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Active Primary Care</span>
                <p className="text-slate-700 font-semibold">Dr. Alistair Vance, CCFP</p>
                <p className="text-slate-500 text-[10px]">OSCAR EMR Local Residency</p>
              </div>
            </motion.div>
          )}

          {/* Quick Notes Clinical Scratchpad */}
          {activePatient && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col min-h-[250px]"
            >
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Clinical Scratchpad
                  </h3>
                </div>
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] px-2 py-0.2 rounded-full font-bold font-mono">
                  {quickNotes.filter(n => n.patientId === selectedPatientId).length}
                </span>
              </div>

              {/* Add Note Form */}
              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.elements.namedItem("sidebarNote") as HTMLInputElement;
                if (input.value.trim()) {
                  handleAddQuickNote(input.value);
                  input.value = "";
                }
              }} className="flex gap-1.5 shrink-0">
                <input 
                  name="sidebarNote"
                  placeholder="Jot down quick observation..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-[11px]"
                  autoComplete="off"
                />
                <button 
                  type="submit"
                  className="bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl px-3 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Notes List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar max-h-60">
                {quickNotes.filter(n => n.patientId === selectedPatientId).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                    <p className="text-[10px] text-slate-400 italic leading-relaxed">
                      No active scratchpad notes.<br />Add observations for {activePatient.name}.
                    </p>
                  </div>
                ) : (
                  quickNotes
                    .filter(n => n.patientId === selectedPatientId)
                    .map((note) => (
                      <motion.div 
                        key={note.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-50 border border-slate-200/40 rounded-xl p-2.5 text-[10.5px] leading-relaxed relative group"
                      >
                        <p className="text-slate-700 font-medium pr-4 whitespace-pre-wrap">{note.content}</p>
                        <div className="flex items-center justify-between mt-1.5 text-[8.5px] font-mono text-slate-400 font-semibold border-t border-slate-100 pt-1">
                          <span>{note.timestamp}</span>
                          <button 
                            type="button"
                            onClick={() => handleDeleteQuickNote(note.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Central Work Environment / Agent Workspace */}
        <div className="lg:col-span-9 flex flex-col space-y-6">
          {/* Top Panel: Critical Patient Safety Alerts Banner */}
          <AnimatePresence mode="popLayout">
            {notifications.map((not) => (
              <motion.div
                key={not.id}
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                  not.type === "critical" 
                    ? "bg-rose-50 border-rose-200 text-rose-900" 
                    : "bg-blue-50 border-blue-200 text-blue-950"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className={`w-5 h-5 flex-shrink-0 ${not.type === "critical" ? "text-rose-600" : "text-blue-500"}`} />
                  <p className="text-xs font-semibold leading-relaxed">
                    {not.message}
                  </p>
                </div>
                <button 
                  onClick={() => setNotifications(notifications.filter(n => n.id !== not.id))}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Dismiss
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Layout Mode Switcher Control Bar */}
          <div className="bg-[#F1F5F9] p-1.5 rounded-xl flex flex-wrap gap-2 items-center justify-between border border-slate-200">
            <div className="flex items-center gap-2 pl-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clinical Workspace View:</span>
              <span className="text-[11px] font-semibold text-slate-700 font-mono capitalize">{layoutMode === "bento" ? "Unified Bento Grid Dashboard" : "Tabbed Workstations Mode"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setLayoutMode("bento");
                  handleLogAudit("CHANGE_LAYOUT_MODE", "Clinician switched active EMR view to Unified Bento Grid Dashboard.");
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  layoutMode === "bento"
                    ? "bg-[#0F172A] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Unified Bento Grid
              </button>
              <button
                onClick={() => {
                  setLayoutMode("tabs");
                  handleLogAudit("CHANGE_LAYOUT_MODE", "Clinician switched active EMR view to Tabbed Workstations Mode.");
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  layoutMode === "tabs"
                    ? "bg-[#0F172A] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Tabbed Workstations
              </button>
            </div>
          </div>

          {layoutMode === "bento" ? (
            /* Bento Grid Layout Dashboard */
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch" id="bento-dashboard">
              {getBentoCards().map((card) => (
                <motion.div 
                  key={card.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.98, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -15 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 110, 
                    damping: 18, 
                    mass: 0.9,
                    layout: { type: "spring", stiffness: 120, damping: 20 }
                  }}
                  whileHover={{ y: -3 }}
                  className={`${card.span} flex flex-col ${card.minHeight} group/card transition-shadow duration-300 hover:shadow-md hover:shadow-slate-100 rounded-2xl`}
                >
                  <div className="bg-slate-100 px-4 py-2 border border-b-0 border-slate-200 rounded-t-2xl flex items-center justify-between text-xs font-bold text-slate-500 transition-colors group-hover/card:bg-slate-200/50">
                    <span className="flex items-center gap-1.5">{card.icon} {card.title}</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => { 
                          setLayoutMode("tabs"); 
                          setActiveModule(card.focusModule as any); 
                        }} 
                        className="text-[10px] text-blue-600 hover:underline cursor-pointer font-bold font-sans"
                      >
                        Focus Tab
                      </button>
                      <button 
                        onClick={() => {
                          setExpandedCardId(card.id);
                          handleLogAudit("EXPAND_MODULE", `Clinician expanded ${card.title} module to full-screen.`);
                        }} 
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg font-bold font-sans transition-colors border border-indigo-100/30"
                        title="Expand to Full Screen Modal"
                      >
                        <Maximize2 className="w-3 h-3 text-indigo-500" />
                        <span>Expand</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden border border-slate-200 rounded-b-2xl bg-white shadow-xs">
                    {card.component}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Tabbed Layout Workstation */
            <>
              {/* Module Switcher Tabstrip */}
              <div className="bg-white p-2 border border-slate-200 rounded-xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setActiveModule("dashboard")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeModule === "dashboard" 
                        ? "bg-[#0F172A] text-white shadow-sm" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <HeartPulse className="w-3.5 h-3.5 text-blue-500" />
                    EMR Sync
                  </button>

                  <button
                    onClick={() => setActiveModule("appointments")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeModule === "appointments" 
                        ? "bg-[#0F172A] text-white shadow-sm" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                    Appointment Scheduler
                  </button>

                  <button
                    onClick={() => setActiveModule("timeline")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeModule === "timeline" 
                        ? "bg-[#0F172A] text-white shadow-sm" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    Unified Timeline
                  </button>

                  <button
                    onClick={() => setActiveModule("scribe")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeModule === "scribe" 
                        ? "bg-[#0F172A] text-white shadow-sm" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5 text-red-500" />
                    Ambient Scribe
                  </button>

                  <button
                    onClick={() => setActiveModule("safety")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeModule === "safety" 
                        ? "bg-[#0F172A] text-white shadow-sm" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    Safety Agent
                  </button>

                  <button
                    onClick={() => setActiveModule("intake")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeModule === "intake" 
                        ? "bg-[#0F172A] text-white shadow-sm" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Intake & Diff
                  </button>

                  <button
                    onClick={() => setActiveModule("patientSummary")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeModule === "patientSummary" 
                        ? "bg-[#0F172A] text-white shadow-sm" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/10" />
                    Patient Summary Handout
                  </button>

                  <button
                    onClick={() => setActiveModule("compliance")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeModule === "compliance" 
                        ? "bg-[#0F172A] text-white shadow-sm" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Compliance Logs
                  </button>
                </div>

                <div className="hidden lg:flex items-center gap-3 text-xs px-2.5 font-semibold text-slate-500">
                  <button
                    onClick={() => {
                      setExpandedCardId(activeModule);
                      handleLogAudit("EXPAND_MODULE", `Clinician expanded ${activeModule} workstation module to full-screen.`);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-bold font-sans transition-all border border-indigo-100/50"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Expand Workstation</span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">PIPEDA SECURE</span>
                  </div>
                </div>
              </div>

              {/* Render Active Component Workspace */}
              <div className="flex-1 min-h-[580px]">
                {activePatient && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeModule + activePatient.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      {activeModule === "dashboard" && (
                        <HistoryDashboardPanel 
                          patient={activePatient} 
                          onRefresh={fetchData} 
                          onLogAudit={handleLogAudit} 
                        />
                      )}
                      {activeModule === "appointments" && (
                        <AppointmentScheduler 
                          patient={activePatient} 
                          onRefresh={fetchData} 
                          onLogAudit={handleLogAudit} 
                        />
                      )}
                      {activeModule === "timeline" && (
                        <TimelinePanel 
                          patient={activePatient} 
                          onRefresh={fetchData} 
                          onLogAudit={handleLogAudit} 
                        />
                      )}
                      {activeModule === "scribe" && (
                        <ScribePanel 
                          patient={activePatient} 
                          onRefresh={fetchData} 
                          onLogAudit={handleLogAudit} 
                        />
                      )}
                      {activeModule === "safety" && (
                        <SafetyCheckPanel 
                          patient={activePatient} 
                          onRefresh={fetchData} 
                          onLogAudit={handleLogAudit} 
                        />
                      )}
                      {activeModule === "intake" && (
                        <IntakeHistoryPanel 
                          patient={activePatient} 
                          onRefresh={fetchData} 
                          onLogAudit={handleLogAudit} 
                        />
                      )}
                      {activeModule === "patientSummary" && (
                        <PatientTakeHomePanel 
                          patient={activePatient} 
                          onLogAudit={handleLogAudit} 
                        />
                      )}
                      {activeModule === "compliance" && (
                        <CompliancePanel 
                          auditLogs={auditLogs} 
                          activeRole={activeRole} 
                          onRoleChange={handleRoleChange} 
                          systemHealth={systemHealth} 
                          onRefreshLogs={fetchData} 
                          patients={patients}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer Credentials */}
      <footer className="h-12 bg-slate-50 border-t border-slate-200 px-6 flex items-center justify-between text-[10px] font-medium text-slate-400 uppercase tracking-widest">
        <span>PIPEDA / PHIPA Compliant • Data Resident in Canada (CAN-Central)</span>
        <span>System Health: 99.9% • Agent Layer Active</span>
      </footer>

      {/* ClinOS Intelligent Floating Quick Actions Hub */}
      <QuickActionMenu 
        patients={patients}
        selectedPatientId={selectedPatientId}
        onPatientSelect={handlePatientSelect}
        activeRole={activeRole}
        onRoleChange={handleRoleChange}
        layoutMode={layoutMode}
        onLayoutChange={(mode) => setLayoutMode(mode)}
        activeModule={activeModule}
        onModuleChange={(mod) => setActiveModule(mod)}
        onLogAudit={handleLogAudit}
        onRefresh={fetchData}
      />

      {/* Expanded Module Full-Screen Modal */}
      <AnimatePresence>
        {expandedCardId && (() => {
          const cards = getBentoCards();
          let card = cards.find(c => c.id === expandedCardId);
          
          if (!card && expandedCardId === "compliance") {
            card = {
              id: "compliance",
              title: "Regulatory Compliance Audit Logs",
              icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />,
              component: (
                <CompliancePanel 
                  auditLogs={auditLogs} 
                  activeRole={activeRole} 
                  onRoleChange={handleRoleChange} 
                  systemHealth={systemHealth} 
                  onRefreshLogs={fetchData} 
                  patients={patients}
                />
              )
            } as any;
          }

          if (!card) return null;
          const patientNotes = quickNotes.filter(n => n.patientId === selectedPatientId);

          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
            >
              <motion.div 
                initial={{ scale: 0.96, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, y: 15 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-7xl flex flex-col overflow-hidden border border-slate-200"
              >
                {/* Modal Header */}
                <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-800 p-2 rounded-xl text-indigo-400">
                      {card.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold tracking-tight text-white">{card.title}</h2>
                        <span className="bg-indigo-900/80 text-indigo-200 text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase border border-indigo-800">
                          Full-Screen Clinical Workspace
                        </span>
                      </div>
                      {activePatient && (
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          Active Encounter: <span className="text-white font-semibold">{activePatient.name}</span> • PHN: {activePatient.phn} • {activePatient.gender} ({activePatient.birthDate})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setExpandedCardId(null);
                        handleLogAudit("CLOSE_EXPAND_MODULE", `Clinician minimized ${card?.title} module back to workspace.`);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span>Minimize View</span>
                    </button>
                  </div>
                </div>

                {/* Split Content Area */}
                <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-50">
                  {/* Left Column: Expanded Component Panel (grows) */}
                  <div className="flex-1 overflow-auto p-6 min-w-0">
                    <div className="bg-white h-full rounded-2xl border border-slate-200/80 shadow-xs p-1 overflow-auto custom-scrollbar">
                      {card.component}
                    </div>
                  </div>

                  {/* Right Column: Dynamic Notes Scratchpad */}
                  <div className="w-80 border-l border-slate-200 bg-white flex flex-col shrink-0">
                    {/* Notes Header */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                        <ClipboardList className="w-4 h-4 text-indigo-500" />
                        <span>Encounter Scratchpad</span>
                      </div>
                      <span className="bg-indigo-100 text-indigo-800 text-[9px] px-1.5 py-0.2 rounded font-bold font-mono">
                        {patientNotes.length} Saved
                      </span>
                    </div>

                    {/* Notes Input Area */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const input = form.elements.namedItem("modalNote") as HTMLInputElement;
                        if (input.value.trim()) {
                          handleAddQuickNote(input.value);
                          input.value = "";
                        }
                      }} className="flex gap-2">
                        <input 
                          name="modalNote"
                          placeholder="Add real-time quick note..."
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-[11px]"
                          autoComplete="off"
                        />
                        <button 
                          type="submit"
                          className="bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl px-3 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </form>
                      <p className="text-[9px] text-slate-400 mt-1.5 leading-normal">
                        Jot down rapid clinical observations while performing high-fidelity diagnostics. Notes persist on the current patient's chart.
                      </p>
                    </div>

                    {/* Notes List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      {patientNotes.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                          <ClipboardList className="w-8 h-8 text-slate-200 mb-2" />
                          <p className="text-[11px] font-semibold text-slate-400">Scratchpad is empty</p>
                          <p className="text-[10px] text-slate-400/80 text-center px-4 mt-0.5">Start typing above to append secure real-time logs.</p>
                        </div>
                      ) : (
                        patientNotes.map((note) => (
                          <motion.div 
                            key={note.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-[11px] leading-relaxed relative group"
                          >
                            <p className="text-slate-700 pr-5 whitespace-pre-wrap font-medium">{note.content}</p>
                            <div className="flex items-center justify-between mt-2 text-[9px] font-mono text-slate-400 font-semibold border-t border-slate-100 pt-1.5">
                              <span>{note.timestamp}</span>
                              <button 
                                type="button"
                                onClick={() => handleDeleteQuickNote(note.id)}
                                className="text-slate-400 hover:text-rose-600 transition-colors"
                                title="Delete note"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
