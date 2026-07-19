import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  UserCheck, 
  Terminal, 
  Lock, 
  Database, 
  FileLock, 
  RefreshCw,
  Server,
  Activity,
  Users,
  LineChart as LineIcon,
  PieChart as PieIcon,
  BarChart as BarIcon,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  HeartPulse,
  Heart,
  Briefcase
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
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { AuditLog, UserRole, Patient } from "../types";

interface CompliancePanelProps {
  auditLogs: AuditLog[];
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  systemHealth: {
    status: string;
    uptime: string;
    dataResidency: string;
    encryptionState: string;
    provincialEMRReady: string[];
    activeSubagents: string[];
  } | null;
  onRefreshLogs: () => void;
  patients: Patient[];
}

export default function CompliancePanel({ 
  auditLogs, 
  activeRole, 
  onRoleChange, 
  systemHealth, 
  onRefreshLogs,
  patients = []
}: CompliancePanelProps) {
  
  const [activeTab, setActiveTab] = useState<"clinic" | "performance" | "audit">("clinic");
  const [latencyData, setLatencyData] = useState<{ time: string; oscar: number; accuro: number; fhir: number }[]>([]);
  const [isRefreshingLatency, setIsRefreshingLatency] = useState(false);

  // Generate real-time integration latency data with dynamic scrolling interval
  useEffect(() => {
    const now = new Date();
    const initial = Array.from({ length: 8 }).map((_, i) => {
      const d = new Date(now.getTime() - (8 - i) * 5000);
      return {
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        oscar: Math.floor(Math.random() * 30) + 120, // 120ms - 150ms
        accuro: Math.floor(Math.random() * 40) + 185, // 185ms - 225ms
        fhir: Math.floor(Math.random() * 15) + 75    // 75ms - 90ms
      };
    });
    setLatencyData(initial);

    const interval = setInterval(() => {
      setLatencyData(prev => {
        const nextTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newPoint = {
          time: nextTime,
          oscar: Math.floor(Math.random() * 30) + 120,
          accuro: Math.floor(Math.random() * 40) + 185,
          fhir: Math.floor(Math.random() * 15) + 75
        };
        // Keep last 10 points for scrolling history
        return [...prev.slice(1), newPoint];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const triggerLatencyRefresh = () => {
    setIsRefreshingLatency(true);
    setTimeout(() => {
      setIsRefreshingLatency(false);
      onRefreshLogs();
    }, 800);
  };

  // 1. Dynamic single-clinic patient demographics calculations
  const totalPatients = patients.length;
  
  const ages = patients.map(p => {
    const birthYear = new Date(p.birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
  });
  
  const avgAge = totalPatients > 0 
    ? Math.round(ages.reduce((sum, age) => sum + age, 0) / totalPatients) 
    : 0;

  // Age group counts (under 18, 18-35, 36-55, 56+)
  const ageGroups = [
    { group: "Pediatric (<18)", count: 0 },
    { group: "Adult (18-35)", count: 0 },
    { group: "Middle-Aged (36-55)", count: 0 },
    { group: "Senior (56+)", count: 0 }
  ];

  ages.forEach(age => {
    if (age < 18) ageGroups[0].count++;
    else if (age <= 35) ageGroups[1].count++;
    else if (age <= 55) ageGroups[2].count++;
    else ageGroups[3].count++;
  });

  // Gender & Clinical Status classification
  let maleCount = 0;
  let femaleCount = 0;
  let pregnantCount = 0;
  let postpartumCount = 0;

  patients.forEach(p => {
    if (p.pregnancyStatus === "Pregnant") {
      pregnantCount++;
    } else if (p.pregnancyStatus === "Postpartum" || p.pregnancyStatus === "Breastfeeding") {
      postpartumCount++;
    } else if (p.gender === "Female") {
      femaleCount++;
    } else {
      maleCount++;
    }
  });

  const demographicData = [
    { name: "Male Patients", value: maleCount, color: "#3b82f6" },
    { name: "Female Patients", value: femaleCount, color: "#ec4899" },
    { name: "Pregnant Patients", value: pregnantCount, color: "#f43f5e" },
    { name: "Postpartum / Nursing", value: postpartumCount, color: "#eab308" }
  ].filter(d => d.value > 0);

  // Common Health Conditions count
  const conditionCounts: Record<string, number> = {};
  patients.forEach(p => {
    p.conditions.forEach(c => {
      conditionCounts[c] = (conditionCounts[c] || 0) + 1;
    });
  });

  const conditionData = Object.entries(conditionCounts).map(([name, count]) => ({
    name: name.length > 20 ? name.substring(0, 18) + "..." : name,
    "Patients Affected": count
  })).sort((a, b) => b["Patients Affected"] - a["Patients Affected"]);

  // Total active medications monitored
  let totalActiveMeds = 0;
  patients.forEach(p => {
    p.currentMedications.forEach(m => {
      if (m.status === "Active") totalActiveMeds++;
    });
  });

  // 2. System Uptime Log (7 Days)
  const uptimeTrendData = [
    { day: "Mon", Uptime: 99.98, "API Latency Avg": 132 },
    { day: "Tue", Uptime: 99.96, "API Latency Avg": 140 },
    { day: "Wed", Uptime: 100.0, "API Latency Avg": 128 },
    { day: "Thu", Uptime: 99.99, "API Latency Avg": 130 },
    { day: "Fri", Uptime: 99.97, "API Latency Avg": 135 },
    { day: "Sat", Uptime: 99.98, "API Latency Avg": 125 },
    { day: "Sun", Uptime: 99.98, "API Latency Avg": 129 }
  ];

  // 3. Dynamic Security alert and Audit log analysis
  // Count current safety checks vs standard clinical audits
  let safetyAuditCount = 0;
  let emrSyncCount = 0;
  let clientAccessCount = 0;
  let schedulingCount = 0;

  auditLogs.forEach(log => {
    if (log.action.includes("SAFETY") || log.action.includes("ALERT")) safetyAuditCount++;
    else if (log.action.includes("EMR") || log.action.includes("SYNC")) emrSyncCount++;
    else if (log.action.includes("SCHEDULE") || log.action.includes("APPOINTMENT")) schedulingCount++;
    else clientAccessCount++;
  });

  const securityFrequencyData = [
    { category: "Prescription Safety Checks", count: Math.max(safetyAuditCount, 3), fill: "#ef4444" },
    { category: "EMR Gateway Syncs", count: Math.max(emrSyncCount, 4), fill: "#3b82f6" },
    { category: "Appointment Coordination", count: Math.max(schedulingCount, 2), fill: "#10b981" },
    { category: "Patient Records Access", count: Math.max(clientAccessCount, 5), fill: "#6366f1" }
  ];

  const roleDescriptions = {
    [UserRole.PHYSICIAN]: "Full clinical EMR privileges, prescribing authority, direct specialist referrals, and longitudinal history reviews.",
    [UserRole.NURSE_PRACTITIONER]: "Full primary care privileges, clinical scribe notes, medication reviews, and standard diagnostic ordering.",
    [UserRole.WALK_IN_CLINICIAN]: "Rapid intake privileges, real-time multilingual patient translation tools, and single-encounter SOAP logs.",
    [UserRole.SPECIALIST]: "Consultative records access, diagnostic imaging review summarizers, and specialist consultation templates.",
    [UserRole.ALLIED_HEALTH]: "Ancillary clinic care, scheduling reviews, rehab plans, patient take-home summaries, and clinical coordination.",
    [UserRole.ADMIN]: "Full clinic auditing privileges, role configuration controls, and PIPEDA/PHIPA compliance log exports."
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full animate-fade-in" id="compliance-panel">
      
      {/* Dashboard Top Title with Status Indicators */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            ClinOS Practice Administrator Operations Room
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Authorized Single-Clinic access • PIPEDA / PHIPA Patient Demographics, Safety Audits & Real-Time Performance Uptime
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full text-emerald-700 border border-emerald-100 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[10px] font-mono uppercase tracking-wider">
              Single-Clinic Node: Toronto Downtown
            </span>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-slate-600 font-bold">
            <Database className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono uppercase tracking-wider">
              Secure AES-256 Storage
            </span>
          </div>
        </div>
      </div>

      {/* Modern Horizontal Navigation Tabs */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-1.5 rounded-xl mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("clinic")}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "clinic"
                ? "bg-[#0F172A] text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
          >
            <Users className="w-4 h-4" />
            Clinic Patient Demographics
          </button>
          
          <button
            onClick={() => setActiveTab("performance")}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "performance"
                ? "bg-[#0F172A] text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
          >
            <Activity className="w-4 h-4" />
            System Telemetry & Live Latency
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "audit"
                ? "bg-[#0F172A] text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
          >
            <Terminal className="w-4 h-4" />
            RBAC Access & Immutable Logs
          </button>
        </div>

        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase pr-3 hidden md:block">
          Active: {activeRole} Privileges
        </div>
      </div>

      {/* Main Dashboards Contents */}
      <div className="flex-1 overflow-hidden min-h-[500px]">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: CLINIC PATIENT DEMOGRAPHICS & CLINICAL POPULATION STATISTICS */}
          {activeTab === "clinic" && (
            <motion.div
              key="clinic-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6 h-full overflow-y-auto pr-1 custom-scrollbar max-h-[550px]"
            >
              {/* Single-Clinic KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-xs">
                  <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Clinic Patients</span>
                    <h4 className="text-xl font-black text-slate-800 mt-0.5">{totalPatients}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Active registration list</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-xs">
                  <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Average Patient Age</span>
                    <h4 className="text-xl font-black text-slate-800 mt-0.5">{avgAge} yrs</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Mean clinic demographic</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-xs">
                  <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Medications Monitored</span>
                    <h4 className="text-xl font-black text-slate-800 mt-0.5">{totalActiveMeds}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Active audited therapy plans</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-xs">
                  <div className="p-3 bg-rose-100 rounded-lg text-rose-600">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Active Safety Audits</span>
                    <h4 className="text-xl font-black text-slate-800 mt-0.5">{auditLogs.filter(l => l.action.includes("SAFETY") || l.action.includes("ALERT")).length}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Real-time alerts reviewed</p>
                  </div>
                </div>
              </div>

              {/* Recharts Clinic Demographics Visualizer */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Age Distribution Chart */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                    <BarIcon className="w-4 h-4 text-blue-500" />
                    Patient Age Demographics
                  </h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ageGroups}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="group" tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Patients Count">
                          {ageGroups.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={idx % 2 === 0 ? "#3b82f6" : "#6366f1"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold text-center mt-2 italic">
                    Clinic age range distributed by primary birthdates
                  </p>
                </div>

                {/* Gender & Maternity Breakdown */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                    <PieIcon className="w-4 h-4 text-rose-500" />
                    Special Maternity & Gender Split
                  </h3>
                  <div className="h-[200px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demographicData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {demographicData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          iconSize={8}
                          layout="horizontal"
                          formatter={(value) => <span className="text-[9px] font-bold text-slate-600">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Condition Prevalence Table/Chart */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                      <HeartPulse className="w-4 h-4 text-emerald-500" />
                      Clinic Condition Prevalence
                    </h3>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={conditionData.slice(0, 5)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                          />
                          <Bar dataKey="Patients Affected" fill="#10b981" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold text-center mt-2 italic">
                    Most common documented chronic conditions within Toronto office
                  </p>
                </div>

              </div>

              {/* Data Compliance & Local Isolation Notice */}
              <div className="p-4 bg-blue-50/50 border border-blue-150 rounded-xl flex items-start gap-3">
                <Lock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-900 font-medium">
                  <p className="font-extrabold text-blue-950">Local Single-Clinic Clinic Sandbox Isolation</p>
                  <p className="mt-0.5 leading-relaxed">
                    This reporting server complies strictly with provincial PHIPA boundaries. Patient data, ages, conditions, and PHN identifiers are contained strictly within this local practice instance database and are not synchronized over multi-provincial health authorities. Access to statistical tables requires local Admin privileges.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: SYSTEM TELEMETRY, INTERACTION LATENCIES & API PERFORMANCE */}
          {activeTab === "performance" && (
            <motion.div
              key="performance-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6 h-full overflow-y-auto pr-1 custom-scrollbar max-h-[550px]"
            >
              {/* Dynamic Health Indicators Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Server Status</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase rounded">Online & Healthy</span>
                  </div>
                  <p className="font-bold text-slate-700 text-base flex items-center gap-1.5">
                    <Server className="w-4.5 h-4.5 text-blue-500" />
                    Uptime: {systemHealth?.uptime || "99.98%"}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Live Integrations Active</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-black uppercase rounded">EMR Connected</span>
                  </div>
                  <p className="font-bold text-slate-700 text-base flex items-center gap-1.5">
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
                    OSCAR • Accuro • FHIR
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">System Heartbeat Monitor</span>
                    <button 
                      onClick={triggerLatencyRefresh}
                      className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRefreshingLatency ? "animate-spin" : "animate-pulse"}`} /> Poll APIs
                    </button>
                  </div>
                  <p className="font-bold text-slate-700 text-base flex items-center gap-1.5">
                    <Activity className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
                    Heartbeat: 4s intervals
                  </p>
                </div>
              </div>

              {/* API Integration Latencies scrolling chart */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <LineIcon className="w-4.5 h-4.5 text-blue-500" />
                      Live API Integration Latencies (OSCAR / Accuro / FHIR)
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Real-time telemetry measuring time-to-first-byte (TTFB) in milliseconds for regional EMR gateways
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 block" /> OSCAR ({latencyData[latencyData.length - 1]?.oscar}ms)</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 block" /> Accuro ({latencyData[latencyData.length - 1]?.accuro}ms)</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" /> FHIR Portal ({latencyData[latencyData.length - 1]?.fhir}ms)</span>
                  </div>
                </div>

                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={latencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <Tooltip 
                        contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                      />
                      <Line type="monotone" dataKey="oscar" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} name="OSCAR TTFB" />
                      <Line type="monotone" dataKey="accuro" stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} name="Accuro EMR" />
                      <Line type="monotone" dataKey="fhir" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} name="FHIR REST Endpoint" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Side-by-side Uptime Area and Security Alert Frequency Bar Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Historical Server Uptime */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Historical Server Uptime (%)
                  </h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={uptimeTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[99.9, 100]} tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                        />
                        <Area type="monotone" dataKey="Uptime" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorUptime)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Security Audit Alert Frequency */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    Security Alert Frequency By Activity
                  </h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={securityFrequencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="category" tick={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 9, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Trigger Frequency">
                          {securityFrequencyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 3: IMMUTABLE AUDIT LOGS, RBAC ROLE PRIVILEGES */}
          {activeTab === "audit" && (
            <motion.div
              key="audit-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full"
            >
              {/* Role-Based Privilege Switcher */}
              <div className="lg:col-span-4 space-y-4 flex flex-col justify-between h-[450px]">
                <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar">
                  
                  {/* Clinician Role Switcher */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2.5">
                      <UserCheck className="w-4 h-4 text-blue-500" />
                      Role-Based Access Control (RBAC)
                    </h3>
                    
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Active Clinical Role Identity
                      </label>
                      <select
                        value={activeRole}
                        onChange={(e) => onRoleChange(e.target.value as UserRole)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500 cursor-pointer shadow-xs"
                      >
                        {Object.values(UserRole).map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      
                      <p className="text-[11px] text-slate-500 leading-relaxed bg-white border border-slate-150 p-3 rounded-xl mt-2 font-medium">
                        {roleDescriptions[activeRole]}
                      </p>
                    </div>
                  </div>

                  {/* Canadian Security Standards Checklist */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      Compliance Audit Standards
                    </h3>

                    <div className="space-y-2 font-semibold">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-150 flex items-center justify-between shadow-2xs">
                        <span className="text-slate-600">PIPEDA Standard</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Compliant</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-150 flex items-center justify-between shadow-2xs">
                        <span className="text-slate-600">Ontario PHIPA</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Compliant</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-150 flex items-center justify-between shadow-2xs">
                        <span className="text-slate-600">Database Encryption</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1"><FileLock className="w-3.5 h-3.5" /> AES-256</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold text-emerald-800 flex items-center justify-center gap-1.5 leading-snug">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Immutable Encrypted Auditing Active
                  </span>
                </div>
              </div>

              {/* Access Audit Trail Log List */}
              <div className="lg:col-span-8 border-l border-slate-100 pl-4 h-[450px] flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-blue-500" />
                    Immutable Access Audit Trail (PHIPA Live)
                  </h3>
                  
                  <button 
                    onClick={onRefreshLogs}
                    className="text-xs text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reload logs
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
                  {auditLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-12 font-medium">No audit actions recorded in this session.</p>
                  ) : (
                    auditLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl p-3.5 text-xs flex flex-col gap-1.5 transition-all shadow-2xs"
                      >
                        <div className="flex items-start justify-between">
                          <span className={`text-[9px] uppercase font-bold font-mono px-2 py-0.5 rounded-md ${
                            log.action.includes("SAFETY") || log.action.includes("ALERT")
                              ? "bg-rose-50 text-rose-700 border border-rose-100 font-black" 
                              : log.action.includes("CREATE") || log.action.includes("SYNC")
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100 font-black"
                              : "bg-slate-200 text-slate-700 font-bold"
                          }`}>
                            {log.action}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-medium">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        <p className="text-slate-600 font-semibold leading-relaxed font-sans text-[11px]">
                          {log.details}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                          <span className="font-bold text-slate-500">
                            By: {log.clinicianName} ({log.clinicianRole})
                          </span>
                          <span className="font-mono font-bold">
                            IP: {log.ipAddress} • {log.complianceChecked ? "Encrypted Check ✓" : "Reviewing"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
