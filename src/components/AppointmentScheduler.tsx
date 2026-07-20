import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Plus, 
  Check, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Video,
  MapPin,
  CalendarDays,
  Mail,
  Send,
  Lock,
  X,
  Loader2
} from "lucide-react";
import { Patient, Appointment } from "../types";
import { getAccessToken, googleSignIn } from "../lib/googleAuth";
import { sendGmailEmail } from "../lib/gmailService";

interface AppointmentSchedulerProps {
  patient: Patient;
  onRefresh?: () => void;
  onLogAudit: (action: string, details: string) => void;
}

export default function AppointmentScheduler({ patient, onRefresh, onLogAudit }: AppointmentSchedulerProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Form fields
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("09:00 AM");
  const [clinicianName, setClinicianName] = useState<string>("Dr. Alistair Vance");
  const [reason, setReason] = useState<string>("");
  const [apptType, setApptType] = useState<"In-Person" | "Virtual">("In-Person");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Gmail Confirmation State
  const [activeApptToEmail, setActiveApptToEmail] = useState<Appointment | null>(null);
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isEmailing, setIsEmailing] = useState<boolean>(false);
  const [isGoogleLoggedIn, setIsGoogleLoggedIn] = useState<boolean>(!!getAccessToken());

  useEffect(() => {
    if (patient) {
      setRecipientEmail(patient.name.toLowerCase().replace(/\s+/g, "") + "@example.com");
    }
  }, [patient]);

  // Keep Google logged in state in sync with cached token
  useEffect(() => {
    const checkToken = setInterval(() => {
      setIsGoogleLoggedIn(!!getAccessToken());
    }, 1000);
    return () => clearInterval(checkToken);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setIsGoogleLoggedIn(true);
        onLogAudit("GOOGLE_OAUTH_SIGN_IN_SCHEDULER", `Connected Google account: ${res.user.email} in Appointment Scheduler.`);
      }
    } catch (err) {
      console.error("Google OAuth login failure in Scheduler:", err);
    }
  };

  const handleSendAppointmentEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApptToEmail || !recipientEmail || !emailSubject) {
      setEmailStatus({ type: "error", text: "Please enter a valid recipient email and subject." });
      return;
    }

    // Secure clinical dispatch confirmation
    const confirmed = window.confirm(`Send appointment confirmation receipt to ${recipientEmail} via Gmail?`);
    if (!confirmed) return;

    setIsEmailing(true);
    setEmailStatus(null);

    const emailHtml = generateAppointmentEmailHtml(patient.name, activeApptToEmail);

    try {
      const result = await sendGmailEmail({
        to: recipientEmail,
        subject: emailSubject,
        bodyHtml: emailHtml
      });

      if (result.success) {
        setEmailStatus({ type: "success", text: "Successfully dispatched appointment confirmation to patient email via secure Gmail!" });
        onLogAudit("GMAIL_APPOINTMENT_CONFIRMATION_SUCCESS", `Securely sent appointment confirmation for ${activeApptToEmail.date} to ${recipientEmail} via clinician Gmail.`);
        setTimeout(() => {
          setActiveApptToEmail(null);
          setEmailStatus(null);
        }, 2000);
      } else {
        setEmailStatus({ type: "error", text: result.error || "Failed to dispatch confirmation email." });
        onLogAudit("GMAIL_APPOINTMENT_CONFIRMATION_FAILED", `Failed to send confirmation to ${recipientEmail}: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      setEmailStatus({ type: "error", text: "Unexpected network error during Gmail confirmation dispatch." });
    } finally {
      setIsEmailing(false);
    }
  };



  // Fetch appointments from API
  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      console.error("Error fetching clinical appointments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    
    // Set default date to 3 days in the future for convenience
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    setDate(futureDate.toISOString().split("T")[0]);
  }, [patient.id]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !reason) {
      setMessage({ type: "error", text: "Please fill in all required clinical fields." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          patientName: patient.name,
          date,
          time,
          clinicianName,
          reason: `${apptType} • ${reason}`
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Appointment scheduled successfully and pushed to OSCAR EMR!" });
        setReason("");
        fetchAppointments();
        if (onRefresh) onRefresh();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to schedule appointment." });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Network error. Failed to schedule appointment." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter appointments for active patient
  const patientAppts = appointments.filter(a => a.patientId === patient.id);

  const timeSlots = [
    "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", 
    "11:00 AM", "11:30 AM", "01:00 PM", "01:30 PM", "02:00 PM", 
    "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM"
  ];

  const clinicians = [
    "Dr. Alistair Vance (Primary Care)",
    "Dr. S. Nair (Obstetrics Specialist)",
    "Dr. Sarah Patel (Nephrology Consultant)",
    "RN Jane Kowalski (Gestational Health Nurse)"
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full" id="appointment-scheduler">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            Provincial EMR Appointment Scheduler
          </h2>
          <p className="text-xs text-slate-400 font-medium">Schedule follow-ups, specialist consults, and virtual clinics for this patient record</p>
        </div>
        <span className="text-[10px] uppercase font-mono bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100 font-bold">
          EMR Sync Enabled
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* Left Hand Column: Scheduling Form */}
        <form onSubmit={handleSchedule} className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Book Consultation Form
            </h3>

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                  message.type === "success" 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </motion.div>
            )}

            {/* Clinician selection */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Assigned Provider
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <select
                  value={clinicianName}
                  onChange={(e) => setClinicianName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 focus:outline-hidden focus:border-blue-500 transition-all font-medium"
                >
                  {clinicians.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date and Time selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Consultation Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 focus:outline-hidden focus:border-blue-500 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Time Slot
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 focus:outline-hidden focus:border-blue-500 transition-all font-medium"
                  >
                    {timeSlots.map((ts, i) => (
                      <option key={i} value={ts}>{ts}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Appointment format */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Consultation Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setApptType("In-Person")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    apptType === "In-Person"
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  In-Person Clinic
                </button>
                <button
                  type="button"
                  onClick={() => setApptType("Virtual")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    apptType === "Virtual"
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  OTN Video Consult
                </button>
              </div>
            </div>

            {/* Reason for Appointment */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Clinical Reason / Indication
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Stage 4 kidney disease review, blood pressure audit, postpartum follow-up..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 transition-all font-medium resize-none"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !reason || !date}
            className="w-full mt-4 px-4 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-blue-500/10"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Booking EMR Appointment...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Schedule EMR Appointment
              </>
            )}
          </button>
        </form>

        {/* Right Hand Column: Booked Appointments List */}
        <div className="lg:col-span-7 flex flex-col h-[380px] justify-between border-l border-slate-100 pl-4">
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-100 pb-1.5 mb-1.5">
              <span>SCHEDULED CONSULTATIONS ({patientAppts.length})</span>
              <span className="font-mono text-emerald-600 font-semibold uppercase">OSCAR Live Feed</span>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-medium">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mb-3"
                />
                <p className="text-xs font-bold animate-pulse text-slate-700">Loading scheduled records...</p>
              </div>
            ) : patientAppts.length > 0 ? (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {patientAppts.map((appt, idx) => {
                    const isVirtual = appt.reason.includes("Virtual");
                    return (
                      <motion.div
                        key={appt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl p-3.5 flex items-start gap-3.5 transition-all"
                      >
                        <div className={`p-2.5 rounded-lg ${isVirtual ? "bg-indigo-50 text-indigo-600" : "bg-blue-50 text-blue-600"} shrink-0`}>
                          {isVirtual ? (
                            <Video className="w-4 h-4" />
                          ) : (
                            <MapPin className="w-4 h-4" />
                          )}
                        </div>

                        <div className="space-y-1 flex-1 min-w-0 text-xs">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-bold text-slate-700 font-mono text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                              {appt.date} • {appt.time}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveApptToEmail(appt);
                                  setEmailSubject(`Consultation Confirmation - ${appt.reason.split("•")[1]?.trim() || appt.reason}`);
                                  setEmailStatus(null);
                                }}
                                className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer border border-indigo-150"
                                title="Send confirmation via Gmail"
                              >
                                <Mail className="w-3 h-3 text-indigo-600" />
                                <span>Email Receipt</span>
                              </button>
                              <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">
                                {appt.status}
                              </span>
                            </div>
                          </div>

                          <p className="font-semibold text-slate-800 text-[13px]">{appt.reason}</p>
                          
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>With {appt.clinicianName}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 h-full">
                <Calendar className="w-12 h-12 stroke-1 mb-2.5 text-slate-300" />
                <h4 className="text-sm font-medium text-slate-700">No Consultations Scheduled</h4>
                <p className="text-xs text-slate-400 text-center max-w-xs mt-1">
                  Book a future follow-up or clinic check-in for {patient.name} using the form on the left.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gmail Appointment Confirmation Modal */}
      <AnimatePresence>
        {activeApptToEmail && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-[#0F172A] text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-xs font-bold tracking-tight text-white">Gmail Dispatch Service</h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 font-mono">Send Appointment Confirmation</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveApptToEmail(null);
                    setEmailStatus(null);
                  }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                {!isGoogleLoggedIn ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto border border-indigo-100">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                      <h4 className="text-xs font-bold text-slate-800">OAuth Connection Required</h4>
                      <p className="text-xs text-slate-400 leading-normal font-semibold">
                        ClinOS utilizes your authorized clinician Google Workspace Gmail profile to send appointment confirmations. Please sign in to connect.
                      </p>
                    </div>
                    <button
                      onClick={handleGoogleLogin}
                      className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.53 14.98 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.85 3C6.25 7.42 8.9 5.04 12 5.04z" />
                        <path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.44c-.28 1.46-1.1 2.69-2.34 3.52l3.63 2.82c2.13-1.97 3.36-4.87 3.36-8.47z" />
                        <path fill="#FBBC05" d="M5.35 14.5c-.24-.73-.38-1.5-.38-2.3s.14-1.57.38-2.3L1.5 6.9C.54 8.81 0 10.94 0 13.2s.54 4.39 1.5 6.3l3.85-3z" />
                        <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.63-2.82c-1.1.74-2.5 1.18-4.3 1.18-3.1 0-5.75-2.38-6.65-5.46L1.5 16.1c1.9 3.85 5.85 6.5 10.5 6.5z" />
                      </svg>
                      <span className="text-xs font-bold text-slate-800">Sign in with Google</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendAppointmentEmail} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Patient Target Email</label>
                      <input
                        type="email"
                        required
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="patient@example.com"
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Email Subject</label>
                      <input
                        type="text"
                        required
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Subject"
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs space-y-1 font-medium text-indigo-950">
                      <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-[11px] uppercase tracking-wide">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>MIME Packaged Confirmation Compiled</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Confirming: {activeApptToEmail.reason} with {activeApptToEmail.clinicianName} on {activeApptToEmail.date} at {activeApptToEmail.time} EST.
                        {activeApptToEmail.reason.includes("Virtual") ? " Includes secure OTN virtual consult credentials." : " Includes clinic center maps and directions."}
                      </p>
                    </div>

                    {emailStatus && (
                      <div
                        className={`p-3 rounded-xl border text-xs font-semibold ${
                          emailStatus.type === "success"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-rose-50 border-rose-200 text-rose-800"
                        }`}
                      >
                        {emailStatus.text}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveApptToEmail(null);
                          setEmailStatus(null);
                        }}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isEmailing}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
                      >
                        {isEmailing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending Confirmation...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Send via Gmail</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// RFC 2822 Confirmation generator
const generateAppointmentEmailHtml = (patientName: string, appt: Appointment) => {
  const isVirtual = appt.reason.includes("Virtual");
  const reasonText = appt.reason.split("•")[1]?.trim() || appt.reason;
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #1e3a8a; padding: 24px; border-radius: 8px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">ClinOS Family Medicine Clinic</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #93c5fd; font-weight: 500;">700 University Ave, Toronto, ON M5G 1Z5 • (416) 555-0199</p>
      </div>

      <div style="padding: 20px 0; border-bottom: 1px solid #f1f5f9;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #1e3a8a; font-weight: 700; text-align: center;">APPOINTMENT CONFIRMATION RECEIPT</h3>
        <p style="font-size: 13px; color: #334155; line-height: 1.5;">
          Dear <strong>${patientName}</strong>,<br/><br/>
          This email is to confirm your upcoming clinical consultation scheduled in our digital registry system. Below are the appointment and participation details:
        </p>
      </div>

      <div style="padding: 20px 0; border-bottom: 1px solid #f1f5f9; background-color: #f8fafc; border-radius: 8px; margin: 15px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 0 12px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500; width: 140px;">Consultation Date:</td>
            <td style="padding: 6px 0; color: #1e3a8a; font-weight: 700;">${appt.date}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Scheduled Time:</td>
            <td style="padding: 6px 0; color: #1e3a8a; font-weight: 700;">${appt.time} EST</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Provider:</td>
            <td style="padding: 6px 0; color: #334155; font-weight: 600;">${appt.clinicianName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Format:</td>
            <td style="padding: 6px 0; color: #334155; font-weight: 600;">
              <span style="font-weight: 700; color: ${isVirtual ? "#4f46e5" : "#2563eb"};">${isVirtual ? "OTN Virtual Video Consult" : "In-Person Clinic Visit"}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Clinical Indication:</td>
            <td style="padding: 6px 0; color: #334155; font-weight: 600;">${reasonText}</td>
          </tr>
        </table>
      </div>

      <div style="padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #1e3a8a; font-weight: 700;">Participation Instructions</h4>
        ${isVirtual ? `
          <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-left: 4px solid #8b5cf6; padding: 12px; border-radius: 6px; font-size: 12px; color: #4c1d95;">
            <strong>Virtual Link:</strong> Click the following secure video consultation room link 10 minutes prior to your slot: 
            <br/><a href="https://otnhub.ca/live/consult/${appt.id}" style="color: #6d28d9; font-weight: bold; text-decoration: underline; word-break: break-all;">https://otnhub.ca/live/consult/${appt.id}</a>
            <br/><br/>Ensure your camera, microphone, and a stable internet connection are tested beforehand.
          </div>
        ` : `
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #3b82f6; padding: 12px; border-radius: 6px; font-size: 12px; color: #1e3a8a;">
            <strong>Location:</strong> Please report to the Front Desk at the ClinOS Medical Office Center:
            <br/><strong>700 University Ave, 4th Floor Reception, Toronto, ON M5G 1Z5</strong>
            <br/><br/>Please bring your provincial Health Card (OHIP/BC Services Card) and check in at least 15 minutes prior to your slot.
          </div>
        `}
      </div>

      <div style="margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: 500;">
        <p>Please do not reply directly to this email. For any cancellations or changes, please notify reception at least 24 hours prior.</p>
        <p style="margin-top: 4px; font-family: monospace; font-size: 10px;">ID: APPT-${appt.id}-CONF</p>
      </div>
    </div>
  `;
};
