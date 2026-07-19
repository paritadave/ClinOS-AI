import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { 
  Mic, 
  MicOff, 
  FileText, 
  Globe, 
  Sparkles, 
  Play, 
  Check, 
  Clipboard, 
  RotateCcw,
  Languages,
  ArrowRight,
  DollarSign,
  Send,
  FileCheck,
  ShieldAlert,
  ListChecks
} from "lucide-react";
import { Patient, SOAPNote } from "../types";

interface ScribePanelProps {
  patient: Patient;
  onRefresh: () => void;
  onLogAudit: (action: string, details: string) => void;
}

export default function ScribePanel({ patient, onRefresh, onLogAudit }: ScribePanelProps) {
  const [activeTab, setActiveTab] = useState<"scribe" | "translation">("scribe");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [notesType, setNotesType] = useState<string>("SOAP");
  const [transcriptText, setTranscriptText] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedScribe, setGeneratedScribe] = useState<{
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    referralLetter?: string;
    summary: string;
  } | null>(null);

  // Canadian Practice Suite States
  const [outputSubTab, setOutputSubTab] = useState<"emr" | "billing" | "referral" | "safety">("emr");
  const [billingSuggestions, setBillingSuggestions] = useState<any[]>([]);
  const [isFetchingBilling, setIsFetchingBilling] = useState<boolean>(false);
  const [isClaimSubmitting, setIsClaimSubmitting] = useState<boolean>(false);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);

  const [referralSpecialty, setReferralSpecialty] = useState<string>("Nephrology");
  const [referralFacility, setReferralFacility] = useState<string>("Mount Sinai Hospital, Toronto");
  const [referralLetterText, setReferralLetterText] = useState<string | null>(null);
  const [isGeneratingReferral, setIsGeneratingReferral] = useState<boolean>(false);

  const [guidelineAudits, setGuidelineAudits] = useState<any[]>([]);
  const [isFetchingAudits, setIsFetchingAudits] = useState<boolean>(false);

  // Translation States
  const [sourceLang, setSourceLang] = useState<string>("English");
  const [targetLang, setTargetLang] = useState<string>("French");
  const [spokenText, setSpokenText] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translatedResult, setTranslatedResult] = useState<string>("");
  const [translationLog, setTranslationLog] = useState<Array<{ sender: "doctor" | "patient", original: string, translated: string }>>([]);

  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);

  // Real MediaRecorder Audio refs and states
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState<boolean>(false);
  const [preventiveAlerts, setPreventiveAlerts] = useState<any[]>([]);
  const [transcriptionSource, setTranscriptionSource] = useState<string>("");

  // Preset transcript options to let clinicians quickly generate amazing structured SOAP notes
  const transcriptPresets = [
    {
      label: "Respiratory Cough Consultation",
      text: "Doctor: Welcome back Sarah. Let's look at this cough you've had.\nPatient: Thank you Doctor. Yeah, it's this dry hacky cough. I've had it for about a week now. It's getting a bit worse, especially when I lay down at night, but no fever.\nDoctor: Any chest pain or shortness of breath?\nPatient: No chest pain, but I feel a bit winded or short of breath when I walk up the stairs. My pregnancy is at 26 weeks now so I'm getting heavier too.\nDoctor: Let's do an exam. Heart rate is regular. Chest auscultation reveals mild expiratory wheeze bilaterally, but good air entry and no crackles. We should monitor this cough. Since you are pregnant, we'll avoid heavy medications. Let's recommend warm fluids, and we can prescribe a PRN Salbutamol inhaler if the wheezing makes you uncomfortable."
    },
    {
      label: "Diabetic Renal Review",
      text: "Doctor: Hello Robert, we received your latest blood work from LifeLabs.\nPatient: Yes, how does it look?\nDoctor: I have some concerns. Your eGFR has dropped to 28, which means your kidney function is in Stage 4 territory. Your HbA1c is also up at 7.8%.\nPatient: Oh wow, is that because of my Metformin?\nDoctor: Metformin is actually cleared by the kidneys, and at an eGFR of 28, Metformin becomes contraindicated because it can build up and cause dangerous lactic acidosis. We must discontinue Metformin today. I am going to place an urgent referral to Nephrology at St. Paul's Hospital to help optimize your renal care. Let's schedule a follow-up in two weeks."
    }
  ];

  // Sync transcription preset
  const handleSelectPreset = (text: string) => {
    setTranscriptText(text);
  };

  // Toggle Real Media Recording
  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      if (recordingTimer.current) clearInterval(recordingTimer.current);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      onLogAudit("RECORD_AMBIENT_SCRIBE", `Stopped ambient medical dictation. Processing ${recordingSeconds} seconds of captured speech.`);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
        audioChunksRef.current = [];

        // Determine supported mimeType or fallback to standard audio/webm or audio/ogg
        let options = { mimeType: "audio/webm" };
        if (!MediaRecorder.isTypeSupported("audio/webm")) {
          options = { mimeType: "audio/ogg" };
          if (!MediaRecorder.isTypeSupported("audio/ogg")) {
            options = { mimeType: "" }; // default browser type
          }
        }

        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: options.mimeType || "audio/webm" });
          
          // Convert to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result?.toString().split(",")[1];
            if (base64Audio) {
              setIsTranscribingAudio(true);
              setPreventiveAlerts([]); // clear out old alerts
              try {
                const res = await fetch("/api/scribe/process-audio", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    audio: base64Audio,
                    mimeType: options.mimeType || "audio/webm",
                    patientId: patient.id
                  })
                });
                const data = await res.json();
                if (data.transcript) {
                  setTranscriptText(data.transcript);
                }
                if (data.preventiveCareAlerts) {
                  setPreventiveAlerts(data.preventiveCareAlerts);
                }
                if (data.source) {
                  setTranscriptionSource(data.source);
                }
                onLogAudit("PROCESS_AUDIO_BLOBS", `Completed secure audio transcription and clinical guidelines audit for ${patient.name}.`);
              } catch (err) {
                console.error("Transcription pipeline error:", err);
              } finally {
                setIsTranscribingAudio(false);
              }
            }
          };
        };

        recorder.start(500); // chunk size 500ms
        setIsRecording(true);
        setRecordingSeconds(0);
        onLogAudit("RECORD_AMBIENT_SCRIBE", `Initiated secure ambient physician-patient session with microphone permissions.`);

        recordingTimer.current = setInterval(() => {
          setRecordingSeconds(prev => prev + 1);
        }, 1000);
      } catch (err) {
        console.error("Microphone access failed:", err);
        alert("Failed to access microphone. Please ensure browser microphone permissions are allowed.");
      }
    }
  };

  useEffect(() => {
    return () => {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
    };
  }, []);

  // Sync referral defaults based on Canadian patient province & name
  useEffect(() => {
    if (patient.name.includes("Sarah")) {
      setReferralSpecialty("Respirology");
      setReferralFacility("Mount Sinai Hospital, Toronto");
    } else {
      setReferralSpecialty("Nephrology");
      setReferralFacility("St. Paul's Hospital, Vancouver");
    }
    // Clear out output if patient is switched to avoid stale data
    setGeneratedScribe(null);
    setBillingSuggestions([]);
    setGuidelineAudits([]);
    setPreventiveAlerts([]);
    setReferralLetterText(null);
    setClaimSuccessMessage(null);
    setOutputSubTab("emr");
  }, [patient]);

  // Proactively fetch Canadian billing suggestions & Medical Council guidelines
  const fetchBillingAndSafety = async (notesText: string) => {
    setIsFetchingBilling(true);
    setIsFetchingAudits(true);
    setClaimSuccessMessage(null);
    setReferralLetterText(null);

    try {
      // 1. Fetch Suggested Provincial Billing Codes (OHIP/MSP)
      const billRes = await fetch("/api/scribe/suggest-billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notesText, patientId: patient.id })
      });
      const billData = await billRes.json();
      if (billData.suggestions) {
        setBillingSuggestions(billData.suggestions);
      }

      // 2. Fetch Medical Safety & Guideline Audits
      const auditRes = await fetch(`/api/scribe/guidelines-audit/${patient.id}`);
      const auditData = await auditRes.json();
      if (auditData.audits) {
        setGuidelineAudits(auditData.audits);
      }
    } catch (err) {
      console.error("Error loading provincial checks:", err);
    } finally {
      setIsFetchingBilling(false);
      setIsFetchingAudits(false);
    }
  };

  // Submit Electronic Claim to Provincial Telehealth / Office Portal
  const handleSubmitProvincialClaim = async (claimCode: string, feeAmount: number) => {
    setIsClaimSubmitting(true);
    setClaimSuccessMessage(null);
    try {
      // Simulate cryptographic provincial portal transmission (e.g. MCEDT in Ontario or Teleplan in BC)
      await new Promise(resolve => setTimeout(resolve, 1200));
      const claimNo = `CLM-${Math.floor(100000 + Math.random() * 900000)}`;
      setClaimSuccessMessage(`Claim for ${claimCode} ($${feeAmount.toFixed(2)}) transmitted successfully! Transaction Reference: ${claimNo}`);
      onLogAudit("SUBMIT_PROVINCIAL_CLAIM", `Transmitted secure electronic medical claim for code ${claimCode} ($${feeAmount.toFixed(2)}) to provincial health gateway. Transaction ID: ${claimNo}`);
    } catch (err) {
      console.error("Provincial claim failure:", err);
    } finally {
      setIsClaimSubmitting(false);
    }
  };

  // Draft college-compliant Specialty referral letter pre-filled with PHN and Referring MD
  const handleGenerateReferralLetter = async () => {
    setIsGeneratingReferral(true);
    setReferralLetterText(null);
    try {
      const fullSOAP = generatedScribe 
        ? `${generatedScribe.subjective}\n${generatedScribe.objective}\n${generatedScribe.assessment}\n${generatedScribe.plan}`
        : transcriptText;

      const res = await fetch("/api/scribe/generate-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          specialty: referralSpecialty,
          facility: referralFacility,
          clinicNotes: fullSOAP
        })
      });
      const data = await res.json();
      if (data.letter) {
        setReferralLetterText(data.letter);
        onLogAudit("GENERATE_REFERRAL_LETTER", `Drafted College-compliant specialist referral to ${referralSpecialty} at ${referralFacility}.`);
      }
    } catch (err) {
      console.error("eReferral drafting failed:", err);
    } finally {
      setIsGeneratingReferral(false);
    }
  };

  const handleGenerateSoapNote = async () => {
    if (!transcriptText) return;
    setIsGenerating(true);
    setGeneratedScribe(null);

    try {
      const res = await fetch("/api/scribe/generate-soap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcriptText,
          patientId: patient.id,
          notesType
        })
      });
      const data = await res.json();
      if (data.soap) {
        setGeneratedScribe(data.soap);
        onLogAudit("GENERATE_SOAP_NOTE", `Successfully synthesized EMR documentation via Scribe API.`);
        
        // Auto trigger Canadian Practice Suite pre-loads
        const fullNotes = `${data.soap.subjective}\n${data.soap.objective}\n${data.soap.assessment}\n${data.soap.plan}`;
        fetchBillingAndSafety(fullNotes);
        setOutputSubTab("emr");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Translation Agent Trigger
  const handleTranslateText = async (speaker: "doctor" | "patient") => {
    if (!spokenText) return;
    setIsTranslating(true);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: spokenText,
          sourceLanguage: speaker === "doctor" ? sourceLang : targetLang,
          targetLanguage: speaker === "doctor" ? targetLang : sourceLang,
          speaker
        })
      });
      const data = await res.json();
      if (data.translatedText) {
        setTranslatedResult(data.translatedText);
        setTranslationLog(prev => [
          ...prev,
          { sender: speaker, original: spokenText, translated: data.translatedText }
        ]);
        onLogAudit("TRANSLATE_COMMUNICATION", `Translated medical conversation for patient interaction.`);
        setSpokenText("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full animate-fade-in" id="scribe-panel">
      {/* Tab Selectors */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("scribe")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "scribe" 
                ? "bg-[#0F172A] text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-blue-400" />
            Ambient Medical Scribe
          </button>
          <button
            onClick={() => setActiveTab("translation")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "translation" 
                ? "bg-[#0F172A] text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Languages className="w-3.5 h-3.5 text-teal-400" />
            Multilingual Translation
          </button>
        </div>

        {activeTab === "scribe" && (
          <select
            value={notesType}
            onChange={(e) => setNotesType(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-600 focus:outline-hidden"
          >
            <option value="SOAP">SOAP Progress Notes</option>
            <option value="Referral Letter">Consultation Referral Letter</option>
            <option value="Discharge Summary">Discharge EMR Summary</option>
          </select>
        )}
      </div>

      {activeTab === "scribe" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
          {/* Scribe Inputs (Microphone / Transcript Text) */}
          <div className="lg:col-span-5 flex flex-col justify-between min-h-[450px] overflow-y-auto pr-1 custom-scrollbar space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Secure Ambient Intake
                </span>
                {isRecording && (
                  <span className="text-xs text-rose-500 animate-pulse font-mono font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-rose-500 rounded-full" />
                    RECORDING: {recordingSeconds}s
                  </span>
                )}
              </div>

              {/* Wave Form Animation Simulation */}
              <div 
                onClick={handleToggleRecording}
                className={`border rounded-2xl p-5 cursor-pointer transition-all flex flex-col items-center justify-center gap-3 relative overflow-hidden ${
                  isRecording 
                    ? "bg-rose-50/20 border-rose-200 shadow-rose-50" 
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200/80"
                }`}
              >
                {isRecording ? (
                  <>
                    <div className="flex items-center gap-1 justify-center h-10 w-full">
                      {[...Array(12)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [12, 36, 12] }}
                          transition={{ repeat: Infinity, duration: 0.8 + (i % 3) * 0.2, ease: "easeInOut" }}
                          className="w-1 bg-rose-500 rounded-full"
                        />
                      ))}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-rose-800">Listening to Consultation...</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Click anywhere to stop and generate transcription</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center">
                      <Mic className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-slate-700">Start Scribing Consultation</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Auto-generates PHIPA encrypted audit records</p>
                    </div>
                  </>
                )}
              </div>

              {/* Transcription Loading Indicator */}
              {isTranscribingAudio && (
                <div className="flex flex-col items-center justify-center p-6 border border-indigo-100 rounded-xl bg-indigo-50/20 text-indigo-500 animate-pulse">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2"
                  />
                  <p className="text-xs font-bold text-slate-700">Uploading ambient audio streams...</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 text-center">Transcribing conversation & executing preventive care audit guidelines.</p>
                </div>
              )}

              {/* Real-time Preventive Alerts from Ambient Audio */}
              {preventiveAlerts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-2 shadow-xs"
                >
                  <div className="flex items-center gap-1.5 text-amber-800 font-extrabold text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-600 animate-bounce" />
                    <span>Preventive Care Alerts Identified ({preventiveAlerts.length})</span>
                  </div>
                  <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                    {preventiveAlerts.map((alert, i) => (
                      <div key={i} className="bg-white/95 rounded-lg p-2.5 border border-amber-100 text-[11px] leading-relaxed shadow-2xs">
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span>{alert.title}</span>
                          <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase shrink-0 ml-1">{alert.status}</span>
                        </div>
                        <p className="text-slate-600 mt-1 font-medium">{alert.details}</p>
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-950 font-semibold bg-amber-50/70 p-1.5 rounded border border-amber-100/50">
                          <span className="font-black text-[9px] bg-amber-200/80 text-amber-900 px-1 rounded uppercase shrink-0">Action Required:</span>
                          <span>{alert.actionRequired}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Scribe Transcriptions */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Or Paste/Review Consultation Transcript</span>
                  {transcriptionSource && (
                    <span className="text-[9px] font-mono text-indigo-500 bg-indigo-50 px-1.5 py-0.2 rounded font-bold lowercase">
                      {transcriptionSource}
                    </span>
                  )}
                </label>
                <textarea
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  placeholder="Paste or record conversational transcript to synthesize EMR soap notes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 placeholder-slate-400 h-40 focus:outline-hidden focus:border-blue-500 font-sans resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Sandbox triggers to see instant SOAP Note creation */}
            <div className="space-y-2">
              <div className="flex gap-2">
                {transcriptPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectPreset(preset.text)}
                    className="flex-1 text-[10px] font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 truncate text-left cursor-pointer"
                  >
                    Preset: {preset.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerateSoapNote}
                disabled={isGenerating || !transcriptText}
                className="w-full px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    Generating Clinical Documentation...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Structured {notesType}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Scribe Outputs (SOAP Notes Visualizer) */}
          <div className="lg:col-span-7 border-l border-slate-100 pl-4 h-[450px] flex flex-col justify-between">
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mb-3"
                  />
                  <p className="text-xs font-semibold text-slate-700">Synthesizing {notesType} Notes...</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs text-center">
                    Gemini Clinical Specialist is separating speakers, recognizing medical terminology, and structuring into SOAP/Referral outputs.
                  </p>
                </div>
              ) : generatedScribe ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Master Sub Tab Bar */}
                  <div className="flex border-b border-slate-100 pb-1.5 overflow-x-auto gap-1">
                    <button
                      onClick={() => setOutputSubTab("emr")}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer whitespace-nowrap transition-all ${
                        outputSubTab === "emr"
                          ? "bg-[#0F172A] text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      📄 Clinical EMR Record
                    </button>
                    <button
                      onClick={() => setOutputSubTab("billing")}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        outputSubTab === "billing"
                          ? "bg-amber-500 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <DollarSign className="w-3 h-3" />
                      Provincial Billing
                    </button>
                    <button
                      onClick={() => setOutputSubTab("referral")}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        outputSubTab === "referral"
                          ? "bg-teal-600 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <FileCheck className="w-3 h-3" />
                      College eReferral
                    </button>
                    <button
                      onClick={() => setOutputSubTab("safety")}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        outputSubTab === "safety"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <ListChecks className="w-3 h-3" />
                      MCC Quality Audit
                    </button>
                  </div>

                  {/* SUB TAB CONTENT 1: EMR NOTE */}
                  {outputSubTab === "emr" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[10px] uppercase font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-100">
                          AI Scribe Record Generated Successfully
                        </span>
                        <button 
                          onClick={() => {
                            const noteText = notesType === "Referral Letter" 
                              ? generatedScribe.referralLetter || ""
                              : `${generatedScribe.subjective}\n\n${generatedScribe.objective}\n\n${generatedScribe.assessment}\n\n${generatedScribe.plan}`;
                            navigator.clipboard.writeText(noteText);
                            onLogAudit("COPY_SOAP_NOTE", "Copied generated clinical notes to system clipboard.");
                          }}
                          className="text-xs text-blue-600 font-semibold hover:text-blue-800 cursor-pointer flex items-center gap-1"
                        >
                          <Clipboard className="w-3 h-3" /> Copy EMR Text
                        </button>
                      </div>

                      {/* Concise Overview Summary */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Encounter Summary
                        </h4>
                        <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                          {generatedScribe.summary}
                        </p>
                      </div>

                      {/* Referral Letter view if selected */}
                      {notesType === "Referral Letter" && generatedScribe.referralLetter ? (
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-slate-800">Draft Consultation Referral Letter</h4>
                          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-4 text-xs font-mono whitespace-pre-line leading-relaxed shadow-lg">
                            {generatedScribe.referralLetter}
                          </div>
                        </div>
                      ) : (
                        /* SOAP Fields in a stunning deep-slate container matching the design aesthetic */
                        <div className="space-y-3.5 bg-[#0F172A] p-4.5 rounded-2xl border border-white/10 shadow-xl text-slate-100">
                          <h4 className="text-xs uppercase font-bold text-blue-400 mb-2 tracking-widest flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                            AI Ambient Scribe Clinical SOAP Record
                          </h4>

                          <div className="grid grid-cols-2 gap-3.5">
                            <div className="border border-white/10 rounded-xl p-3 bg-white/5">
                              <h5 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                                (S) Subjective Symptoms
                              </h5>
                              <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line max-h-32 overflow-y-auto pr-1">
                                {generatedScribe.subjective}
                              </p>
                            </div>
                            <div className="border border-white/10 rounded-xl p-3 bg-white/5">
                              <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                                (O) Objective Exams
                              </h5>
                              <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line max-h-32 overflow-y-auto pr-1">
                                {generatedScribe.objective}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3.5">
                            <div className="border border-white/10 rounded-xl p-3 bg-white/5">
                              <h5 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                                (A) Assessment Diagnoses
                              </h5>
                              <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line max-h-32 overflow-y-auto pr-1">
                                {generatedScribe.assessment}
                              </p>
                            </div>
                            <div className="border border-white/10 rounded-xl p-3 bg-white/5">
                              <h5 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">
                                (P) Plan & Treatment
                              </h5>
                              <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line max-h-32 overflow-y-auto pr-1">
                                {generatedScribe.plan}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUB TAB CONTENT 2: CANADIAN PROVINCIAL BILLING */}
                  {outputSubTab === "billing" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <span className="text-[10px] uppercase font-mono bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-bold border border-amber-200">
                            PROVINCIAL BILLING SELECTOR
                          </span>
                          <span className="text-xs text-slate-500 ml-2 font-medium">
                            Jurisdiction: <strong>{patient.province}</strong>
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">Powered by ClinOS Fee Engine</span>
                      </div>

                      {isFetchingBilling ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                          <RotateCcw className="w-6 h-6 animate-spin text-amber-500 mb-2" />
                          <p className="text-xs font-semibold text-slate-700">Analyzing encounter details for billing codes...</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-3.5 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-amber-800">Provincial Health Claims Estimate</p>
                              <p className="text-xs text-slate-600 mt-0.5">Based on diagnostic indices and counseling duration.</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-extrabold text-amber-900 font-mono">
                                ${billingSuggestions.reduce((acc, code) => acc + code.fee, 0).toFixed(2)}
                              </p>
                              <span className="text-[9px] text-amber-700 font-mono font-bold">Total Estimated Claim Payout</span>
                            </div>
                          </div>

                          {claimSuccessMessage && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs font-semibold">
                              {claimSuccessMessage}
                            </div>
                          )}

                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Codes Matrix</h4>
                            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                              {billingSuggestions.map((item, idx) => (
                                <div key={idx} className="p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 flex items-center justify-between gap-3 transition-all">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 border border-slate-200">
                                        {item.code}
                                      </span>
                                      <span className="text-xs font-bold text-slate-700 truncate">{item.description}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <span className="text-[10px] bg-amber-50 text-amber-800 px-1 rounded font-mono">ICD-9: {item.icdCode}</span>
                                      <span className="text-[10px] text-slate-500 truncate">{item.icdDescription}</span>
                                    </div>
                                  </div>
                                  <div className="text-right flex items-center gap-3">
                                    <div>
                                      <p className="text-xs font-extrabold text-slate-800 font-mono">${item.fee.toFixed(2)}</p>
                                      <span className="text-[9px] text-emerald-600 font-bold uppercase">{item.status}</span>
                                    </div>
                                    <button
                                      onClick={() => handleSubmitProvincialClaim(item.code, item.fee)}
                                      disabled={isClaimSubmitting}
                                      className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-white p-1.5 rounded-lg cursor-pointer transition-all flex items-center justify-center"
                                      title="Submit Electronic Claim"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUB TAB CONTENT 3: SPECIALIST REFERRAL LETTER */}
                  {outputSubTab === "referral" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[10px] uppercase font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded font-bold border border-teal-200">
                          College-Compliant Specialist Referral
                        </span>
                        <span className="text-xs text-slate-400 font-mono">PHN Match: {patient.phn}</span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Target Specialty</label>
                            <select
                              value={referralSpecialty}
                              onChange={(e) => setReferralSpecialty(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700"
                            >
                              <option value="Nephrology">Nephrology (Renal Care)</option>
                              <option value="Cardiology">Cardiology</option>
                              <option value="Respirology">Respirology</option>
                              <option value="Obstetrics">Obstetrics / Gynecology</option>
                              <option value="General Surgery">General Surgery</option>
                              <option value="Pediatrics">Pediatrics</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Destination Facility</label>
                            <input
                              type="text"
                              value={referralFacility}
                              onChange={(e) => setReferralFacility(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <button
                          onClick={handleGenerateReferralLetter}
                          disabled={isGeneratingReferral}
                          className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold text-xs py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {isGeneratingReferral ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                              Drafting regulatory referral...
                            </>
                          ) : (
                            <>
                              <FileCheck className="w-3.5 h-3.5" />
                              Compile Formal eReferral Letter
                            </>
                          )}
                        </button>
                      </div>

                      {referralLetterText && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-mono">Letter drafted successfully</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(referralLetterText);
                                onLogAudit("COPY_REFERRAL_LETTER", `Copied generated referral letter to system clipboard.`);
                              }}
                              className="text-xs text-teal-600 font-bold hover:text-teal-800 cursor-pointer flex items-center gap-1"
                            >
                              <Clipboard className="w-3 h-3" /> Copy Full Referral
                            </button>
                          </div>
                          <div className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl p-4 text-[11px] font-mono whitespace-pre-line leading-relaxed max-h-80 overflow-y-auto">
                            {referralLetterText}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUB TAB CONTENT 4: MCC GUIDELINE QUALITY AUDIT */}
                  {outputSubTab === "safety" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[10px] uppercase font-mono bg-rose-50 text-rose-800 px-2 py-0.5 rounded font-bold border border-rose-200">
                          Medical Council of Canada (MCC) Guidelines Advisor
                        </span>
                        <span className="text-xs text-slate-400 font-mono">Patient Audit Profile</span>
                      </div>

                      {isFetchingAudits ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                          <RotateCcw className="w-6 h-6 animate-spin text-rose-500 mb-2" />
                          <p className="text-xs font-semibold text-slate-700">Auditing active EMR profile against national safety grids...</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {guidelineAudits.map((item, idx) => {
                            const isAlert = item.status.includes("Required") || item.status.includes("Alert");
                            return (
                              <div key={idx} className={`border rounded-xl p-3.5 space-y-1.5 transition-all ${
                                isAlert 
                                  ? "bg-rose-50/50 border-rose-200" 
                                  : "bg-slate-50 border-slate-200"
                              }`}>
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${
                                    isAlert 
                                      ? "bg-rose-100 text-rose-800 border-rose-200" 
                                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  }`}>
                                    {item.status}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">{item.details}</p>
                                <div className="border-t border-dashed border-slate-200 pt-2 flex items-start gap-1.5">
                                  <ShieldAlert className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isAlert ? "text-rose-600" : "text-slate-400"}`} />
                                  <p className="text-[11px] text-slate-500">
                                    <strong>Practice Directive:</strong> {item.actionRequired}
                                  </p>
                                </div>
                                <div className="text-[9px] text-slate-400 italic text-right">
                                  Agency: {item.agency}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 h-full">
                  <FileText className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
                  <h4 className="text-sm font-medium text-slate-700">No Document Generated</h4>
                  <p className="text-xs text-slate-400 text-center max-w-xs mt-1">
                    Ambient transcripts will compile here automatically into high-fidelity SOAP progress charts. Choose a preset or record to begin.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* MULTILINGUAL TRANSLATION TAB */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden h-[450px]">
          {/* Left Column: Direct speech input translating */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-blue-500" /> Language Configuration
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Clinician Language
                  </label>
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option>English</option>
                    <option>French</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Patient Language
                  </label>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                  >
                    <option>French</option>
                    <option>Punjabi</option>
                    <option>Hindi</option>
                    <option>Gujarati</option>
                    <option>Urdu</option>
                    <option>Mandarin</option>
                    <option>Arabic</option>
                    <option>Spanish</option>
                  </select>
                </div>
              </div>

              {/* Spoken sentence box */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Input Spoken Statement
                </label>
                <textarea
                  value={spokenText}
                  onChange={(e) => setSpokenText(e.target.value)}
                  placeholder={`Type clinician's explanation in ${sourceLang} or patient's response in ${targetLang} to translate...`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 placeholder-slate-400 h-28 focus:outline-hidden focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>

              {/* Clinician Quick Presets to trigger nice translations */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Suggested Medical Dialogue Templates
                </span>
                <div className="space-y-1">
                  <button
                    onClick={() => setSpokenText("Please take two tablets of this medication every morning with food.")}
                    className="w-full text-left bg-slate-50 hover:bg-slate-100 px-3 py-2 text-[11px] text-slate-600 rounded-xl border border-slate-200 truncate cursor-pointer font-medium"
                  >
                    "Please take two tablets of this medication..."
                  </button>
                  <button
                    onClick={() => setSpokenText("Where does it hurt, and does the pain travel to your leg?")}
                    className="w-full text-left bg-slate-50 hover:bg-slate-100 px-3 py-2 text-[11px] text-slate-600 rounded-xl border border-slate-200 truncate cursor-pointer font-medium"
                  >
                    "Where does it hurt, and does the pain travel..."
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <button
                onClick={() => handleTranslateText("doctor")}
                disabled={isTranslating || !spokenText}
                className="px-3 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
              >
                Translate to {targetLang}
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleTranslateText("patient")}
                disabled={isTranslating || !spokenText}
                className="px-3 py-2.5 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 disabled:bg-slate-200 rounded-xl transition-all border border-blue-200 cursor-pointer flex items-center justify-center gap-1"
              >
                Translate to {sourceLang}
                <ArrowRight className="w-3 h-3 rotate-180" />
              </button>
            </div>
          </div>

          {/* Right Column: Live Interactive Translation Log */}
          <div className="lg:col-span-7 border-l border-slate-100 pl-4 h-full flex flex-col justify-between">
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              <div className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 pb-1.5 mb-2 flex items-center justify-between">
                <span>Active Dialogue Feed ({translationLog.length})</span>
                {translationLog.length > 0 && (
                  <button 
                    onClick={() => setTranslationLog([])} 
                    className="text-slate-400 hover:text-slate-600"
                  >
                    Clear Feed
                  </button>
                )}
              </div>

              {translationLog.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 h-full">
                  <Languages className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
                  <h4 className="text-sm font-medium text-slate-700">No Translation History</h4>
                  <p className="text-xs text-slate-400 text-center max-w-xs mt-1">
                    Interactive clinical conversations with non-English speaking patients will stream here in real-time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {translationLog.map((log, idx) => {
                    const isDoc = log.sender === "doctor";
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: isDoc ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3.5 rounded-2xl border max-w-[85%] ${
                          isDoc 
                            ? "bg-blue-50/40 border-blue-100 mr-auto" 
                            : "bg-teal-50/20 border-teal-100 ml-auto"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[9px] uppercase font-bold font-mono px-1.5 rounded ${
                            isDoc ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-800"
                          }`}>
                            {isDoc ? "Clinician Statement" : "Patient Response"}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                          {log.original}
                        </p>
                        <div className="border-t border-dashed border-slate-200 my-1.5" />
                        <p className="text-xs text-slate-600 leading-relaxed italic font-medium">
                          "{log.translated}"
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
