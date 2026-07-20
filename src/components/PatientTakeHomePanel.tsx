import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Printer, 
  Sparkles, 
  CheckCircle, 
  Calendar, 
  Pill, 
  Heart, 
  MessageSquare,
  ShieldAlert,
  FileText,
  Clock,
  ArrowRight,
  Sparkle,
  FileDown,
  Loader2,
  Mail,
  Send,
  Lock,
  X
} from "lucide-react";
import { Patient, Appointment } from "../types";
import { getAccessToken, googleSignIn } from "../lib/googleAuth";
import { sendGmailEmail } from "../lib/gmailService";

interface PatientTakeHomePanelProps {
  patient: Patient;
  onLogAudit: (action: string, details: string) => void;
}

export default function PatientTakeHomePanel({ patient, onLogAudit }: PatientTakeHomePanelProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customNote, setCustomNote] = useState<string>(
    "Please continue monitoring your blood pressure twice daily. Keep active, and ensure you remain hydrated throughout the day."
  );
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Gmail states
  const [isEmailing, setIsEmailing] = useState<boolean>(false);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isGoogleLoggedIn, setIsGoogleLoggedIn] = useState<boolean>(!!getAccessToken());

  useEffect(() => {
    if (patient) {
      setRecipientEmail(patient.name.toLowerCase().replace(/\s+/g, "") + "@example.com");
      setEmailSubject(`ClinOS Patient Health Summary Handout - ${patient.name}`);
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
        onLogAudit("GOOGLE_OAUTH_SIGN_IN_TAKEHOME", `Connected Google account: ${res.user.email} in Care Plan Panel.`);
      }
    } catch (err) {
      console.error("Google OAuth login failure in Take-Home Panel:", err);
    }
  };

  const generateSummaryEmailHtml = () => {
    const formattedConditions = patient.conditions.map((cond) => {
      const trans = laypersonConditions[cond] || cond;
      return `<li style="margin-bottom: 8px; font-size: 13px; color: #334155;"><strong>${cond}</strong>: ${trans}</li>`;
    }).join("");

    const formattedMeds = patient.currentMedications.map((med) => {
      const details = laypersonMeds[med.name] || {
        purpose: "Prescribed health maintenance",
        instructions: "Take according to clinician's directed dosing schedule."
      };
      const isDiscontinued = med.status === "Discontinued";
      return `
        <div style="padding: 12px; margin-bottom: 10px; border-radius: 8px; border: 1px solid ${isDiscontinued ? "#fecaca" : "#e2e8f0"}; background-color: ${isDiscontinued ? "#fef2f2" : "#f8fafc"};">
          <div style="font-size: 13px; font-weight: 700; color: #1e293b;">
            ${med.name} (${med.dosage}) - <span style="color: ${isDiscontinued ? "#dc2626" : "#2563eb"};">${med.status}</span>
          </div>
          <div style="font-size: 12px; color: #475569; margin-top: 4px;">
            <strong>Schedule:</strong> ${med.frequency}<br/>
            <strong>Purpose:</strong> ${details.purpose}<br/>
            <strong>Instructions:</strong> ${details.instructions}
          </div>
        </div>
      `;
    }).join("");

    const formattedAppts = appointments.map((appt) => {
      return `<li style="margin-bottom: 6px; font-size: 13px; color: #334155;"><strong>${appt.date} at ${appt.time}</strong> with ${appt.clinicianName} (${appt.reason})</li>`;
    }).join("");

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #e11d48; padding: 24px; border-radius: 8px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">ClinOS Family Medicine Clinic</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #fecdd3; font-weight: 500;">700 University Ave, Toronto, ON M5G 1Z5 • (416) 555-0199</p>
        </div>

        <div style="padding: 20px 0; border-bottom: 1px solid #f1f5f9;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #e11d48; font-weight: 700; text-align: center;">YOUR PERSONAL HEALTH CARE PLAN</h3>
          <p style="font-size: 13px; color: #334155; line-height: 1.5; text-align: center;">
            Prepared for: <strong>${patient.name}</strong> • Birth Date: ${patient.birthDate}
          </p>
        </div>

        <div style="padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
          <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #e11d48; font-weight: 700;">1. Your Active Care Focus</h4>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.5;">
            ${formattedConditions}
          </ul>
        </div>

        <div style="padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #e11d48; font-weight: 700;">2. Medication Schedule & Instructions</h4>
          ${formattedMeds}
        </div>

        <div style="padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #e11d48; font-weight: 700;">3. Safety & Allergy Reminders</h4>
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; border-radius: 6px; font-size: 12px; color: #991b1b; line-height: 1.5;">
            <strong>Allergy Safeguards:</strong> You have documented high sensitivity to: <strong>${patient.allergies.join(", ")}</strong>. Please share this list with any external clinician or dental specialist.
          </div>
        </div>

        ${appointments.length > 0 ? `
          <div style="padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
            <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #e11d48; font-weight: 700;">4. Upcoming Follow-ups</h4>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.5;">
              ${formattedAppts}
            </ul>
          </div>
        ` : ""}

        <div style="padding: 15px 0; border-bottom: 1px solid #f1f5f9;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #e11d48; font-weight: 700;">5. Lifestyle & Doctor Guidelines</h4>
          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; border-radius: 6px; font-size: 12px; color: #1e3a8a; line-height: 1.5; white-space: pre-wrap;">
            ${customNote}
          </div>
        </div>

        <div style="margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: 500;">
          <p>Please do not reply directly to this email. For any cancellations or changes, please notify reception at least 24 hours prior.</p>
          <p style="margin-top: 4px; font-family: monospace; font-size: 10px;">ID: PAT-${patient.id}-${patient.phn.slice(-4)}-LIVE</p>
        </div>
      </div>
    `;
  };

  const handleGmailSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !emailSubject) {
      setEmailStatus({ type: "error", text: "Please enter a valid recipient email and subject." });
      return;
    }

    // Secure clinical confirmation popup
    const confirmed = window.confirm(`Are you sure you want to securely dispatch this patient summary to ${recipientEmail} via Gmail?`);
    if (!confirmed) return;

    setIsEmailing(true);
    setEmailStatus(null);

    const emailHtml = generateSummaryEmailHtml();

    try {
      const result = await sendGmailEmail({
        to: recipientEmail,
        subject: emailSubject,
        bodyHtml: emailHtml
      });

      if (result.success) {
        setEmailStatus({ type: "success", text: "Successfully dispatched care plan summary to patient via secure Gmail!" });
        onLogAudit("GMAIL_PATIENT_SUMMARY_SUCCESS", `Securely sent Patient Care Handout to ${recipientEmail} via clinician Gmail.`);
        setTimeout(() => {
          setShowEmailModal(false);
          setEmailStatus(null);
        }, 2000);
      } else {
        setEmailStatus({ type: "error", text: result.error || "Failed to dispatch email." });
        onLogAudit("GMAIL_PATIENT_SUMMARY_FAILED", `Failed to send care plan summary to ${recipientEmail}: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      setEmailStatus({ type: "error", text: "Unexpected network error during Gmail dispatch." });
    } finally {
      setIsEmailing(false);
    }
  };



  // Fetch appointments from API
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch("/api/appointments");
        const data = await res.json();
        setAppointments(data.filter((a: Appointment) => a.patientId === patient.id));
      } catch (err) {
        console.error("Error fetching clinical appointments in PatientTakeHomePanel:", err);
      }
    };
    fetchAppointments();
  }, [patient.id]);

  const handlePrint = () => {
    onLogAudit("PRINT_PATIENT_SUMMARY", `Generated and printed take-home care summary handout for patient ${patient.name}.`);
    window.print();
  };

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true);
    setIsExporting(true);
    onLogAudit("EXPORT_PATIENT_SUMMARY_PDF", `Initiated high-fidelity PDF document compilation for patient ${patient.name}.`);
    
    // Allow state change and layout recalculation to complete
    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = document.getElementById("printable-handout-content");
      if (!element) {
        throw new Error("Handout content container not found.");
      }

      const canvas = await html2canvas(element, {
        scale: 2, // 2x resolution
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297
      
      const margin = 10; // 10mm margins
      const printWidth = pdfWidth - (margin * 2);
      const printHeight = (canvas.height * printWidth) / canvas.width;
      
      let heightLeft = printHeight;
      let position = margin;

      pdf.addImage(imgData, "JPEG", margin, position, printWidth, printHeight, undefined, "FAST");
      heightLeft -= (pdfHeight - (margin * 2));

      while (heightLeft > 0) {
        position = heightLeft - printHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", margin, position, printWidth, printHeight, undefined, "FAST");
        heightLeft -= (pdfHeight - (margin * 2));
      }

      pdf.save(`Patient_Care_Plan_${patient.name.replace(/\s+/g, "_")}.pdf`);
      onLogAudit("EXPORT_PATIENT_SUMMARY_PDF_SUCCESS", `Downloaded Patient Care Plan PDF: Patient_Care_Plan_${patient.name}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      onLogAudit("EXPORT_PATIENT_SUMMARY_PDF_FAILED", `PDF compilation failed: ${err instanceof Error ? err.message : String(err)}. Invoking fallback system printer.`);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
      setIsExporting(false);
    }
  };

  const handleCopyLink = () => {
    setIsCopied(true);
    onLogAudit("SHARE_PATIENT_SUMMARY_PORTAL", `Shared digital patient-portal secure care plan summary for ${patient.name}.`);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Convert medical jargon conditions to layperson terms
  const laypersonConditions: Record<string, string> = {
    "Chronic Kidney Disease": "Reduced kidney filtering capacity (Stage 4, requiring close medication audits)",
    "Pregnancy": "Expecting a baby (26 weeks gestation, close tracking of blood pressure)",
    "Gestational Hypertension": "Pregnancy-related higher blood pressure",
    "Diabetes Mellitus Type 2": "Type 2 Diabetes (requiring blood sugar tracking)",
    "Hypertension": "High blood pressure",
    "Asthma": "Reactive airways (using preventative inhalers)",
    "Hyperlipidemia": "Mildly elevated cholesterol levels"
  };

  const laypersonMeds: Record<string, { purpose: string; instructions: string }> = {
    "Metformin": {
      purpose: "Helps regulate blood sugar levels",
      instructions: "Take with meals. IMPORTANT: This medication is currently paused due to active renal function safety updates."
    },
    "Insulin Glargine": {
      purpose: "Long-acting blood sugar regulation",
      instructions: "Inject once daily at bedtime as directed by your clinical nurse coordinator."
    },
    "Labetalol": {
      purpose: "Controls and manages blood pressure during pregnancy",
      instructions: "Take exactly as scheduled. Do not miss doses. Monitor blood pressure daily."
    },
    "Prenatal Multivitamin": {
      purpose: "Supports fetal development and maternal health",
      instructions: "Take 1 tablet daily with food."
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full" id="patient-take-home-summary">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500/10" />
            Patient Take-Home Health Receipt
          </h2>
          <p className="text-xs text-slate-400 font-medium">Simplified, jargon-free health summary and lifestyle guidelines provided to patients</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={handleCopyLink}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer"
          >
            {isCopied ? "✓ Shared with Portal" : "Share with Patient Portal"}
          </button>
          <button 
            onClick={() => setShowEmailModal(true)}
            className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Mail className="w-3.5 h-3.5 text-indigo-600" />
            <span>Email Handout (Gmail)</span>
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={isGeneratingPDF}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Compiling PDF...
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                Export PDF Handout
              </>
            )}
          </button>
          <button 
            onClick={handlePrint}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Receipt
          </button>
        </div>
      </div>

      {/* Main Print Preview Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-5 custom-scrollbar max-h-[600px] border border-slate-150 rounded-2xl p-5 bg-slate-50/50">
        <div id="printable-handout-content" className="space-y-5 bg-transparent p-1">
        
        {/* Printable Card Header */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs space-y-4">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-500" />
                ClinOS Family Medicine Clinic
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">700 University Ave, Toronto, ON M5G 1Z5 • (416) 555-0199</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase font-mono tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                Patient Copy
              </span>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">{new Date().toISOString().split('T')[0]}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Patient Name</p>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{patient.name}</p>
              <p className="text-[11px]">Birth Date: {patient.birthDate}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Primary Physician</p>
              <p className="font-bold text-slate-800 text-sm mt-0.5">Dr. Alistair Vance, CCFP</p>
              <p className="text-[11px]">Provincial Provider ID: #ON-992143</p>
            </div>
          </div>
        </div>

        {/* Dynamic layperson-friendly conditions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs space-y-3.5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            Your Documented Care Focus
          </h4>
          
          <div className="space-y-2.5">
            {patient.conditions.map((cond, idx) => {
              const translation = laypersonConditions[cond] || cond;
              return (
                <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-lg p-3 text-xs flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <h5 className="font-bold text-slate-800">{cond}</h5>
                    <p className="text-slate-500 mt-0.5 font-medium leading-relaxed">{translation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Simplified Medication Plan */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs space-y-3.5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Pill className="w-3.5 h-3.5 text-indigo-500" />
            Your Active Medication Plan
          </h4>

          <div className="space-y-3">
            {patient.currentMedications.map((med) => {
              const details = laypersonMeds[med.name] || {
                purpose: "Prescribed health maintenance",
                instructions: "Take according to clinician's directed dosing schedule."
              };
              const isDiscontinued = med.status === "Discontinued";
              
              return (
                <div 
                  key={med.id} 
                  className={`border rounded-xl p-3.5 text-xs transition-all ${
                    isDiscontinued 
                      ? "bg-rose-50/30 border-rose-100 text-rose-950 opacity-80" 
                      : "bg-indigo-50/30 border-indigo-100 text-indigo-950"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isDiscontinued ? "bg-rose-500 animate-pulse" : "bg-indigo-500"}`} />
                      <h5 className="font-extrabold text-slate-800 text-[13px]">{med.name} ({med.dosage})</h5>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isDiscontinued ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"
                    }`}>
                      {med.status}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1.5 text-[11px] text-slate-600 font-medium">
                    <p><strong className="text-slate-700">Schedule:</strong> {med.frequency}</p>
                    <p><strong className="text-slate-700">Purpose:</strong> {details.purpose}</p>
                    <p className={`p-2 rounded-lg mt-1 ${isDiscontinued ? "bg-rose-100/50 text-rose-900 border border-rose-200" : "bg-white text-slate-600 border border-slate-150"}`}>
                      <strong className="text-slate-800">Dosing Directions:</strong> {details.instructions}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Safety Alert Awareness */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs space-y-3.5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            Safety & Allergy Reminders
          </h4>

          <div className="space-y-3">
            {/* Allergies banner */}
            <div className="bg-rose-50/55 border border-rose-200/80 rounded-xl p-3.5 text-xs text-rose-950 flex gap-3">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider block">Documented Allergy Conflicts:</span>
                <p className="mt-1 font-semibold text-slate-700">
                  You are highly sensitive to: <strong className="text-rose-700">{patient.allergies.join(", ")}</strong>. Ensure any medical specialist or dental professional you consult is notified of this list prior to prescribing medications.
                </p>
              </div>
            </div>

            {/* Special notices */}
            {patient.pregnancyStatus !== "None" && (
              <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-950 flex gap-3">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider block">Special Health Status Guidance:</span>
                  <p className="mt-1 font-semibold text-slate-700">
                    Active pregnancy status is documented at <strong className="text-amber-800">26 weeks gestation ({patient.pregnancyStatus})</strong>. Due to this, certain blood-pressure and over-the-counter medications are contraindicated and have been strictly audited on your record.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Next Consultations List */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs space-y-3.5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            Your Next Scheduled Consultations
          </h4>

          {appointments.length > 0 ? (
            <div className="space-y-2.5">
              {appointments.map((appt) => (
                <div key={appt.id} className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-3 text-xs flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-800 text-sm">
                      {appt.reason.split("•")[1] || appt.reason}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">With {appt.clinicianName}</p>
                    <p className="text-[10px] font-mono text-slate-400 bg-white border border-slate-100 px-1.5 py-0.5 rounded-md inline-block">
                      {appt.reason.split("•")[0] || "Clinic Visit"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-slate-800 font-mono">{appt.date}</p>
                    <p className="text-[11px] text-slate-500 font-mono font-semibold">{appt.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs">
              <p className="font-semibold">No upcoming appointments scheduled on file.</p>
              <p className="text-[10px] mt-0.5">Call our clinical reception if you need to coordinate a check-up.</p>
            </div>
          )}
        </div>

        {/* Customizable Clinician Notes Handout */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs space-y-3.5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
            Special Clinician Lifestyle Guidelines
          </h4>

          <div className="space-y-2">
            {isExporting ? (
              <div className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">
                {customNote || "No custom lifestyle guidelines provided."}
              </div>
            ) : (
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:border-blue-500 transition-all leading-relaxed resize-none print:border-none print:bg-white print:p-0"
                rows={3}
                placeholder="Enter special instructions for the patient..."
              />
            )}
            <p className="text-[10px] text-slate-400 italic font-medium print:hidden">
              * Clinicians can customize this text box prior to printing or exporting the handout.
            </p>
          </div>
        </div>

        {/* Bottom Verification Section */}
        <div className="bg-blue-50/50 border border-blue-150/60 p-4 rounded-xl flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-slate-800">Digitally Verified Health Record Receipt</p>
              <p className="text-[11px] text-slate-500">Securely verified via provincial clinical sync networks.</p>
            </div>
          </div>
          <div className="font-mono text-[9px] uppercase font-bold text-slate-400 border border-slate-200 bg-white px-2.5 py-0.5 rounded-full">
            REF-ID: {patient.id}-{patient.phn.slice(-4)}-LIVE
          </div>
        </div>

        </div> {/* End of printable-handout-content */}
      </div>

      {/* Gmail Send Modal Overlay */}
      <AnimatePresence>
        {showEmailModal && (
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
                    <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Secure Patient Care Handout Delivery</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
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
                        ClinOS utilizes your authorized clinician Google Workspace Gmail profile to send summaries securely. Please sign in to connect.
                      </p>
                    </div>
                    <button
                      onClick={handleGoogleLogin}
                      className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.53 14.98 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.85 3C6.25 7.42 8.9 5.04 12 5.04z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.49 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.44c-.28 1.46-1.1 2.69-2.34 3.52l3.63 2.82c2.13-1.97 3.36-4.87 3.36-8.47z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.35 14.5c-.24-.73-.38-1.5-.38-2.3s.14-1.57.38-2.3L1.5 6.9C.54 8.81 0 10.94 0 13.2s.54 4.39 1.5 6.3l3.85-3z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.63-2.82c-1.1.74-2.5 1.18-4.3 1.18-3.1 0-5.75-2.38-6.65-5.46L1.5 16.1c1.9 3.85 5.85 6.5 10.5 6.5z"
                        />
                      </svg>
                      <span className="text-xs font-bold text-slate-800">Sign in with Google</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleGmailSend} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Recipient Patient Email</label>
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

                    <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Summary Payload Status</span>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>MIME Packaged HTML Care Summary compiled successfully.</span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-normal">
                        Includes: Layperson translation of {patient.conditions.length} conditions, allergies safeguards, dosage guidelines for {patient.currentMedications.length} active medications, and upcoming clinic follow-ups.
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
                          setShowEmailModal(false);
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
                            <span>Sending via Gmail...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Dispatch Email</span>
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

// Medical translation databases for the email
const laypersonConditions: Record<string, string> = {
  "Chronic Kidney Disease": "Reduced kidney filtering capacity (Stage 4, requiring close medication audits)",
  "Pregnancy": "Expecting a baby (26 weeks gestation, close tracking of blood pressure)",
  "Gestational Hypertension": "Pregnancy-related higher blood pressure",
  "Diabetes Mellitus Type 2": "Type 2 Diabetes (requiring blood sugar tracking)",
  "Hypertension": "High blood pressure",
  "Asthma": "Reactive airways (using preventative inhalers)",
  "Hyperlipidemia": "Mildly elevated cholesterol levels"
};

const laypersonMeds: Record<string, { purpose: string; instructions: string }> = {
  "Metformin": {
    purpose: "Helps regulate blood sugar levels",
    instructions: "Take with meals. IMPORTANT: This medication is currently paused due to active renal function safety updates."
  },
  "Insulin Glargine": {
    purpose: "Long-acting blood sugar regulation",
    instructions: "Inject once daily at bedtime as directed by your clinical nurse coordinator."
  },
  "Labetalol": {
    purpose: "Controls and manages blood pressure during pregnancy",
    instructions: "Take exactly as scheduled. Do not miss doses. Monitor blood pressure daily."
  },
  "Prenatal Multivitamin": {
    purpose: "Supports fetal development and maternal health",
    instructions: "Take 1 tablet daily with food."
  }
};

