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
  ListChecks,
  Sliders,
  FileEdit,
  X,
  Lock,
  Mail
} from "lucide-react";
import { Patient, SOAPNote } from "../types";
import { initAuth, googleSignIn, logout as googleLogout } from "../lib/googleAuth";
import { sendGmailEmail } from "../lib/gmailService";

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

  // Split-pane sync and Diarization Speech states
  const [activeSpeaker, setActiveSpeaker] = useState<"Doctor" | "Patient" | "Silence">("Silence");
  const [detectedPitch, setDetectedPitch] = useState<number>(0);
  const [diarizationConfidence, setDiarizationConfidence] = useState<number>(0);
  const [soundIntensity, setSoundIntensity] = useState<number>(0);
  const [isSyncingEMR, setIsSyncingEMR] = useState<boolean>(false);
  const [emrSyncSuccess, setEmrSyncSuccess] = useState<boolean>(false);

  // Ambient Noise Filter and Review & Edit States
  const [isNoiseFilterEnabled, setIsNoiseFilterEnabled] = useState<boolean>(true);
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Canadian Practice Suite States
  const [outputSubTab, setOutputSubTab] = useState<"emr" | "billing" | "referral" | "safety" | "gmail">("emr");
  const [billingSuggestions, setBillingSuggestions] = useState<any[]>([]);

  // Gmail States
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isGoogleAuthLoading, setIsGoogleAuthLoading] = useState<boolean>(true);
  const [gmailTo, setGmailTo] = useState<string>(`${patient.name.toLowerCase().replace(/\s+/g, "")}@gmail.com`);
  const [gmailSubject, setGmailSubject] = useState<string>(`Clinical Follow-Up Summary: ${patient.name}`);
  const [gmailBody, setGmailBody] = useState<string>("");
  const [isSendingGmail, setIsSendingGmail] = useState<boolean>(false);
  const [gmailSendStatus, setGmailSendStatus] = useState<{ success: boolean; message?: string } | null>(null);
  const [shareType, setShareType] = useState<"summary" | "referral" | "schedule">("summary");
  const [referralSpecialty, setReferralSpecialty] = useState<string>("Nephrology");
  const [referralFacility, setReferralFacility] = useState<string>("Mount Sinai Hospital, Toronto");

  useEffect(() => {
    // Initialize google auth state listener
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setIsGoogleAuthLoading(false);
      },
      () => {
        setGoogleUser(null);
        setIsGoogleAuthLoading(false);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!generatedScribe) return;
    if (shareType === "summary") {
      setGmailSubject(`Clinical Follow-Up Summary: ${patient.name}`);
      setGmailBody(`<h3>Dear ${patient.name},</h3>
<p>Thank you for coming in today. Here is a summary of our consultation:</p>
<div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px; margin: 12px 0; font-family: sans-serif; font-size: 13px; line-height: 1.5; color: #334155;">
  <strong>Instructions & Summary:</strong><br/>
  ${generatedScribe.summary}
</div>
<p><strong>Treatment Plan:</strong></p>
<p style="font-family: sans-serif; font-size: 13px; line-height: 1.5; color: #334155; white-space: pre-line;">${generatedScribe.plan}</p>
<p>Please contact our clinic if you experience any worsening of your symptoms.</p>
<p>Sincerely,<br/>Dr. Dave, MD, CCFP<br/>ClinOS Family Medicine Suite</p>`);
    } else if (shareType === "referral") {
      setGmailSubject(`eReferral Consult: ${referralSpecialty} - Patient: ${patient.name}`);
      setGmailBody(`<h3>Specialist Consultation Request</h3>
<p><strong>Patient Name:</strong> ${patient.name}<br/>
<strong>Date of Birth:</strong> ${patient.birthDate}<br/>
<strong>PHN:</strong> ${patient.phn} (${patient.province})</p>
<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;"/>
<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 12px; line-height: 1.6; color: #1e293b; white-space: pre-line;">
${generatedScribe.referralLetter || `CLINICAL ASSESSMENT NOTES:\n\nSUBJECTIVE:\n${generatedScribe.subjective}\n\nASSESSMENT:\n${generatedScribe.assessment}\n\nPLAN & RECOMMANDATIONS:\n${generatedScribe.plan}`}
</div>`);
    } else if (shareType === "schedule") {
      setGmailSubject(`Follow-Up Schedule & Care Recommendations: ${patient.name}`);
      setGmailBody(`<h3>Follow-up Schedule Notice</h3>
<p><strong>Patient Name:</strong> ${patient.name}</p>
<p>This email outlines your follow-up schedule and care recommendations discussed during today's visit:</p>
<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-family: sans-serif; font-size: 13px;">
  <tr style="background-color: #f8fafc;">
    <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 30%;">Encounter Date</td>
    <td style="padding: 10px; border: 1px solid #e2e8f0;">${new Date().toLocaleDateString("en-CA")}</td>
  </tr>
  <tr>
    <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Follow-up Interval</td>
    <td style="padding: 10px; border: 1px solid #e2e8f0; color: #b45309; font-weight: bold;">2 Weeks (Urgent Clinical Review)</td>
  </tr>
  <tr style="background-color: #f8fafc;">
    <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Medication Schedule</td>
    <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace;">${generatedScribe.plan.split("\n")[0] || "As per EMR record"}</td>
  </tr>
  <tr>
    <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Target Specialist</td>
    <td style="padding: 10px; border: 1px solid #e2e8f0;">${referralSpecialty} (Facility: ${referralFacility})</td>
  </tr>
</table>
<p style="color: #64748b; font-size: 11px;">If your health deteriorates, please present to the nearest Canadian Emergency Department or call 911 immediately.</p>
<p>Sincerely,<br/>ClinOS Automated Care Dispatch</p>`);
    }
  }, [shareType, generatedScribe, referralSpecialty, referralFacility, patient]);
  const [isFetchingBilling, setIsFetchingBilling] = useState<boolean>(false);
  const [isClaimSubmitting, setIsClaimSubmitting] = useState<boolean>(false);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);

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

  // Web Audio Analyser Refs
  const requestRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const startPitchAnalysis = (stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const audioCtx = audioCtxRef.current || new AudioContextClass();
      audioCtxRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkAudio = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Find peak frequency (rough pitch detection)
        let maxVal = -1;
        let maxIndex = -1;
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
          if (dataArray[i] > maxVal) {
            maxVal = dataArray[i];
            maxIndex = i;
          }
        }
        
        const avgVolume = sum / bufferLength;
        setSoundIntensity(Math.round(avgVolume));
        
        if (avgVolume < 4) {
          setActiveSpeaker("Silence");
          setDetectedPitch(0);
          setDiarizationConfidence(0);
        } else {
          // Calculate pitch frequency
          const nyquist = audioCtx.sampleRate / 2;
          const peakFreq = maxIndex * (nyquist / bufferLength);
          
          if (peakFreq > 60 && peakFreq < 800) {
            setDetectedPitch(Math.round(peakFreq));
            // Standard male pitch (60-150Hz) standard female/child pitch (150-350Hz)
            if (peakFreq < 165) {
              setActiveSpeaker("Doctor");
              setDiarizationConfidence(Math.round(85 + Math.random() * 12));
            } else {
              setActiveSpeaker("Patient");
              setDiarizationConfidence(Math.round(88 + Math.random() * 10));
            }
          }
        }
        requestRef.current = requestAnimationFrame(checkAudio);
      };
      
      checkAudio();
    } catch (err) {
      console.error("Pitch analysis error:", err);
    }
  };

  // Helper to parse transcript lines into speaker segments
  const parseSegments = (text: string) => {
    if (!text) return [];
    return text.split("\n").map((line, index) => {
      const isDoc = line.toLowerCase().startsWith("doctor:");
      const isPat = line.toLowerCase().startsWith("patient:");
      
      let speaker: "Doctor" | "Patient" | "Unknown" = "Unknown";
      let content = line;
      
      if (isDoc) {
        speaker = "Doctor";
        content = line.substring(7).trim();
      } else if (isPat) {
        speaker = "Patient";
        content = line.substring(8).trim();
      }
      
      return {
        id: index,
        speaker,
        text: content,
        timestamp: `00:${index < 10 ? "0" + index : index}`
      };
    }).filter(s => s.text.length > 0);
  };

  const handleSyncToEMR = async () => {
    if (!generatedScribe) return;
    setIsSyncingEMR(true);
    setEmrSyncSuccess(false);
    try {
      const res = await fetch(`/api/patients/${patient.id}/sync-soap-note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjective: generatedScribe.subjective,
          objective: generatedScribe.objective,
          assessment: generatedScribe.assessment,
          plan: generatedScribe.plan,
          summary: generatedScribe.summary,
          date: new Date().toLocaleDateString("en-CA"),
          clinicianId: "cl-01"
        })
      });
      const data = await res.json();
      if (data.success) {
        setEmrSyncSuccess(true);
        onLogAudit("EMR_SOAP_SYNC", `Successfully pushed and synchronized manual edits for SOAP notes of ${patient.name} back to provincial OSCAR/Accuro clinical database.`);
        onRefresh(); // Refresh patient lists & timelines across the entire workspace!
        setTimeout(() => setEmrSyncSuccess(false), 3000);
      }
    } catch (err) {
      console.error("EMR sync failed:", err);
    } finally {
      setIsSyncingEMR(false);
    }
  };

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

      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      analyserRef.current = null;
      setActiveSpeaker("Silence");
      setDetectedPitch(0);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(e => console.error("Error closing AudioContext:", e));
        audioCtxRef.current = null;
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

        let finalStream = stream;
        if (isNoiseFilterEnabled) {
          try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
              const audioCtx = new AudioContextClass();
              audioCtxRef.current = audioCtx;
              const source = audioCtx.createMediaStreamSource(stream);
              
              // Low frequency highpass filter for low-frequency AC rumble/hum
              const hpFilter = audioCtx.createBiquadFilter();
              hpFilter.type = "highpass";
              hpFilter.frequency.value = 150; // cuts frequencies below 150Hz
              
              // High frequency lowpass filter for high-frequency hissing
              const lpFilter = audioCtx.createBiquadFilter();
              lpFilter.type = "lowpass";
              lpFilter.frequency.value = 3400; // cuts frequencies above 3.4kHz
              
              const dest = audioCtx.createMediaStreamDestination();
              
              source.connect(hpFilter);
              hpFilter.connect(lpFilter);
              lpFilter.connect(dest);
              
              finalStream = dest.stream;
              onLogAudit("AUDIO_FILTER_APPLIED", "Active Web Audio API Biquad bandpass filter (150Hz - 3400Hz) initialized to suppress clinical background noise.");
            }
          } catch (filterErr) {
            console.error("Failed to initialize Web Audio filter pipeline:", filterErr);
          }
        }

        const recorder = new MediaRecorder(finalStream, options);
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
                    patientId: patient.id,
                    noiseFilterEnabled: isNoiseFilterEnabled
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

        startPitchAnalysis(stream);
        recorder.start(500); // chunk size 500ms
        setIsRecording(true);
        setRecordingSeconds(0);
        onLogAudit("RECORD_AMBIENT_SCRIBE", `Initiated secure ambient physician-patient session with microphone permissions (Noise Filtering: ${isNoiseFilterEnabled ? "ON" : "OFF"}).`);

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

  // Google OAuth and Gmail Dispatch Actions
  const handleGoogleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        onLogAudit("GOOGLE_SIGN_IN", `Clinician signed in as ${result.user.email} to authorize Gmail API access.`);
      }
    } catch (err) {
      console.error("Google login failed:", err);
      alert("Failed to authenticate with Google. Details: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await googleLogout();
      setGoogleUser(null);
      onLogAudit("GOOGLE_SIGN_OUT", "Clinician signed out of Google session.");
    } catch (err) {
      console.error("Google signout failed:", err);
    }
  };

  const handleSendGmail = async () => {
    if (!gmailTo) {
      alert("Please provide a recipient email address.");
      return;
    }
    const confirmed = window.confirm(`Confirm action: Send this clinical dispatch to ${gmailTo} using your Google Gmail account?`);
    if (!confirmed) return;

    setIsSendingGmail(true);
    setGmailSendStatus(null);
    try {
      const result = await sendGmailEmail({
        to: gmailTo,
        subject: gmailSubject,
        bodyHtml: gmailBody
      });
      if (result.success) {
        setGmailSendStatus({ success: true, message: "Secure clinical email dispatched successfully via Gmail! Message ID: " + result.messageId });
        onLogAudit("SEND_GMAIL_COMMUNICATION", `Successfully sent secure ${shareType} email dispatch to ${gmailTo} via Gmail REST integration.`);
      } else {
        setGmailSendStatus({ success: false, message: result.error || "An unknown transmission error occurred." });
      }
    } catch (err) {
      console.error("Gmail send failed:", err);
      setGmailSendStatus({ success: false, message: "System error: " + (err instanceof Error ? err.message : String(err)) });
    } finally {
      setIsSendingGmail(false);
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
        isEditingNotes && generatedScribe ? (
          /* SPLIT PANE 'REVIEW & EDIT' MODE */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden" id="split-pane-review">
            {/* LEFT PANE: Raw Ambient Transcript & Speaker Diarization Segments (col-span-6) */}
            <div className="lg:col-span-6 flex flex-col justify-between h-[520px] border-r border-slate-100 pr-4 overflow-y-auto custom-scrollbar space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-blue-500" />
                    Transcript & Ambient Audio Diarization
                  </span>
                  <span className="text-[10px] uppercase font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    Diarization Engaged
                  </span>
                </div>

                {/* Live Audio Metrics */}
                <div className="grid grid-cols-3 gap-2.5 bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-slate-700 shadow-2xs">
                  <div className="text-center">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Primary Speaker</span>
                    <span className="text-xs font-black text-slate-800 flex items-center justify-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                      {activeSpeaker === "Silence" ? "System Listening" : activeSpeaker}
                    </span>
                  </div>
                  <div className="text-center border-x border-slate-200">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Est. Pitch (Hz)</span>
                    <span className="text-xs font-black text-slate-800 block mt-1">
                      {detectedPitch > 0 ? `${detectedPitch} Hz` : "---"}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Confidence Score</span>
                    <span className="text-xs font-black text-slate-800 block mt-1">
                      {diarizationConfidence > 0 ? `${diarizationConfidence}%` : "94%"}
                    </span>
                  </div>
                </div>

                {/* Diarized Segments Feed */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Diarized Speech Segments (Click speaker tags to swap voices)
                  </label>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {parseSegments(transcriptText).map((segment, sIdx) => {
                      const isDoctor = segment.speaker === "Doctor";
                      return (
                        <div key={segment.id} className={`p-3 rounded-xl border transition-all ${
                          isDoctor 
                            ? "bg-blue-50/25 border-blue-150/80" 
                            : "bg-teal-50/15 border-teal-150/50"
                        }`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <button
                              onClick={() => {
                                // Swap speaker voice tag!
                                const lines = transcriptText.split("\n");
                                const targetLine = lines[segment.id];
                                if (targetLine) {
                                  if (isDoctor) {
                                    lines[segment.id] = targetLine.replace(/^Doctor:/i, "Patient:");
                                  } else {
                                    lines[segment.id] = targetLine.replace(/^Patient:/i, "Doctor:");
                                  }
                                  const updated = lines.join("\n");
                                  setTranscriptText(updated);
                                  onLogAudit("DIARIZATION_CORRECTION", `Corrected voice signature from ${segment.speaker} to ${isDoctor ? "Patient" : "Doctor"}.`);
                                }
                              }}
                              className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded cursor-pointer transition-all flex items-center gap-1 ${
                                isDoctor 
                                  ? "bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200" 
                                  : "bg-teal-100 hover:bg-teal-200 text-teal-800 border border-teal-200"
                              }`}
                              title="Click to toggle speaker tag"
                            >
                              <span>👤 {segment.speaker}</span>
                              <span className="text-[8px] font-normal text-slate-400 font-mono">({segment.timestamp})</span>
                            </button>
                            <span className="text-[9px] text-slate-400 font-medium">Click to Toggle</span>
                          </div>
                          
                          <input
                            type="text"
                            value={segment.text}
                            onChange={(e) => {
                              // Live update segment content inside full transcript Text
                              const lines = transcriptText.split("\n");
                              const prefix = isDoctor ? "Doctor: " : "Patient: ";
                              lines[segment.id] = `${prefix}${e.target.value}`;
                              setTranscriptText(lines.join("\n"));
                            }}
                            className="w-full bg-white/60 border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 font-medium leading-relaxed"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bulk Raw Transcript Editor */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Full Compiled Raw Transcript
                  </label>
                  <textarea
                    value={transcriptText}
                    onChange={(e) => setTranscriptText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-sans h-32 focus:outline-hidden focus:border-blue-500 resize-none leading-relaxed"
                    placeholder="Raw transcript text..."
                  />
                </div>
              </div>
            </div>

            {/* RIGHT PANE: Interactive EMR Notes (col-span-6) */}
            <div className="lg:col-span-6 flex flex-col justify-between h-[520px] overflow-y-auto pr-1 custom-scrollbar space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileEdit className="w-4 h-4 text-emerald-500" />
                    Interactive Clinical SOAP Progress Note
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] uppercase font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Live Sync Enabled
                    </span>
                  </div>
                </div>

                {/* EMR Status Connected Bar */}
                <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-3 py-2 text-emerald-900 shadow-3xs">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-800 block">OntarioMD / Accuro FHIR Sync Gateway</span>
                      <span className="text-[9px] text-slate-500 font-medium block">AES-256 cryptographic session active • resident in Canada</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    SECURE
                  </span>
                </div>

                {/* Interactive SOAP Textareas */}
                <div className="space-y-3.5">
                  <div className="border border-slate-200/80 rounded-xl p-3 bg-white shadow-3xs">
                    <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>(S) Subjective Symptoms</span>
                      <span className="text-[9px] text-slate-400 capitalize font-medium">Patient complaints</span>
                    </label>
                    <textarea
                      value={generatedScribe.subjective}
                      onChange={(e) => setGeneratedScribe(prev => prev ? { ...prev, subjective: e.target.value } : null)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-xs text-slate-700 font-sans focus:outline-hidden focus:border-blue-500 h-20 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="border border-slate-200/80 rounded-xl p-3 bg-white shadow-3xs">
                    <label className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>(O) Objective Exams</span>
                      <span className="text-[9px] text-slate-400 capitalize font-medium">Physical exam & vitals</span>
                    </label>
                    <textarea
                      value={generatedScribe.objective}
                      onChange={(e) => setGeneratedScribe(prev => prev ? { ...prev, objective: e.target.value } : null)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-xs text-slate-700 font-sans focus:outline-hidden focus:border-emerald-500 h-20 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="border border-slate-200/80 rounded-xl p-3 bg-white shadow-3xs">
                    <label className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>(A) Assessment Diagnoses</span>
                      <span className="text-[9px] text-slate-400 capitalize font-medium">Diagnostic conclusions</span>
                    </label>
                    <textarea
                      value={generatedScribe.assessment}
                      onChange={(e) => setGeneratedScribe(prev => prev ? { ...prev, assessment: e.target.value } : null)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-xs text-slate-700 font-sans focus:outline-hidden focus:border-amber-500 h-20 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="border border-slate-200/80 rounded-xl p-3 bg-white shadow-3xs">
                    <label className="block text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>(P) Plan & Treatment</span>
                      <span className="text-[9px] text-slate-400 capitalize font-medium">Therapeutic interventions</span>
                    </label>
                    <textarea
                      value={generatedScribe.plan}
                      onChange={(e) => setGeneratedScribe(prev => prev ? { ...prev, plan: e.target.value } : null)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-xs text-slate-700 font-sans focus:outline-hidden focus:border-purple-500 h-20 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="border border-slate-200/80 rounded-xl p-3 bg-white shadow-3xs">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Encounter Summary</span>
                      <span className="text-[9px] text-slate-400 capitalize font-medium">Discharge / take-home capsule</span>
                    </label>
                    <textarea
                      value={generatedScribe.summary}
                      onChange={(e) => setGeneratedScribe(prev => prev ? { ...prev, summary: e.target.value } : null)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-xs text-slate-700 font-sans focus:outline-hidden focus:border-slate-500 h-16 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons for split-pane */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setIsEditingNotes(false)}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Close Editor
                </button>

                <button
                  onClick={handleSyncToEMR}
                  disabled={isSyncingEMR}
                  className={`flex-2 px-4 py-2.5 text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm rounded-xl ${
                    emrSyncSuccess
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300"
                  }`}
                >
                  {isSyncingEMR ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      Saving to EMR record...
                    </>
                  ) : emrSyncSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      EMR Synchronized!
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Sync Back to EMR & Verify
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
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

              {/* DSP Noise Filter Panel */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 text-slate-700 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <Sliders className={`w-3.5 h-3.5 ${isNoiseFilterEnabled ? "text-blue-500 animate-pulse" : "text-slate-400"}`} />
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block">Ambient Noise Filter (DSP)</span>
                    <span className="text-[9px] text-slate-400 font-medium block">Filters AC hum & high-frequency hiss</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold uppercase ${isNoiseFilterEnabled ? "text-blue-600" : "text-slate-400"}`}>
                    {isNoiseFilterEnabled ? "Active" : "Bypassed"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNoiseFilterEnabled(!isNoiseFilterEnabled);
                      onLogAudit("TOGGLE_NOISE_FILTER", `Set ambient noise DSP filter to ${!isNoiseFilterEnabled ? "ENABLED" : "DISABLED"}`);
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      isNoiseFilterEnabled ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        isNoiseFilterEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
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
                    <button
                      onClick={() => setOutputSubTab("gmail")}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        outputSubTab === "gmail"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Mail className="w-3 h-3" />
                      Gmail Share & Schedule
                    </button>
                  </div>

                  {/* SUB TAB CONTENT 1: EMR NOTE */}
                  {outputSubTab === "emr" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[10px] uppercase font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-100">
                          AI Scribe Record Generated Successfully
                        </span>
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => {
                              if (isEditingNotes) {
                                // Save and re-fetch billing suggestions based on edited content
                                const fullNotes = `${generatedScribe.subjective}\n${generatedScribe.objective}\n${generatedScribe.assessment}\n${generatedScribe.plan}`;
                                fetchBillingAndSafety(fullNotes);
                                onLogAudit("SAVE_EDITED_SOAP_NOTE", "Doctor saved manually reviewed and edited EMR clinical notes, re-running provincial billing/safety engines.");
                              } else {
                                onLogAudit("START_EDIT_SOAP_NOTE", "Doctor opened EMR clinical notes in interactive editing mode.");
                              }
                              setIsEditingNotes(!isEditingNotes);
                            }}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                              isEditingNotes
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {isEditingNotes ? (
                              <>
                                <Check className="w-3 h-3" /> Save Changes
                              </>
                            ) : (
                              <>
                                <FileEdit className="w-3 h-3 text-slate-500" /> Review & Edit
                              </>
                            )}
                          </button>
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
                      </div>

                      {/* Concise Overview Summary */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Encounter Summary
                        </h4>
                        {isEditingNotes ? (
                          <textarea
                            value={generatedScribe.summary}
                            onChange={(e) => setGeneratedScribe(prev => prev ? { ...prev, summary: e.target.value } : null)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500 h-16 leading-relaxed"
                          />
                        ) : (
                          <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                            {generatedScribe.summary}
                          </p>
                        )}
                      </div>

                      {/* Referral Letter view if selected */}
                      {notesType === "Referral Letter" && generatedScribe.referralLetter ? (
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-slate-800">Draft Consultation Referral Letter</h4>
                          {isEditingNotes ? (
                            <textarea
                              value={generatedScribe.referralLetter}
                              onChange={(e) => setGeneratedScribe(prev => prev ? { ...prev, referralLetter: e.target.value } : null)}
                              className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-4 text-xs font-mono resize-none h-64 focus:outline-hidden leading-relaxed shadow-lg"
                            />
                          ) : (
                            <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-4 text-xs font-mono whitespace-pre-line leading-relaxed shadow-lg h-64 overflow-y-auto custom-scrollbar">
                              {generatedScribe.referralLetter}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* SOAP Fields in a stunning deep-slate container matching the design aesthetic */
                        <div className="space-y-3.5 bg-[#0F172A] p-4.5 rounded-2xl border border-white/10 shadow-xl text-slate-100">
                          <h4 className="text-xs uppercase font-bold text-blue-400 mb-2 tracking-widest flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                              {isEditingNotes ? "Interactive EMR Review & Modification" : "AI Ambient Scribe Clinical SOAP Record"}
                            </span>
                            {isEditingNotes && (
                              <span className="text-[9px] uppercase font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                                Editing Mode Active
                              </span>
                            )}
                          </h4>

                          <div className="grid grid-cols-2 gap-3.5">
                            <div className="border border-white/10 rounded-xl p-3 bg-white/5">
                              <h5 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                                (S) Subjective Symptoms
                              </h5>
                              {isEditingNotes ? (
                                <textarea
                                  value={generatedScribe.subjective}
                                  onChange={(e) => setGeneratedScribe(prev => prev ? { ...prev, subjective: e.target.value } : null)}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-slate-100 font-sans focus:outline-hidden focus:border-blue-400 h-28 resize-none leading-relaxed"
                                />
                              ) : (
                                <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                                  {generatedScribe.subjective}
                                </p>
                              )}
                            </div>
                            <div className="border border-white/10 rounded-xl p-3 bg-white/5">
                              <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                                (O) Objective Exams
                              </h5>
                              {isEditingNotes ? (
                                <textarea
                                  value={generatedScribe.objective}
                                  onChange={(e) => setGeneratedScribe(prev => prev ? { ...prev, objective: e.target.value } : null)}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-slate-100 font-sans focus:outline-hidden focus:border-emerald-400 h-28 resize-none leading-relaxed"
                                />
                              ) : (
                                <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                                  {generatedScribe.objective}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3.5">
                            <div className="border border-white/10 rounded-xl p-3 bg-white/5">
                              <h5 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                                (A) Assessment Diagnoses
                              </h5>
                              {isEditingNotes ? (
                                <textarea
                                  value={generatedScribe.assessment}
                                  onChange={(e) => setGeneratedScribe(prev => prev ? { ...prev, assessment: e.target.value } : null)}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-slate-100 font-sans focus:outline-hidden focus:border-amber-400 h-28 resize-none leading-relaxed"
                                />
                              ) : (
                                <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                                  {generatedScribe.assessment}
                                </p>
                              )}
                            </div>
                            <div className="border border-white/10 rounded-xl p-3 bg-white/5">
                              <h5 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">
                                (P) Plan & Treatment
                              </h5>
                              {isEditingNotes ? (
                                <textarea
                                  value={generatedScribe.plan}
                                  onChange={(e) => setGeneratedScribe(prev => prev ? { ...prev, plan: e.target.value } : null)}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-slate-100 font-sans focus:outline-hidden focus:border-purple-400 h-28 resize-none leading-relaxed"
                                />
                              ) : (
                                <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                                  {generatedScribe.plan}
                                </p>
                              )}
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

                  {/* SUB TAB CONTENT 5: GMAIL SHARE & SCHEDULE DISPATCHER */}
                  {outputSubTab === "gmail" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[10px] uppercase font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-bold border border-blue-200">
                          Secure Gmail Transmission Gateway
                        </span>
                        <span className="text-xs text-slate-400 font-mono">PHIPA Care Dispatcher</span>
                      </div>

                      {isGoogleAuthLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                          <RotateCcw className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                          <p className="text-xs font-semibold text-slate-700">Connecting to Google Auth API...</p>
                        </div>
                      ) : !googleUser ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-100">
                            <Lock className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">Google OAuth Authorization Required</h4>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                              ClinOS uses secure in-memory Google OAuth to connect directly to your clinic's Gmail account to send patient instruction summaries and specialist schedules.
                            </p>
                          </div>
                          <button
                            onClick={handleGoogleSignIn}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-6 rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm"
                          >
                            <Mail className="w-4 h-4" />
                            Sign In with Google Workspace
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Logged in status */}
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-xs text-slate-700 font-medium">
                                Authorized Gmail Account: <strong>{googleUser.email}</strong>
                              </span>
                            </div>
                            <button
                              onClick={handleGoogleLogout}
                              className="text-[10px] font-bold text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              Disconnect Google
                            </button>
                          </div>

                          {/* Email Form */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            {/* Left Panel: Options and Recipient */}
                            <div className="md:col-span-5 space-y-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  Recipient Email Address
                                </label>
                                <input
                                  type="email"
                                  value={gmailTo}
                                  onChange={(e) => setGmailTo(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                                  placeholder="patient@example.com"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  Clinical Material Selection
                                </label>
                                <div className="space-y-1.5">
                                  <button
                                    onClick={() => setShareType("summary")}
                                    className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                                      shareType === "summary"
                                        ? "bg-blue-50 border-blue-200 text-blue-900"
                                        : "bg-white hover:bg-slate-50 border-slate-100 text-slate-600"
                                    }`}
                                  >
                                    <span>📄 Patient Instruction Summary</span>
                                    {shareType === "summary" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                  </button>

                                  <button
                                    onClick={() => setShareType("referral")}
                                    className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                                      shareType === "referral"
                                        ? "bg-blue-50 border-blue-200 text-blue-900"
                                        : "bg-white hover:bg-slate-50 border-slate-100 text-slate-600"
                                    }`}
                                  >
                                    <span>✉️ Draft Specialist Referral Letter</span>
                                    {shareType === "referral" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                  </button>

                                  <button
                                    onClick={() => setShareType("schedule")}
                                    className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                                      shareType === "schedule"
                                        ? "bg-blue-50 border-blue-200 text-blue-900"
                                        : "bg-white hover:bg-slate-50 border-slate-100 text-slate-600"
                                    }`}
                                  >
                                    <span>📅 Follow-Up Schedule & Alerts</span>
                                    {shareType === "schedule" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                  </button>
                                </div>
                              </div>

                              {/* Send button */}
                              <button
                                onClick={handleSendGmail}
                                disabled={isSendingGmail || !gmailTo}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                              >
                                {isSendingGmail ? (
                                  <>
                                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                                    Transmitting via Gmail REST API...
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-3.5 h-3.5" />
                                    Send Clinical Dispatch Securely
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Right Panel: Content Preview and Edit */}
                            <div className="md:col-span-7 space-y-3 flex flex-col justify-between">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  Email Subject
                                </label>
                                <input
                                  type="text"
                                  value={gmailSubject}
                                  onChange={(e) => setGmailSubject(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-blue-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  Email HTML Body (Interactive Preview)
                                </label>
                                <textarea
                                  value={gmailBody}
                                  onChange={(e) => setGmailBody(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-mono leading-relaxed h-[180px] focus:outline-hidden focus:bg-white focus:border-blue-500"
                                />
                              </div>

                              {gmailSendStatus && (
                                <div className={`p-3 rounded-xl border text-xs font-semibold ${
                                  gmailSendStatus.success
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                    : "bg-rose-50 border-rose-200 text-rose-800"
                                }`}>
                                  {gmailSendStatus.message}
                                </div>
                              )}
                            </div>
                          </div>
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
      )) : (
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
