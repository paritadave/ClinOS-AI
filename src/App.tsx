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
  ClipboardList,
  Sparkles,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { Patient, AuditLog, UserRole } from "./types";
import { FALLBACK_PATIENTS, FALLBACK_AUDIT_LOGS, FALLBACK_SYSTEM_HEALTH } from "./lib/fallbackData";
import TimelinePanel from "./components/TimelinePanel";
import SafetyCheckPanel from "./components/SafetyCheckPanel";
import ScribePanel from "./components/ScribePanel";
import IntakeHistoryPanel from "./components/IntakeHistoryPanel";
import CompliancePanel from "./components/CompliancePanel";
import HistoryDashboardPanel from "./components/HistoryDashboardPanel";
import AppointmentScheduler from "./components/AppointmentScheduler";
import PatientTakeHomePanel from "./components/PatientTakeHomePanel";
import QuickActionMenu from "./components/QuickActionMenu";
import AIPatientSummary from "./components/AIPatientSummary";

export default function App() {
  const [patients, setPatients] = useState<Patient[]>(FALLBACK_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("pat-01");
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.PHYSICIAN);
  const [activeModule, setActiveModule] = useState<"dashboard" | "timeline" | "scribe" | "safety" | "intake" | "compliance" | "appointments" | "patientSummary">("dashboard");
  const [layoutMode, setLayoutMode] = useState<"tabs" | "bento">("tabs");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(FALLBACK_AUDIT_LOGS);
  const [systemHealth, setSystemHealth] = useState<any>(FALLBACK_SYSTEM_HEALTH);
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

  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [newPatName, setNewPatName] = useState("");
  const [newPatBirthDate, setNewPatBirthDate] = useState("1995-01-01");
  const [newPatPHN, setNewPatPHN] = useState("");
  const [newPatProvince, setNewPatProvince] = useState<"Ontario" | "British Columbia" | "Alberta" | "Quebec" | "Other">("Ontario");
  const [newPatGender, setNewPatGender] = useState("Female");
  const [newPatPregnancy, setNewPatPregnancy] = useState<"Pregnant" | "Postpartum" | "Breastfeeding" | "None">("None");
  const [newPatAllergies, setNewPatAllergies] = useState("");
  const [newPatConditions, setNewPatConditions] = useState("");

  const handleEnrollPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatName.trim() || !newPatPHN.trim()) return;

    const allergiesArr = newPatAllergies.split(",").map(s => s.trim()).filter(Boolean);
    const conditionsArr = newPatConditions.split(",").map(s => s.trim()).filter(Boolean);

    const newPatientData = {
      name: newPatName.trim(),
      birthDate: newPatBirthDate,
      phn: newPatPHN.trim(),
      province: newPatProvince,
      gender: newPatGender,
      pregnancyStatus: newPatPregnancy,
      allergies: allergiesArr,
      conditions: conditionsArr,
      currentMedications: [],
      labs: [],
      imaging: [],
      referrals: [],
      procedures: [],
      symptomTrends: [
        { date: new Date().toISOString().split("T")[0], severity: 3, symptomName: "Initial Assessment", notes: "Patient record newly registered in EMR." }
      ],
      medicationHistory: [],
      soapNotes: []
    };

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPatientData)
      });
      
      let createdPatient: Patient;
      if (res.ok) {
        createdPatient = await res.json();
      } else {
        createdPatient = {
          id: "pat-" + Date.now(),
          ...newPatientData
        };
      }

      // Save to local storage for persistent Vercel/front-end static deployment
      const existingLocal = JSON.parse(localStorage.getItem("clinos_local_patients") || "[]");
      existingLocal.push(createdPatient);
      localStorage.setItem("clinos_local_patients", JSON.stringify(existingLocal));

      setPatients(prev => [...prev, createdPatient]);
      setSelectedPatientId(createdPatient.id);
      setIsEnrollModalOpen(false);
      
      // Reset fields
      setNewPatName("");
      setNewPatPHN("");
      setNewPatAllergies("");
      setNewPatConditions("");
      setNewPatPregnancy("None");

      handleLogAudit("CREATE_PATIENT", `Registered and enrolled new patient record for ${createdPatient.name}.`);
    } catch (err) {
      console.error("Failed to enroll patient:", err);
      // Fallback
      const createdPatient = {
        id: "pat-" + Date.now(),
        ...newPatientData
      };
      const existingLocal = JSON.parse(localStorage.getItem("clinos_local_patients") || "[]");
      existingLocal.push(createdPatient);
      localStorage.setItem("clinos_local_patients", JSON.stringify(existingLocal));

      setPatients(prev => [...prev, createdPatient]);
      setSelectedPatientId(createdPatient.id);
      setIsEnrollModalOpen(false);
      setNewPatName("");
      setNewPatPHN("");
      setNewPatAllergies("");
      setNewPatConditions("");
      setNewPatPregnancy("None");
      handleLogAudit("CREATE_PATIENT", `Registered new patient record for ${createdPatient.name} locally.`);
    }
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      // Fetch Patients
      const patientRes = await fetch("/api/patients");
      let basePatients = FALLBACK_PATIENTS;
      if (patientRes.ok) {
        const patientData = await patientRes.json();
        if (Array.isArray(patientData) && patientData.length > 0) {
          basePatients = patientData;
        }
      }

      // Merge with local storage
      const localPatients = JSON.parse(localStorage.getItem("clinos_local_patients") || "[]");
      const merged = [...basePatients];
      localPatients.forEach((lp: Patient) => {
        if (!merged.some(p => p.id === lp.id)) {
          merged.push(lp);
        }
      });
      setPatients(merged);

      // Fetch Audit Logs
      const auditRes = await fetch("/api/audit-logs");
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        if (Array.isArray(auditData) && auditData.length > 0) {
          setAuditLogs(auditData);
        }
      }

      // Fetch System Health
      const healthRes = await fetch("/api/system-health");
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        if (healthData && healthData.status) {
          setSystemHealth(healthData);
        }
      }
    } catch (err) {
      console.warn("Could not load live clinical workspace from server, using local secure PIPEDA fallback mode.", err);
      const localPatients = JSON.parse(localStorage.getItem("clinos_local_patients") || "[]");
      const merged = [...FALLBACK_PATIENTS];
      localPatients.forEach((lp: Patient) => {
        if (!merged.some(p => p.id === lp.id)) {
          merged.push(lp);
        }
      });
      setPatients(merged);
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

      const scribeCard = cards.find(c => c.id === "scribe")!;
      scribeCard.span = "xl:col-span-12";

      // Order: Scribe (top centerpiece), Safety, Appointments, Dashboard, Patient Summary, Timeline, Intake
      return [
        scribeCard,
        safetyCard,
        apptsCard,
        dashboardCard,
        cards.find(c => c.id === "patientSummary")!,
        cards.find(c => c.id === "timeline")!,
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

      const scribeCard = cards.find(c => c.id === "scribe")!;
      scribeCard.span = "xl:col-span-12";

      // Order: Appointments (Schedule) first, Scribe (centerpiece), Safety, Summary, Dashboard, Timeline, Intake
      return [
        apptsCard,
        scribeCard,
        safetyCard,
        summaryCard,
        cards.find(c => c.id === "dashboard")!,
        cards.find(c => c.id === "timeline")!,
        cards.find(c => c.id === "intake")!
      ];
    }

    // Default for Walk-In, Admin, etc.
    const dbCard = cards.find(c => c.id === "dashboard")!;
    dbCard.span = "xl:col-span-8";
    const apptsCard = cards.find(c => c.id === "appointments")!;
    apptsCard.span = "xl:col-span-4";

    const scribeCard = cards.find(c => c.id === "scribe")!;
    scribeCard.span = "xl:col-span-12";

    return [
      scribeCard,
      dbCard,
      apptsCard,
      cards.find(c => c.id === "patientSummary")!,
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

      {/* Clinical Workspace Layout Mode Selector Bar */}
      <div id="layout-mode-selector" className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4 text-xs font-medium text-slate-500 shadow-xs shrink-0 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-400 uppercase tracking-wider mr-1">EMR Workspace View:</span>
          <button
            onClick={() => {
              setLayoutMode("bento");
              handleLogAudit("TOGGLE_LAYOUT", "Swapped EMR workspace view to Unified Bento Grid mode.");
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              layoutMode === "bento"
                ? "bg-blue-50 border border-blue-200 text-blue-700 font-bold shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Unified Bento Grid Dashboard</span>
          </button>
          
          <button
            onClick={() => {
              setLayoutMode("tabs");
              handleLogAudit("TOGGLE_LAYOUT", "Swapped EMR workspace view to Tabbed Workstations Mode.");
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              layoutMode === "tabs"
                ? "bg-blue-50 border border-blue-200 text-blue-700 font-bold shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Tabbed Workstations Mode</span>
          </button>

          <span className="h-4 w-px bg-slate-300 mx-2 hidden sm:inline-block"></span>

          <button
            onClick={() => {
              setExpandedCardId("compliance");
              handleLogAudit("OPEN_COMPLIANCE_AUDIT", "Opened full-screen Regulatory Compliance & Safety Audit Logs.");
            }}
            className="hover:text-emerald-650 transition-colors cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Practice Compliance & Audit Logs</span>
          </button>
        </div>

        {activePatient && (
          <div className="text-[11px] text-slate-500 font-mono bg-white border border-slate-200 rounded-full px-3 py-1 flex items-center gap-2">
            <span className="font-bold text-slate-400">CONTEXT:</span>
            <span>{activePatient.name} (DOB: {activePatient.birthDate})</span>
          </div>
        )}
      </div>

      {/* Main Grid Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Patient Cohort Selector & EMR Demographics */}
        <div className="lg:col-span-3 space-y-6 flex flex-col shrink-0">
          {/* Patient Directory */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Patient Enrolment Directory
              </h3>
              <button
                onClick={() => setIsEnrollModalOpen(true)}
                className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg hover:bg-blue-100 flex items-center gap-1.5 transition-all border border-blue-200/50 cursor-pointer"
              >
                <Plus size={12} />
                Enroll
              </button>
            </div>
            
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
        <div className="lg:col-span-9 flex flex-col space-y-6 min-h-0">
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

          {/* AIPatientSummary Pinned at the top of the central column */}
          {activePatient && (
            <AIPatientSummary patient={activePatient} />
          )}

          {/* WORKSPACE VIEW ROUTER */}
          <AnimatePresence mode="wait">
            {layoutMode === "bento" ? (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-fade-in" key="bento-grid-view">
                {getBentoCards().map((card) => (
                  <motion.div
                    key={card.id}
                    id={`bento-card-${card.id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`${card.span} bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col ${card.minHeight || "min-h-[400px]"}`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-slate-50 rounded-lg text-slate-700">{card.icon}</span>
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{card.title}</h3>
                      </div>
                      <button
                        onClick={() => {
                          setExpandedCardId(card.id);
                          handleLogAudit("EXPAND_MODULE", `Clinician expanded ${card.title} module to high-fidelity full-screen view.`);
                        }}
                        className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        title="Expand view"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto min-h-0">
                      {card.component}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in" key="tabbed-workstation-view">
                {/* Tab Switcher Bar */}
                <div className="bg-white p-2 border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {getBentoCards().map((card) => {
                      const isActive = activeModule === card.focusModule;
                      return (
                        <button
                          key={card.id}
                          onClick={() => {
                            setActiveModule(card.focusModule as any);
                            handleLogAudit("CHANGE_ACTIVE_MODULE", `Clinician focused workspace tab on ${card.title}.`);
                          }}
                          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                            isActive 
                              ? "bg-[#0F172A] text-white shadow-sm" 
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                          }`}
                        >
                          {card.icon}
                          <span>{card.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Tab Active Workstation Panel */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden min-h-[520px]">
                  {getBentoCards().find(c => c.focusModule === activeModule)?.component}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Credentials */}
      <footer className="py-4 md:py-3 bg-slate-50 border-t border-slate-200 px-6 flex flex-col md:flex-row items-center justify-between text-[10px] font-medium text-slate-400 gap-3 shrink-0">
        <div className="flex items-center gap-2 uppercase tracking-widest">
          <span>PIPEDA / PHIPA Compliant • Data Resident in Canada (CAN-Central)</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-3 py-1 font-mono text-[9px]">
          <span className="font-bold text-slate-400 uppercase tracking-wider">Tech Stack:</span>
          <span>React 18 • Vite • TypeScript • Express • Tailwind CSS • Google OAuth • Gmail API • Gemini AI</span>
        </div>
        <div className="flex items-center gap-1.5 uppercase tracking-wider font-bold text-indigo-600">
          <HeartPulse className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          <span>Built by Parita Dave</span>
        </div>
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

        {isEnrollModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
                <div>
                  <h3 className="text-sm font-bold">Enroll New EMR Patient</h3>
                  <p className="text-[10px] text-slate-300">Create a secure, PIPEDA-compliant patient record.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleEnrollPatient} className="p-6 space-y-4 overflow-y-auto max-h-[80vh] custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPatName}
                      onChange={(e) => setNewPatName(e.target.value)}
                      placeholder="e.g. Liam Sterling"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Birth Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={newPatBirthDate}
                      onChange={(e) => setNewPatBirthDate(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Provincial Health Number (PHN) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPatPHN}
                      onChange={(e) => setNewPatPHN(e.target.value)}
                      placeholder="e.g. 5543-128-999"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Province *
                    </label>
                    <select
                      value={newPatProvince}
                      onChange={(e) => setNewPatProvince(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium bg-white"
                    >
                      <option value="Ontario">Ontario</option>
                      <option value="British Columbia">British Columbia</option>
                      <option value="Alberta">Alberta</option>
                      <option value="Quebec">Quebec</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Gender *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPatGender}
                      onChange={(e) => setNewPatGender(e.target.value)}
                      placeholder="e.g. Female, Male, Non-binary"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Pregnancy / Obstetric Status
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["None", "Pregnant", "Postpartum", "Breastfeeding"] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setNewPatPregnancy(status)}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer text-center ${
                            newPatPregnancy === status
                              ? "bg-rose-50 border-rose-200 text-rose-700 font-bold"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Allergies (comma-separated list)
                    </label>
                    <input
                      type="text"
                      value={newPatAllergies}
                      onChange={(e) => setNewPatAllergies(e.target.value)}
                      placeholder="e.g. Penicillin, Peanuts, Sulfa"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Chronic Medical Conditions (comma-separated list)
                    </label>
                    <input
                      type="text"
                      value={newPatConditions}
                      onChange={(e) => setNewPatConditions(e.target.value)}
                      placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEnrollModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Plus size={14} />
                    Enroll Patient
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
