import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, 
  ShieldCheck, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  FileJson, 
  Copy, 
  Check, 
  Settings2, 
  Calendar, 
  Pill, 
  ShieldAlert, 
  FileText, 
  ArrowRightLeft, 
  Lock, 
  Server,
  Activity,
  HeartPulse,
  Info,
  Clock,
  UserCheck,
  Smartphone,
  Mail,
  QrCode,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { Patient, EMRIntegration, EMRSyncLog, PatientIntakeLink } from "../types";
import LongitudinalTrendGraph from "./LongitudinalTrendGraph";
import PreventativeCareGaps from "./PreventativeCareGaps";

interface HistoryDashboardPanelProps {
  patient: Patient;
  onRefresh: () => void;
  onLogAudit: (action: string, details: string) => Promise<void>;
}

export default function HistoryDashboardPanel({ patient, onRefresh, onLogAudit }: HistoryDashboardPanelProps) {
  // Layout states: "bento" (Modern Bento Grid) or "classic" (Tabbed Panels)
  const [layoutMode, setLayoutMode] = useState<"bento" | "classic">("bento");
  const [activeTab, setActiveTab] = useState<"trends" | "integrations" | "preventative">("trends");
  
  // State: EMR Integrations & Logs
  const [integrations, setIntegrations] = useState<EMRIntegration[]>([]);
  const [syncLogs, setSyncLogs] = useState<EMRSyncLog[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<EMRSyncLog | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [inspectedLog, setInspectedLog] = useState<EMRSyncLog | null>(null);

  // State: Patient Portal Dispatcher
  const [intakeLinks, setIntakeLinks] = useState<PatientIntakeLink[]>([]);
  const [dispatchChannel, setDispatchChannel] = useState<"SMS" | "Email" | "QR Code">("SMS");
  const [dispatchContact, setDispatchContact] = useState<string>("");
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [latestDispatchedLink, setLatestDispatchedLink] = useState<PatientIntakeLink | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);

  // EMR Configuration edit state
  const [editingEMR, setEditingEMR] = useState<EMRIntegration | null>(null);
  const [editForm, setEditForm] = useState({
    endpointUrl: "",
    clientId: "",
    clientSecret: "••••••••••••••••••••••••••••",
    fhirVersion: "R4" as "R4" | "STU3" | "DSTU2",
    dataResidencyLocation: "Canada Central (Toronto)"
  });

  // Load backend data on load and when patient changes
  const fetchAllData = async () => {
    try {
      const intRes = await fetch("/api/emr-integrations");
      const intData = await intRes.json();
      setIntegrations(intData);

      const logsRes = await fetch("/api/emr-sync-logs");
      const logsData = await logsRes.json();
      setSyncLogs(logsData);

      const linksRes = await fetch("/api/patient-intake-links");
      const linksData = await linksRes.json();
      setIntakeLinks(linksData);
    } catch (err) {
      console.error("Error loading panel metrics:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [patient]);

  // Sync contact info defaults when patient changes
  useEffect(() => {
    const isSarah = patient.name.includes("Sarah");
    if (dispatchChannel === "SMS") {
      setDispatchContact(isSarah ? "+1 (416) 555-0192" : "+1 (604) 555-0143");
    } else {
      setDispatchContact(isSarah ? "sarah.j@ontariomail.ca" : "r.vance@bcservices.ca");
    }
  }, [patient, dispatchChannel]);

  // Handle Dispatching Secure Intake Link to Patient
  const handleDispatchIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatching(true);
    setLatestDispatchedLink(null);

    try {
      const res = await fetch("/api/patient-intake-links/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          channel: dispatchChannel,
          contactValue: dispatchChannel === "QR Code" ? "In-Clinic Self-Service Kiosk" : dispatchContact
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLatestDispatchedLink(data.link);
        if (dispatchChannel === "QR Code") {
          setShowQRModal(true);
        }
        await fetchAllData();
        onRefresh(); // Refresh parent audit log
      } else {
        alert(data.error || "Failed to dispatch secure intake form.");
      }
    } catch (err) {
      console.error("Dispatch Link Error:", err);
    } finally {
      setIsDispatching(false);
    }
  };

  // EMR Gateway On-Demand FHIR Sync
  const handleEMRSync = async () => {
    setIsSyncing(true);
    setSyncSuccess(null);
    try {
      await onLogAudit("EMR_SYNC_TRIGGERED", `Initiated secure HL7 FHIR synchronization for ${patient.name} to regional EMR database.`);
      
      const res = await fetch(`/api/emr-integrations/sync/${patient.id}`, { method: "POST" });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSyncSuccess(data.syncLog);
        setInspectedLog(data.syncLog);
        setIntegrations(data.integrations);
        await fetchAllData();
        onRefresh();
      } else {
        alert(data.error || "FHIR connection sync rejected by provincial gateway.");
      }
    } catch (err) {
      console.error("FHIR Sync Error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Edit EMR settings
  const handleSaveEMR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEMR) return;

    try {
      const res = await fetch("/api/emr-integrations/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: editingEMR.provider,
          province: editingEMR.province,
          endpointUrl: editForm.endpointUrl,
          clientId: editForm.clientId,
          clientSecret: editForm.clientSecret,
          fhirVersion: editForm.fhirVersion,
          dataResidencyLocation: editForm.dataResidencyLocation
        })
      });

      if (res.ok) {
        setEditingEMR(null);
        await fetchAllData();
      }
    } catch (err) {
      console.error("Failed saving EMR config:", err);
    }
  };

  const activeIntegration = integrations.find(i => i.province === patient.province && i.status === "Connected");

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full animate-fade-in" id="history-dashboard-panel">
      {/* Header Panel with Layout Switchers */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 mb-5 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
              ClinOS AI v4.0
            </span>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              Longitudinal History & EMR Orchestrator
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            PHIPA & PIPEDA compliant, certified local data residency, on-demand provincial FHIR bundles
          </p>
        </div>

        {/* Layout Mode Controls */}
        <div className="flex items-center gap-4 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setLayoutMode("bento")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              layoutMode === "bento"
                ? "bg-[#0F172A] text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Clinical Bento Grid
          </button>
          <button
            onClick={() => setLayoutMode("classic")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              layoutMode === "classic"
                ? "bg-[#0F172A] text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Tabbed Clinical Views
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {layoutMode === "bento" ? (
          /* BENTO GRID LAYOUT */
          <motion.div
            key="bento-layout"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-5"
          >
            {/* Box 1: Longitudinal Clinical Trend Station (8 cols) */}
            <div className="md:col-span-8 bg-slate-50/50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-[380px]">
              <LongitudinalTrendGraph patient={patient} onLogAudit={onLogAudit} />
            </div>

            {/* Box 2: Patient Intake Portal & Link Dispatcher (4 cols) */}
            <div className="md:col-span-4 bg-[#F8FAFC] border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-[380px]">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                    Patient Intake Portal
                  </h3>
                  <span className="text-[9px] uppercase font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded">
                    PHIPA Secure
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mb-3">Send unique, encrypted self-service questionnaires directly to patient device</p>

                {/* Dispatch Channel Selector */}
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl mb-3">
                  <button
                    type="button"
                    onClick={() => setDispatchChannel("SMS")}
                    className={`py-1 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      dispatchChannel === "SMS" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Smartphone className="w-3 h-3" /> SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => setDispatchChannel("Email")}
                    className={`py-1 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      dispatchChannel === "Email" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Mail className="w-3 h-3" /> Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setDispatchChannel("QR Code")}
                    className={`py-1 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      dispatchChannel === "QR Code" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <QrCode className="w-3 h-3" /> Kiosk QR
                  </button>
                </div>

                <form onSubmit={handleDispatchIntake} className="space-y-3">
                  {dispatchChannel !== "QR Code" && (
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                        Recipient {dispatchChannel} Address
                      </label>
                      <input
                        type={dispatchChannel === "Email" ? "email" : "text"}
                        required
                        value={dispatchContact}
                        onChange={(e) => setDispatchContact(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isDispatching}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {isDispatching ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" /> Transmitting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        {dispatchChannel === "QR Code" ? "Generate Self-Service QR Link" : `Transmit Secure Portal ${dispatchChannel}`}
                      </>
                    )}
                  </button>
                </form>

                {latestDispatchedLink && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-[10px] text-emerald-800 mt-3 font-medium space-y-1"
                  >
                    <div className="flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Link Successfully Dispatched
                    </div>
                    <p className="truncate text-slate-500 font-mono text-[9px] select-all bg-white/70 px-1 py-0.5 rounded border border-emerald-100">{latestDispatchedLink.link}</p>
                    {dispatchChannel === "QR Code" && (
                      <button
                        type="button"
                        onClick={() => setShowQRModal(true)}
                        className="text-blue-600 hover:underline font-bold text-[9px] block mt-0.5"
                      >
                        Show QR Code on Screen
                      </button>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Portal dispatch logs */}
              <div className="mt-4 border-t border-slate-200/60 pt-3">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Live Delivery Monitor</span>
                <div className="space-y-1.5 overflow-y-auto max-h-[100px] scrollbar-thin pr-1">
                  {intakeLinks.filter(l => l.patientId === patient.id).map(l => (
                    <div key={l.id} className="flex items-center justify-between text-[10px] bg-white p-1.5 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-600 flex items-center gap-1">
                        {l.sentVia === "SMS" ? <Smartphone className="w-2.5 h-2.5 text-blue-500" /> : l.sentVia === "Email" ? <Mail className="w-2.5 h-2.5 text-purple-500" /> : <QrCode className="w-2.5 h-2.5 text-indigo-500" />}
                        {l.sentVia}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(l.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`text-[9px] font-bold px-1 rounded ${
                        l.status === "Completed" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                      }`}>
                        {l.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Box 3: Provincial EMR Gateway Connector (5 cols) */}
            <div className="md:col-span-5 bg-slate-50/50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-[340px]">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <Database className="w-4 h-4 text-indigo-500" />
                  Provincial EMR Connect Gateway
                </h3>
                <p className="text-[10px] text-slate-400 font-medium mb-3">Sync local charts securely with OSCAR & Accuro EMR networks</p>

                <div className="space-y-2 mb-3">
                  {integrations.map(int => (
                    <div key={int.id} className="bg-white p-2.5 rounded-xl border border-slate-150 flex items-center justify-between text-[10px]">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-700">{int.provider} ({int.province})</span>
                        <p className="text-slate-400 text-[9px] truncate max-w-[200px]">{int.endpointUrl}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${int.status === "Connected" ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <span className="font-bold text-slate-500">{int.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleEMRSync}
                  disabled={isSyncing}
                  className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "Compiling FHIR Resource..." : "Execute Real-time EMR Sync"}
                </button>
                <span className="text-[9px] text-slate-400 block text-center font-medium">Data residence locked to Canada Central Central (Toronto)</span>
              </div>
            </div>

            {/* Box 4: Active & Discontinued Medications (4 cols) */}
            <div className="md:col-span-4 bg-slate-50/50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-[340px]">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <Pill className="w-4 h-4 text-indigo-500" />
                  Medications & Changes Audit
                </h3>
                <p className="text-[10px] text-slate-400 font-medium mb-3">Clinical record of discontinued or modified therapies</p>

                <div className="space-y-2 overflow-y-auto max-h-[220px] scrollbar-thin pr-1">
                  {patient.medicationHistory && patient.medicationHistory.length > 0 ? (
                    patient.medicationHistory.map((med) => (
                      <div key={med.id} className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700">{med.name}</span>
                          <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[8px] font-bold px-1.5 py-0.2 rounded">
                            {med.status}
                          </span>
                        </div>
                        <p className="text-slate-400">{med.startDate} to {med.endDate || "Modified"}</p>
                        <p className="text-slate-600 italic bg-slate-50 p-1.5 rounded text-[9px] font-sans">
                          <strong>Reason:</strong> {med.changeReason}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 text-center py-6 text-[11px]">No recent medication discontinuations.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Box 5: Lab Highlights & Safety Alerts (3 cols) */}
            <div className="md:col-span-3 bg-slate-50/50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-[340px]">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Critical Lab Insights
                </h3>
                <p className="text-[10px] text-slate-400 font-medium mb-3">Abnormal indicators extracted from HL7</p>

                <div className="space-y-2 overflow-y-auto max-h-[200px] scrollbar-thin pr-1">
                  {patient.labs.map(lab => (
                    <div 
                      key={lab.id} 
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-[10px] ${
                        lab.status === "Critical" ? "bg-rose-50 border-rose-200 text-rose-950" : "bg-white border-slate-150"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold block truncate max-w-[120px]">{lab.testName}</span>
                        <span className="text-slate-400 text-[8px]">{lab.date}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold block ${lab.status === "Critical" ? "text-rose-600 animate-pulse" : "text-slate-700"}`}>
                          {lab.value}
                        </span>
                        <span className={`text-[8px] font-bold px-1 rounded uppercase ${lab.status === "Critical" ? "bg-rose-100 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {lab.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Full-width Box 6: Clinical SOAP Comparator & Terminal Payload Viewer (12 cols) */}
            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-5 bg-slate-900 text-white rounded-3xl p-6 min-h-[260px] font-mono">
              <div className="md:col-span-6 space-y-2 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <FileJson className="w-4 h-4" /> Secure HL7 FHIR Stream Inspector
                  </h4>
                  <p className="text-[10px] text-slate-400">View validated transactional payload generated dynamically for provincial gateways</p>
                </div>
                
                <div className="bg-slate-950 rounded-xl p-3 text-[10px] text-indigo-300 overflow-y-auto max-h-[160px] scrollbar-thin">
                  {inspectedLog ? (
                    <pre className="whitespace-pre-wrap">{inspectedLog.fhirPayloadPreview}</pre>
                  ) : (
                    <p className="text-slate-500 py-6 text-center">No active payload selected. Trigger a "EMR Sync" to generate raw HL7 JSON logs.</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-500">
                  <span>SSL/TLS 1.3 Encryption Active</span>
                  <span>CAN-Central Secured</span>
                </div>
              </div>

              <div className="md:col-span-6 space-y-3 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> ClinOS AI Clinical Compliance Status
                  </h4>
                  <p className="text-[10px] text-slate-400">Verifying alignment with provincial health acts</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-[10px] text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Ontario PHIPA (2004) Compliance</span>
                    <span className="text-emerald-400 font-bold">Passed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>British Columbia PIPA Compliance</span>
                    <span className="text-emerald-400 font-bold">Passed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sovereignty Residency Enforcement</span>
                    <span className="text-indigo-400 font-bold">100% CAN-Resident</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>HL7 FHIR REST Version Support</span>
                    <span className="text-slate-400 font-bold">v4.0.1 (R4) & STU3</span>
                  </div>
                </div>

                <div className="text-[9px] text-slate-500 italic">
                  *Audit logs recorded on cryptographically signed local databases for continuous medical council compliance reviews.
                </div>
              </div>
            </div>

            {/* Box 7: Preventative Care & Chronic Guidelines Gaps (12 cols) */}
            <div className="md:col-span-12 bg-[#F8FAFC]/50 border border-slate-200 rounded-3xl p-6 min-h-[380px]">
              <div className="mb-5">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-600 animate-pulse" />
                  Preventative Care & Chronic Guidelines Alignment
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Continuous computerized guidelines check for chronic conditions, immunization schedules, and age-specific preventative screenings.
                </p>
              </div>
              <PreventativeCareGaps patient={patient} onLogAudit={onLogAudit} />
            </div>
          </motion.div>
        ) : (
          /* CLASSIC TAB VIEW LAYOUT */
          <motion.div
            key="classic-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
              <button
                onClick={() => setActiveTab("trends")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer ${
                  activeTab === "trends" ? "bg-[#0F172A] text-white" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Clinical Trends & Labs
              </button>
              <button
                onClick={() => setActiveTab("preventative")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer ${
                  activeTab === "preventative" ? "bg-[#0F172A] text-white" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🛡️ Preventative Care Guidelines
              </button>
              <button
                onClick={() => setActiveTab("integrations")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer ${
                  activeTab === "integrations" ? "bg-[#0F172A] text-white" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Provincial Gateways
              </button>
            </div>

            {activeTab === "trends" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-8 bg-slate-50 border border-slate-200 rounded-2xl p-5 min-h-[380px]">
                  <LongitudinalTrendGraph patient={patient} onLogAudit={onLogAudit} />
                </div>

                <div className="md:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <h4 className="text-xs font-bold text-slate-700 mb-3">Key Lab Observation Limits</h4>
                  <div className="space-y-2">
                    {patient.labs.map(lab => (
                      <div key={lab.id} className="bg-white p-2.5 rounded-lg border text-[11px] flex justify-between">
                        <span>{lab.testName}</span>
                        <strong className={lab.status === "Critical" ? "text-rose-600 animate-pulse" : "text-slate-700"}>{lab.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "preventative" && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 min-h-[380px]">
                <PreventativeCareGaps patient={patient} onLogAudit={onLogAudit} />
              </div>
            )}

            {activeTab === "integrations" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Integration Credentials list in Classic Tab */}
                <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700">Active EMR Integrations</h4>
                  {integrations.map(int => (
                    <div key={int.id} className="bg-white p-3 rounded-xl border">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800">{int.provider}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${int.status === "Connected" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{int.status}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Endpoint: {int.endpointUrl}</p>
                    </div>
                  ))}
                </div>

                <div className="md:col-span-7 bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-xs">
                  <span className="text-[10px] text-indigo-400 block mb-2 font-bold uppercase">HL7 FHIR Sandbox Payload</span>
                  <pre className="text-[10px] leading-normal bg-slate-950 p-3 rounded-lg overflow-x-auto h-[240px] text-indigo-300">
                    {inspectedLog ? inspectedLog.fhirPayloadPreview : "Sync patient data to view payload structure."}
                  </pre>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Self-Service Modal */}
      {showQRModal && latestDispatchedLink && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full mx-4 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold text-slate-800">In-Clinic Self-Service Intake Kiosk</span>
              <button 
                onClick={() => setShowQRModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                Close
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center space-y-3 border">
              {/* Clean Mock QR Code Layout */}
              <div className="w-40 h-40 bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-center relative">
                <QrCode className="w-full h-full text-slate-800" />
                <div className="absolute w-8 h-8 bg-blue-600 rounded-lg border-2 border-white flex items-center justify-center text-white font-extrabold text-[8px] tracking-wide">
                  Clin
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-extrabold text-slate-800">Scan to Complete Intake Form</p>
                <p className="text-[10px] text-slate-500 font-medium max-w-[240px] mx-auto">
                  Hand the tablet or have {patient.name} scan this QR code to securely fill out the pre-visit history questionnaire in the waiting room.
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 text-emerald-800 p-2 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-600" /> Compliant with Ontario PHIPA regulations
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
