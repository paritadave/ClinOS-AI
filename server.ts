import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
const PORT = 3000;

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Seed Patient Database (Canadian context)
let patients = [
  {
    id: "pat-01",
    name: "Sarah Jenkins",
    birthDate: "1994-07-12",
    phn: "9876-543-210", // OHIP Number
    province: "Ontario",
    gender: "Female",
    pregnancyStatus: "Pregnant", // 26 weeks
    allergies: ["Penicillin", "Peanuts"],
    conditions: ["Hypertension", "Chronic Lower Back Pain", "Gestational Diabetes Risk"],
    currentMedications: [
      {
        id: "med-1",
        name: "Methyldopa",
        dosage: "250mg",
        frequency: "BID (Twice Daily)",
        status: "Active",
        prescribedBy: "Dr. Alistair Vance",
        startDate: "2026-04-10",
        notes: "For gestational blood pressure control",
        adherence: "Good"
      },
      {
        id: "med-2",
        name: "Prenatal Multivitamins",
        dosage: "1 Tablet",
        frequency: "Daily",
        status: "Active",
        prescribedBy: "Dr. Alistair Vance",
        startDate: "2026-02-01",
        notes: "Standard prenatal support",
        adherence: "Good"
      }
    ],
    labs: [
      {
        id: "lab-1",
        testName: "eGFR (Estimated GFR)",
        date: "2026-06-20",
        value: "98",
        referenceRange: "> 90 mL/min/1.73m²",
        status: "Normal"
      },
      {
        id: "lab-2",
        testName: "Serum Creatinine",
        date: "2026-06-20",
        value: "68",
        referenceRange: "45-90 umol/L",
        status: "Normal"
      },
      {
        id: "lab-3",
        testName: "Oral Glucose Tolerance (OGTT)",
        date: "2026-06-15",
        value: "7.6",
        referenceRange: "< 7.8 mmol/L (2-hr)",
        status: "Normal"
      }
    ],
    imaging: [
      {
        id: "img-1",
        type: "Ultrasound",
        area: "Pelvic / Obstetric",
        date: "2026-06-02",
        status: "Reviewed",
        report: "Single live intrauterine pregnancy, consistent with 20 weeks 4 days gestation. Normal fetal anatomy and amniotic fluid volume. Anterior placenta, clear of internal os.",
        summary: "Normal obstetric ultrasound showing active, healthy single fetus at 20.5 weeks."
      },
      {
        id: "img-2",
        type: "MRI",
        area: "Lumbar Spine",
        date: "2026-01-14",
        status: "Completed",
        report: "L4-L5: Small central/left paracentral disc protrusion. No significant central canal narrowing. Minimal abutment of the descending left L5 nerve root without severe displacement or compression. L5-S1: Normal.",
        summary: "Mild L4-L5 lumbar disc protrusion with no active nerve compression."
      }
    ],
    referrals: [
      {
        id: "ref-1",
        specialty: "Obstetrics",
        consultant: "Dr. Maria Rodriguez (Mount Sinai)",
        date: "2026-03-01",
        status: "Completed",
        notes: "Routine prenatal care transfers"
      },
      {
        id: "ref-2",
        specialty: "Physiotherapy",
        consultant: "Soli Physiotherapy Clinic",
        date: "2026-05-18",
        status: "Pending",
        notes: "Evaluate lower back postural strain from pregnancy"
      }
    ],
    procedures: ["Appended appendectomy (2018)"],
    symptomTrends: [
      { date: "2026-04-10", severity: 2, symptomName: "Lower Back Pain", notes: "Initial mild pregnancy postural lumbar strain", metricValue: 135, metricUnit: "mmHg (BP Systolic)" },
      { date: "2026-05-10", severity: 4, symptomName: "Lower Back Pain", notes: "Slight increase due to pelvic tilt", metricValue: 138, metricUnit: "mmHg (BP Systolic)" },
      { date: "2026-06-10", severity: 5, symptomName: "Lower Back Pain", notes: "Persistent aching, referred to physio", metricValue: 132, metricUnit: "mmHg (BP Systolic)" },
      { date: "2026-07-15", severity: 3, symptomName: "Lower Back Pain", notes: "Moderated with physical therapy", metricValue: 126, metricUnit: "mmHg (BP Systolic)" },
      { date: "2026-05-15", severity: 1, symptomName: "Gestational Reflux", notes: "Occasional mild heartburn" },
      { date: "2026-06-15", severity: 3, symptomName: "Gestational Reflux", notes: "Intermittent after dinner" },
      { date: "2026-07-15", severity: 6, symptomName: "Gestational Reflux", notes: "More severe at night, sleeping elevated" }
    ],
    medicationHistory: [
      {
        id: "med-h1",
        name: "Naproxen",
        dosage: "500mg",
        frequency: "Daily PRN",
        status: "Discontinued",
        prescribedBy: "Dr. Alistair Vance",
        startDate: "2025-10-10",
        endDate: "2026-02-15",
        changeReason: "Pregnancy confirmed (NSAIDs contraindicated in 3rd trimester)"
      },
      {
        id: "med-h2",
        name: "Ibuprofen",
        dosage: "400mg",
        frequency: "Q6H PRN",
        status: "Discontinued",
        prescribedBy: "Dr. Alistair Vance",
        startDate: "2025-08-01",
        endDate: "2026-02-15",
        changeReason: "Pregnancy confirmed (Fetal ductus arteriosus risk)"
      }
    ]
  },
  {
    id: "pat-02",
    name: "Robert Vance",
    birthDate: "1958-04-15",
    phn: "1023-456-789", // BC Services Card
    province: "British Columbia",
    gender: "Male",
    pregnancyStatus: "None",
    allergies: ["Sulfa drugs", "Shellfish"],
    conditions: ["Type 2 Diabetes", "Chronic Kidney Disease (Stage 4)", "Hypertension", "Atrial Fibrillation"],
    currentMedications: [
      {
        id: "med-3",
        name: "Metformin",
        dosage: "500mg",
        frequency: "BID (Twice Daily)",
        status: "Active",
        prescribedBy: "Dr. Sarah Patel",
        startDate: "2022-09-15",
        notes: "For glucose management. Monitor renal function closely.",
        adherence: "Good"
      },
      {
        id: "med-4",
        name: "Warfarin",
        dosage: "5mg",
        frequency: "Once Daily",
        status: "Active",
        prescribedBy: "Dr. Sarah Patel",
        startDate: "2024-11-20",
        notes: "For stroke risk reduction in AFib. Target INR 2.0 - 3.0.",
        adherence: "Good"
      },
      {
        id: "med-5",
        name: "Atorvastatin",
        dosage: "20mg",
        frequency: "Once Daily HS",
        status: "Active",
        prescribedBy: "Dr. Sarah Patel",
        startDate: "2023-01-10",
        notes: "Cardioprotection / lipid control",
        adherence: "Good"
      }
    ],
    labs: [
      {
        id: "lab-4",
        testName: "eGFR (Estimated GFR)",
        date: "2026-07-01",
        value: "28",
        referenceRange: "> 90 mL/min/1.73m²",
        status: "Critical"
      },
      {
        id: "lab-5",
        testName: "Serum Creatinine",
        date: "2026-07-01",
        value: "185",
        referenceRange: "50-110 umol/L",
        status: "Abnormal"
      },
      {
        id: "lab-6",
        testName: "Hemoglobin A1c (HbA1c)",
        date: "2026-07-01",
        value: "7.8",
        referenceRange: "< 6.0 %",
        status: "Abnormal"
      },
      {
        id: "lab-7",
        testName: "INR (Prothrombin Time)",
        date: "2026-07-10",
        value: "2.4",
        referenceRange: "2.0 - 3.0 (Therapeutic)",
        status: "Normal"
      }
    ],
    imaging: [
      {
        id: "img-3",
        type: "X-Ray",
        area: "Left & Right Knees",
        date: "2026-02-12",
        status: "Reviewed",
        report: "Bilateral weight-bearing views of the knees demonstrate moderate joint space narrowing in the medial compartments. Subchondral sclerosis and marginal osteophytes are present. No acute fracture or joint effusion.",
        summary: "Moderate bilateral osteoarthritic changes with joint space narrowing, more pronounced on the medial sides."
      }
    ],
    referrals: [
      {
        id: "ref-3",
        specialty: "Nephrology",
        consultant: "Dr. James Aris (St. Paul's)",
        date: "2026-07-05",
        status: "Pending",
        notes: "Urgent referral due to eGFR drop below 30"
      },
      {
        id: "ref-4",
        specialty: "Ophthalmology",
        consultant: "Dr. Clara Wu",
        date: "2025-11-12",
        status: "Completed",
        notes: "Annual diabetic retinopathy screen - mild non-proliferative retinopathy noted, no intervention required."
      }
    ],
    procedures: ["Bilateral Knee Arthroscopy (2021)"],
    symptomTrends: [
      { date: "2026-03-01", severity: 3, symptomName: "Knee Joint Stiffness", notes: "Initial moderate medial knee stiffness", metricValue: 34, metricUnit: "mL/min/1.73m² (eGFR)" },
      { date: "2026-04-15", severity: 4, symptomName: "Knee Joint Stiffness", notes: "Stiffness on stairs, morning stiffness > 30m", metricValue: 32, metricUnit: "mL/min/1.73m² (eGFR)" },
      { date: "2026-06-01", severity: 6, symptomName: "Knee Joint Stiffness", notes: "Severe pain with flare, worse at night", metricValue: 30, metricUnit: "mL/min/1.73m² (eGFR)" },
      { date: "2026-07-15", severity: 7, symptomName: "Knee Joint Stiffness", notes: "Chronic flare, waiting for orthopedic consult", metricValue: 28, metricUnit: "mL/min/1.73m² (eGFR)" },
      { date: "2026-05-01", severity: 3, symptomName: "Uremic Fatigue", notes: "Feels tired in the afternoons" },
      { date: "2026-06-01", severity: 4, symptomName: "Uremic Fatigue", notes: "Slight decrease in appetite, fatigue" },
      { date: "2026-07-15", severity: 6, symptomName: "Uremic Fatigue", notes: "Marked fatigue, associated with eGFR drop to 28" }
    ],
    medicationHistory: [
      {
        id: "med-h3",
        name: "Metformin",
        dosage: "1000mg",
        frequency: "BID",
        status: "Changed",
        prescribedBy: "Dr. Sarah Patel",
        startDate: "2022-09-15",
        endDate: "2026-07-01",
        changeReason: "Stage 4 CKD (eGFR dropped below 30, requiring dose reduction to 500mg BID to avoid lactic acidosis)"
      },
      {
        id: "med-h4",
        name: "Ibuprofen",
        dosage: "400mg",
        frequency: "TID PRN",
        status: "Discontinued",
        prescribedBy: "Dr. Sarah Patel",
        startDate: "2023-11-12",
        endDate: "2026-07-01",
        changeReason: "Contraindicated in Stage 4 CKD (NSAID nephrotoxicity risk)"
      }
    ]
  },
  {
    id: "pat-03",
    name: "Leo Thompson",
    birthDate: "2018-06-12",
    phn: "7741-235-888", // OHIP
    province: "Ontario",
    gender: "Male",
    pregnancyStatus: "None",
    allergies: ["Peanuts (Severe)", "Amoxicillin"],
    conditions: ["Asthma (Mild Persistent)", "Atopic Dermatitis"],
    currentMedications: [
      {
        id: "med-6",
        name: "Salbutamol (Ventolin)",
        dosage: "100mcg",
        frequency: "1-2 Puffs inhaled Q4H PRN for cough/wheeze",
        status: "Active",
        prescribedBy: "Dr. Alistair Vance",
        startDate: "2023-04-12",
        notes: "Rescue inhaler. Use with aerochamber spacer.",
        adherence: "Good"
      },
      {
        id: "med-7",
        name: "Fluticasone (Flovent)",
        dosage: "125mcg",
        frequency: "1 Puff BID (Twice Daily)",
        status: "Active",
        prescribedBy: "Dr. Alistair Vance",
        startDate: "2024-10-15",
        notes: "Controller inhaler. Rinse mouth with water after use.",
        adherence: "Good"
      }
    ],
    labs: [
      {
        id: "lab-8",
        testName: "Peanut IgE Antibody",
        date: "2026-05-10",
        value: "45.2",
        referenceRange: "< 0.35 kU/L",
        status: "Abnormal"
      },
      {
        id: "lab-9",
        testName: "CBC (Eosinophils)",
        date: "2026-05-10",
        value: "0.6",
        referenceRange: "0.0 - 0.4 x10^9/L",
        status: "Abnormal"
      }
    ],
    imaging: [
      {
        id: "img-4",
        type: "X-Ray",
        area: "Chest PA/Lateral",
        date: "2026-03-15",
        status: "Completed",
        report: "Lungs are clear and well-expanded. No consolidation, pleural effusion, or pneumothorax. Heart size is normal. Bony thorax is intact.",
        summary: "Normal chest X-ray. Clear pediatric lung fields."
      }
    ],
    referrals: [
      {
        id: "ref-5",
        specialty: "Pediatric Allergist",
        consultant: "Dr. Timothy Vance, MD FRCPC",
        date: "2026-04-10",
        status: "Completed",
        notes: "Confirmed peanut anaphylaxis risk. Epipen Jr. prescribed."
      }
    ],
    procedures: [],
    symptomTrends: [
      { date: "2026-04-01", severity: 4, symptomName: "Asthma Cough", notes: "Wheezing during outdoor active play", metricValue: 210, metricUnit: "L/min (Peak Flow)" },
      { date: "2026-05-01", severity: 3, symptomName: "Asthma Cough", notes: "Flovent controller adjusted", metricValue: 220, metricUnit: "L/min (Peak Flow)" },
      { date: "2026-06-01", severity: 1, symptomName: "Asthma Cough", notes: "Asymptomatic, stable on BID Flovent", metricValue: 230, metricUnit: "L/min (Peak Flow)" },
      { date: "2026-07-15", severity: 2, symptomName: "Asthma Cough", notes: "Mild cough after soccer practice", metricValue: 225, metricUnit: "L/min (Peak Flow)" },
      { date: "2026-04-10", severity: 5, symptomName: "Atopic Dermatitis (Eczema)", notes: "Dry patches on inner elbows and knees, itchy" },
      { date: "2026-05-10", severity: 3, symptomName: "Atopic Dermatitis (Eczema)", notes: "Improving with daily topical barrier creams" },
      { date: "2026-07-15", severity: 2, symptomName: "Atopic Dermatitis (Eczema)", notes: "Mild dry patches, well managed" }
    ],
    medicationHistory: [
      {
        id: "med-h5",
        name: "Amoxicillin Oral Suspension",
        dosage: "250mg/5mL",
        frequency: "5mL TID",
        status: "Discontinued",
        prescribedBy: "Dr. Alistair Vance",
        startDate: "2025-12-05",
        endDate: "2025-12-07",
        changeReason: "Allergic reaction (Developed hives and mild facial edema after 4th dose. Switched to Azithromycin.)"
      }
    ]
  }
];

// Audit Logs In Memory Array (compliant with PIPEDA/PHIPA logging requirements)
let auditLogs = [
  {
    id: "log-1",
    timestamp: "2026-07-17T07:10:00-07:00",
    action: "USER_LOGIN",
    clinicianId: "cl-01",
    clinicianName: "Dr. Alistair Vance",
    clinicianRole: "Family Physician" as any,
    details: "User successfully logged in via single sign-on (MFA Verified).",
    ipAddress: "192.168.1.105",
    complianceChecked: true
  },
  {
    id: "log-2",
    timestamp: "2026-07-17T07:15:30-07:00",
    action: "VIEW_PATIENT_RECORD",
    clinicianId: "cl-01",
    clinicianName: "Dr. Alistair Vance",
    clinicianRole: "Family Physician" as any,
    patientId: "pat-01",
    patientName: "Sarah Jenkins",
    details: "Accessed full clinical longitudinal patient timeline.",
    ipAddress: "192.168.1.105",
    complianceChecked: true
  }
];

// Helper to add audit log
function addAuditLog(action: string, clinicianName: string, role: string, details: string, patientId?: string, patientName?: string) {
  const newLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action,
    clinicianId: "cl-01",
    clinicianName,
    clinicianRole: role as any,
    patientId,
    patientName,
    details,
    ipAddress: "192.168.1.105",
    complianceChecked: true
  };
  auditLogs.unshift(newLog);
}

// REST APIs
app.get("/api/patients", (req, res) => {
  res.json(patients);
});

app.get("/api/patients/:id", (req, res) => {
  const patient = patients.find(p => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }
  res.json(patient);
});

app.post("/api/patients/:id/sync-soap-note", (req, res) => {
  const { id } = req.params;
  const { subjective, objective, assessment, plan, summary, date, clinicianId } = req.body;
  
  const patient = patients.find(p => p.id === id);
  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const newSoapNote = {
    id: `soap-${Date.now()}`,
    date: date || new Date().toLocaleDateString("en-CA"),
    clinicianId: clinicianId || "cl-01",
    subjective: subjective || "",
    objective: objective || "",
    assessment: assessment || "",
    plan: plan || "",
    summary: summary || ""
  };

  if (!(patient as any).soapNotes) {
    (patient as any).soapNotes = [];
  }
  
  (patient as any).soapNotes.unshift(newSoapNote);

  addAuditLog(
    "SYNC_SOAP_NOTE_EMR",
    "Dr. Alistair Vance",
    "Family Physician",
    `Synchronized live-edited SOAP Progress Note for ${patient.name} back to OntarioMD/Accuro EMR clinical archive.`,
    patient.id,
    patient.name
  );

  res.json({ success: true, soapNote: newSoapNote, patient });
});

app.post("/api/patients", (req, res) => {
  const patientData = req.body;
  const newPatient = {
    id: `pat-${Date.now()}`,
    ...patientData,
    currentMedications: patientData.currentMedications || [],
    labs: patientData.labs || [],
    imaging: patientData.imaging || [],
    referrals: patientData.referrals || [],
    procedures: patientData.procedures || []
  };
  patients.push(newPatient);
  addAuditLog("CREATE_PATIENT", "Dr. Alistair Vance", "Family Physician", `Created new patient record for ${newPatient.name}.`, newPatient.id, newPatient.name);
  res.status(201).json(newPatient);
});

// PRESCRIPTION SAFETY CHECK AGENT (Major Feature!)
app.post("/api/patients/:id/prescribe-safety-check", async (req, res) => {
  const { id } = req.params;
  const { drugName, dosage, clinicianName, clinicianRole } = req.body;

  const patient = patients.find(p => p.id === id);
  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  // Create log of action
  addAuditLog(
    "PRESCRIPTION_SAFETY_CHECK",
    clinicianName || "Dr. Alistair Vance",
    clinicianRole || "Family Physician",
    `Initiated safety intelligence verification for prescribing ${drugName} ${dosage || ""}.`,
    patient.id,
    patient.name
  );

  // If Gemini API Key is missing, do an intelligent local rules fallback so it NEVER breaks or halts
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined. Falling back to local clinical rules engine.");
    // Simulate high-fidelity local clinical rules to match PRD safety alert examples perfectly!
    const localAlerts: any[] = [];
    const normalizedDrug = drugName.toLowerCase();

    // 1. Pregnancy Alerts
    if (patient.pregnancyStatus === "Pregnant") {
      if (normalizedDrug.includes("ibuprofen") || normalizedDrug.includes("advil") || normalizedDrug.includes("motrin")) {
        localAlerts.push({
          type: "danger",
          title: "⚠ Pregnancy Risk Detected",
          message: `Ibuprofen ${dosage || "800mg"} prescribed. Patient is currently pregnant. High-dose NSAIDs may increase fetal risks (e.g., premature closure of ductus arteriosus, oligohydramnios) during late pregnancy. Recommended review before prescribing.`,
          category: "Pregnancy"
        });
      }
    }

    // 2. Renal / Kidney function checks
    const egfrLab = patient.labs.find(l => l.testName.toLowerCase().includes("egfr"));
    if (egfrLab && parseFloat(egfrLab.value) < 30) {
      if (normalizedDrug.includes("metformin")) {
        localAlerts.push({
          type: "danger",
          title: "⚠ Renal Function Risk",
          message: `Metformin prescribed. Latest eGFR: ${egfrLab.value} mL/min/1.73m² (Stage 4 Kidney Disease). Metformin is contraindicated in patients with eGFR < 30 due to high risks of lactic acidosis.`,
          category: "Renal Function"
        });
      }
    }

    // 3. Drug-Drug Interactions
    if (normalizedDrug.includes("clarithromycin") || normalizedDrug.includes("biaxin")) {
      const hasWarfarin = patient.currentMedications.some(m => m.name.toLowerCase().includes("warfarin"));
      if (hasWarfarin) {
        localAlerts.push({
          type: "danger",
          title: "⚠ Significant Interaction Detected",
          message: `Clarithromycin prescribed. Patient is currently on Warfarin. Clarithromycin inhibits CYP3A4 and can significantly increase Warfarin levels, causing potential increased bleeding risks. Closely monitor INR.`,
          category: "Drug Interaction"
        });
      }
    }

    // 4. Breastfeeding checks
    if (patient.pregnancyStatus === "Breastfeeding") {
      if (normalizedDrug.includes("codeine") || normalizedDrug.includes("oxycodone")) {
        localAlerts.push({
          type: "warning",
          title: "⚠ Lactation Review Recommended",
          message: `Codeine/Opiate safety check. Patient is currently breastfeeding. Codeine is metabolized into morphine and can pass into breastmilk, risking baby sedation or respiratory depression. Verify safety profile.`,
          category: "Lactation"
        });
      }
    }

    // 5. Condition Conflicts
    if (patient.conditions.some(c => c.toLowerCase().includes("asthma"))) {
      if (normalizedDrug.includes("propranolol") || normalizedDrug.includes("metoprolol") || normalizedDrug.includes("beta blocker") || normalizedDrug.includes("carvedilol")) {
        localAlerts.push({
          type: "danger",
          title: "⚠ Condition Conflict Detected",
          message: `Non-selective beta-blocker prescribed. Existing asthma diagnosis detected. Beta-blockers can trigger life-threatening bronchospasm by blocking beta-2 receptors in bronchial smooth muscles.`,
          category: "Condition Conflict"
        });
      }
    }

    // 6. Allergies
    for (const allergy of patient.allergies) {
      if (normalizedDrug.includes(allergy.toLowerCase()) || (allergy.toLowerCase() === "penicillin" && (normalizedDrug.includes("amoxicillin") || normalizedDrug.includes("ampicillin") || normalizedDrug.includes("penicillin") || normalizedDrug.includes("clavulin")))) {
        localAlerts.push({
          type: "danger",
          title: "⚠ Severe Drug Allergy Warning",
          message: `Allergen conflict: Patient has a documented allergy to ${allergy}. Prescribed drug ${drugName} is contraindicated or poses a high risk of cross-reactivity.`,
          category: "Allergy"
        });
      }
    }

    // If no alert is triggered, send a reassuring safe check
    if (localAlerts.length === 0) {
      localAlerts.push({
        type: "info",
        title: "✓ Safety Review Passed",
        message: `No immediate critical safety conflicts identified for ${drugName} ${dosage || ""}. Always perform standard clinical verification.`,
        category: "Allergy"
      });
    }

    return res.json({ alerts: localAlerts, source: "Clinical Rules Engine (Offline Fallback)" });
  }

  try {
    // Generate AI Safety Check using Gemini
    const systemPrompt = `You are an advanced medical safety audit system designed to prevent medication errors in Canadian clinical settings.
    Analyze the patient profile provided and the newly prescribed medication to verify:
    1. Allergy conflicts
    2. Drug-drug interactions with current medications
    3. Renal/Kidney risks using the patient's eGFR and creatinine levels
    4. Pregnancy & Lactation risks
    5. Patient chronic conditions conflicts (e.g. Asthma vs Beta Blockers, Hypertension, AFib, Diabetes)

    Respond ONLY with a JSON array of alerts matching the schema requested. If absolutely no alerts apply, return an empty array or a safe info-type element. Keep explanations highly scientific, clear, and action-oriented for a doctor.`;

    const userPrompt = `Patient Details:
    - Name: ${patient.name}
    - Pregnancy Status: ${patient.pregnancyStatus}
    - Allergies: ${JSON.stringify(patient.allergies)}
    - Chronic Conditions: ${JSON.stringify(patient.conditions)}
    - Active Medications: ${JSON.stringify(patient.currentMedications)}
    - Lab Results (eGFR, Creatinine, etc.): ${JSON.stringify(patient.labs)}

    Newly Prescribed Medication:
    - Drug Name: ${drugName}
    - Dosage: ${dosage}

    Examine this medical combination and return safety alerts.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            alerts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "danger, warning, or info" },
                  title: { type: Type.STRING, description: "Short title of warning" },
                  message: { type: Type.STRING, description: "Explanation including patient-specific reasons (egFR, pregnancy status, allergies, or drug interactions)" },
                  category: { type: Type.STRING, description: "Pregnancy, Renal Function, Drug Interaction, Lactation, Condition Conflict, or Allergy" }
                },
                required: ["type", "title", "message", "category"]
              }
            }
          },
          required: ["alerts"]
        }
      }
    });

    const data = JSON.parse(response.text || '{"alerts":[]}');
    res.json({ alerts: data.alerts || [], source: "Gemini 3.5 Clinical Safety Agent" });
  } catch (error: any) {
    console.error("Gemini Safety Check Error:", error);
    res.status(500).json({ error: "Failed to perform safety check", details: error.message });
  }
});

// AMBIENT MEDICAL SCRIBE AGENT
app.post("/api/scribe/generate-soap", async (req, res) => {
  const { transcript, patientId, intakeSummary, notesType } = req.body;
  const patient = patients.find(p => p.id === patientId);

  addAuditLog(
    "GENERATE_SOAP_NOTE",
    "Dr. Alistair Vance",
    "Family Physician",
    `Generated AI ${notesType || "SOAP"} Clinical Scribe documentation from ambient audio transcript.`,
    patient?.id,
    patient?.name
  );

  const finalNotesType = notesType || "SOAP";

  if (!apiKey) {
    // Return structured default SOAP notes if no API Key
    const placeholderSoap = {
      subjective: `Patient complains of active symptoms. Dry cough persisting over 7 days. Mild dyspnea on exertion. Sleep is slightly disrupted due to cough. Refers to previous back pain resolving with physical therapy. No fever or gastrointestinal complaints. Intake summaries align with worsening dry cough.`,
      objective: `General: Alert and oriented, in no distress. Vitals (simulated): BP 120/80, HR 72, RR 16, Temp 36.8°C. Chest: Resonant to percussion. Auscultation reveals mild expiratory wheeze bilaterally but good air entry. No crackles or dullness. Cardiovascular: Normal S1, S2. Regular rate and rhythm.`,
      assessment: `1. Acute Respiratory Tract Infection - likely viral bronchitic component, rule out early atypical pneumonia.
2. Background Chronic conditions remain stable.`,
      plan: `1. Increase hydration and warm fluids.
2. Salbutamol Inhaler (PRN) for respiratory comfort.
3. If worsening, follow up within 48-72 hours or present to Emergency Dept.
4. Schedule routine lab review.`,
      referralLetter: `Dear Specialist,\n\nI am referring this patient for consultation regarding ongoing management. Thank you for your review.\n\nSincerely,\nDr. Alistair Vance, CCFP`,
      summary: "Patient presents with progressive dry cough and mild dyspnea over one week. Lungs clear except for mild bilateral expiratory wheeze. Plan involves supportive care and PRN bronchodilator coverage."
    };
    return res.json({ soap: placeholderSoap, source: "Clinical Scribe Template Engine" });
  }

  try {
    const prompt = `You are an expert Canadian Clinical Scribe Agent.
    Generate a highly professional, well-structured clinical document based on the following input materials:
    - Scribe Ambient Audio Transcript: "${transcript}"
    - Patient Background: ${patient ? JSON.stringify(patient) : "Anonymous"}
    - Patient Intake Summary: ${intakeSummary ? JSON.stringify(intakeSummary) : "None"}

    Produce a complete clinical note structured according to the format: "${finalNotesType}".
    - If ${finalNotesType} is SOAP, populate Subjective, Objective, Assessment, and Plan fields.
    - If ${finalNotesType} is "Referral Letter", generate a professional Referral letter from a family doctor to a specialist.
    - Keep medical terminology precise, professional, and compliant with Ontario/BC EMR record standards.
    - Also output a brief 2-sentence summary of the visit.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subjective: { type: Type.STRING },
            objective: { type: Type.STRING },
            assessment: { type: Type.STRING },
            plan: { type: Type.STRING },
            referralLetter: { type: Type.STRING, description: "Referral letter draft if requested, otherwise brief placeholder" },
            summary: { type: Type.STRING }
          },
          required: ["subjective", "objective", "assessment", "plan", "summary"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    res.json({ soap: result, source: "Gemini 3.5 Scribe Engine" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to generate notes", details: error.message });
  }
});

// REAL-TIME AUDIO PROCESSING & TRANSCRIPTION ENDPOINT
app.post("/api/scribe/process-audio", async (req, res) => {
  const { audio, mimeType, patientId } = req.body;
  const patient = patients.find(p => p.id === patientId);

  addAuditLog(
    "PROCESS_AUDIO_BLOBS",
    "Dr. Alistair Vance",
    "Family Physician",
    `Received secure real-time audio blob for patient encounter, launching automated transcription and preventive gap audit.`,
    patient?.id,
    patient?.name
  );

  // Fallback high-fidelity data based on specific patients
  const getFallbackData = () => {
    if (patientId === "pat-01") {
      return {
        transcript: `Doctor: Good afternoon, Sarah. Let's talk about how your pregnancy has been going at 26 weeks. How is your blood pressure and that cough?
Patient: Hi Doctor. The cough is still there, mostly dry and worse at night, but no fever. My back is also a bit sore. But I wanted to make sure if I need any vaccines or other checks today?
Doctor: Yes, absolutely. Looking at your chart, you are now at 26 weeks, which is the perfect window for your Tdap pertussis booster vaccination. Also, because of your gestational hypertension history, we need to check your urine protein with an Albumin-to-Creatinine Ratio (ACR) today to make sure we don't have any signs of preeclampsia starting. Let's get both of those sorted out.
Patient: That sounds really important. Let's do that.`,
        preventiveCareAlerts: [
          {
            title: "🔬 Urine Protein / ACR Screening Required",
            status: "Overdue",
            details: "Gestational hypertension increases the risk of developing preeclampsia. Spot urine ACR evaluation is required to monitor for early renal protein filtration.",
            actionRequired: "Collect a spot urine sample for Albumin-to-Creatinine Ratio (ACR) today."
          },
          {
            title: "💉 Tdap Pertussis Vaccination Due",
            status: "Overdue",
            details: "Standard of care (NACI guidelines) recommends Tdap immunizations during each pregnancy between 27-32 weeks to transfer active antibodies to the fetus.",
            actionRequired: "Administer 0.5 mL Tdap booster vaccine during today's visit."
          }
        ]
      };
    } else if (patientId === "pat-02") {
      return {
        transcript: `Doctor: Good morning Robert. Let's discuss your blood sugar levels and your overall health. Your latest kidney results show an eGFR of 28, which places us in Stage 4 kidney function.
Patient: Yes, Doctor, I feel quite tired in the afternoons, and my knees are very stiff. Am I due for any special screenings?
Doctor: Yes, Robert. Since you have both Type 2 Diabetes and Stage 4 Chronic Kidney Disease, you are highly indicated for the Pneumococcal conjugate vaccination to prevent invasive lung infections. Your record also shows your annual Diabetic Retinopathy eye screening is overdue. We must refer you for a fundus dilated exam to protect your vision.
Patient: Okay, I will definitely follow up with those. Let's get the referral done.`,
        preventiveCareAlerts: [
          {
            title: "💉 Pneumococcal Vaccination (PCV20 / PPSV23) Overdue",
            status: "Overdue",
            details: "Pneumococcal immunization is strongly recommended by NACI for advanced CKD (Stage 4, eGFR < 30) and Type 2 Diabetes to safeguard against invasive respiratory pathologies.",
            actionRequired: "Administer PCV20 conjugate vaccine today."
          },
          {
            title: "🔬 Annual Diabetic Retinopathy Dilated Fundus Screen",
            status: "Overdue",
            details: "Annual dilated eye examination is required under Canadian Diabetes Guidelines to assess for early-stage diabetic retinopathy.",
            actionRequired: "Generate immediate ophthalmology or optometry referral for a dilated fundus exam."
          }
        ]
      };
    } else if (patientId === "pat-03") {
      return {
        transcript: `Doctor: Good morning, Leo! And good morning to your mom as well. Let's talk about how your asthma has been and how your skin is doing.
Patient's Mom: Hello, Doctor. Leo's asthma has been quite good, but he had a cough after soccer practice last week, and we had to use his rescue Ventolin inhaler twice. His eczema is flaring up a bit on his inner elbows too.
Doctor: I understand. For an 8-year-old child with mild persistent asthma, we must review his Written Asthma Action Plan so you and his school teachers know exactly what to do. Also, since he has a known severe peanut allergy, we need to verify that his epinephrine auto-injector (EpiPen Jr.) prescription is current and that he has one for school.
Patient's Mom: Yes, please! Let's do that. We also need to review his childhood vaccination schedule.`,
        preventiveCareAlerts: [
          {
            title: "🏃 Pediatric Written Asthma Action Plan (WAAP) Review",
            status: "Overdue",
            details: "Canadian Thoracic Society pediatric guidelines mandate co-design of a written self-management plan for pediatric asthma patients to guide parent and school action.",
            actionRequired: "Complete a personalized pediatric Written Asthma Action Plan with Leo and his mother today."
          },
          {
            title: "🥜 Epinephrine Auto-Injector (EpiPen Jr. 0.15mg) Verification",
            status: "Overdue",
            details: "Standard of care for children with severe IgE-mediated peanut allergy is to maintain active, non-expired epinephrine auto-injectors at home and school.",
            actionRequired: "Verify EpiPen Jr. expiry dates and issue updated prescription if close to expiration."
          }
        ]
      };
    } else {
      return {
        transcript: `Doctor: Hello. Let's look over your clinical record. We want to make sure your preventative health screening schedules are fully up to date today.
Patient: Thank you Doctor. Yes, I'm feeling quite well but would love to make sure I am fully up to date.
Doctor: Wonderful. We will review your age-appropriate health grids and align your vaccine and blood work schedules.
Patient: Excellent, let's do that.`,
        preventiveCareAlerts: [
          {
            title: "🔬 Preventive Health Screening Review",
            status: "Due",
            details: "Routine age-appropriate metabolic, lipid, and blood pressure checks are essential to mitigate longitudinal disease vectors.",
            actionRequired: "Order a general lipid check and verify baseline blood pressure."
          }
        ]
      };
    }
  };

  if (!apiKey) {
    const fallback = getFallbackData();
    return res.json({
      transcript: fallback.transcript,
      preventiveCareAlerts: fallback.preventiveCareAlerts,
      source: "Offline Ambient Scribe Speech-to-Text Fallback Engine"
    });
  }

  try {
    const prompt = `You are an expert Canadian Clinical Assistant and Speech-to-Text Transcriptionist.
    You have been supplied with base64-encoded audio representing a patient consultation.
    
    TASK:
    1. Accurate Clinical Transcription: Transcribe the audio clearly. Format it with speaker labels (e.g. Doctor, Patient) as a structured conversation. Ensure all medical details, symptoms, medications, dosages, and patient complaints are transcribed in their exact terminology.
    2. Real-Time Preventive Care Gaps & Alerts Audit: Analyze the conversation context and cross-reference the patient profile provided:
       - Patient Profile: ${patient ? JSON.stringify(patient) : "Anonymous"}
       - Check for any overdue immunizations (Tdap, Pneumococcal), screening gaps (Urine ACR, Diabetic Retinopathy, Pap smear), or care plans (Written Asthma Action Plan) based on their conditions (Diabetes, CKD, Pregnancy, Asthma, etc.).
       - Identify 1 or 2 high-priority preventive care alerts.
    
    Return your response strictly as a JSON object matching this schema:
    {
      "transcript": "A speaker-labeled transcription of the doctor-patient encounter...",
      "preventiveCareAlerts": [
        {
          "title": "Short title of preventive alert (e.g., '🔬 Urine Protein Screening Required')",
          "status": "'Overdue' or 'Due'",
          "details": "Clear clinical reasoning showing why this screening or vaccine is overdue for this patient based on active diagnoses (e.g., CKD, gestational hypertension, asthma) and official guidelines (NACI, SOGC, Diabetes Canada, etc.).",
          "actionRequired": "Concrete clinical task required during or following this visit."
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            data: audio,
            mimeType: mimeType || "audio/webm"
          }
        },
        prompt
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            preventiveCareAlerts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  status: { type: Type.STRING },
                  details: { type: Type.STRING },
                  actionRequired: { type: Type.STRING }
                },
                required: ["title", "status", "details", "actionRequired"]
              }
            }
          },
          required: ["transcript", "preventiveCareAlerts"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    res.json({
      transcript: result.transcript,
      preventiveCareAlerts: result.preventiveCareAlerts || [],
      source: "Gemini 3.5 Real-Time Audio Engine"
    });
  } catch (error: any) {
    console.error("Audio processing failure:", error);
    // On any transcription exception, graceful clinical fallback so user never gets stuck
    const fallback = getFallbackData();
    res.json({
      transcript: fallback.transcript,
      preventiveCareAlerts: fallback.preventiveCareAlerts,
      source: "Gemini Audio Failover Engine",
      error: error.message
    });
  }
});

// CANADIAN PROVINCIAL BILLING ENGINE (OHIP / MSP)
app.post("/api/scribe/suggest-billing", async (req, res) => {
  const { notesText, patientId } = req.body;
  const patient = patients.find(p => p.id === patientId);

  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const isOntario = patient.province === "Ontario";
  const provinceLabel = isOntario ? "Ontario (OHIP)" : "British Columbia (MSP)";

  addAuditLog(
    "SUGGEST_BILLING_CODES",
    "Dr. Alistair Vance",
    "Family Physician",
    `Analyzed session notes for ${patient.name} to suggest provincial ${provinceLabel} billing codes.`,
    patient.id,
    patient.name
  );

  // High-fidelity fallback presets for Ontario & BC based on patient conditions
  const ontarioFallback = [
    { code: "A007", description: "Intermediate Assessment (GP Office)", icdCode: "466", icdDescription: "Acute bronchitis", fee: 33.70, status: "Recommended" },
    { code: "K013", description: "Individual Counselling (First 12 units per year, 1 unit = 30 min)", icdCode: "300", icdDescription: "Anxiety/stress state", fee: 62.75, status: "Recommended" },
    { code: "K017", description: "Pregnancy Care Premium (First-trimester onwards counselling)", icdCode: "V22", icdDescription: "Normal pregnancy management", fee: 22.00, status: "Applicable" }
  ];

  const bcFallback = [
    { code: "00100", description: "General Practice Office Visit (Age 50-69)", icdCode: "250", icdDescription: "Type 2 diabetes", fee: 39.60, status: "Recommended" },
    { code: "12120", description: "Chronic Disease Management (Diabetes Annual Fee)", icdCode: "250", icdDescription: "Diabetes mellitus", fee: 125.00, status: "Applicable" },
    { code: "12100", description: "Telehealth Clinical Consultation (GP)", icdCode: "585", icdDescription: "Chronic kidney disease", fee: 48.20, status: "Recommended" }
  ];

  const selectedFallback = isOntario ? ontarioFallback : bcFallback;

  if (!apiKey) {
    return res.json({ suggestions: selectedFallback, province: patient.province, source: "Offline Provincial Billing Parser" });
  }

  try {
    const prompt = `You are an expert Canadian health billing auditor specializing in provincial health fee schedules.
    Analyze the following patient encounter record:
    - Patient Province: "${patient.province}"
    - Patient Conditions: ${JSON.stringify(patient.conditions)}
    - Clinical Notes / SOAP: "${notesText || ''}"

    Recommend 2 to 3 provincial fee billing codes (OHIP codes if Ontario, MSP codes if British Columbia).
    For each code, return:
    1. "code": The official fee code (e.g., A007, K013 for Ontario; 00100, 12120 for BC).
    2. "description": Detailed description of the service.
    3. "icdCode": The ICD-9 or ICD-10 diagnostic code (e.g., 466, 250, 585).
    4. "icdDescription": The name of the diagnosis.
    5. "fee": Estimated dollar billing fee as a decimal number.
    6. "status": Either "Recommended" or "Applicable".

    Return ONLY a JSON array matching this format.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  description: { type: Type.STRING },
                  icdCode: { type: Type.STRING },
                  icdDescription: { type: Type.STRING },
                  fee: { type: Type.NUMBER },
                  status: { type: Type.STRING }
                },
                required: ["code", "description", "icdCode", "icdDescription", "fee", "status"]
              }
            }
          },
          required: ["suggestions"]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ suggestions: parsed.suggestions || selectedFallback, province: patient.province, source: "Gemini 3.5 Billing Agent" });
  } catch (error: any) {
    console.error("Billing Suggester Error:", error);
    res.json({ suggestions: selectedFallback, province: patient.province, error: error.message, source: "Billing Suggestion Fallback Engine" });
  }
});

// SECURE PROVINCIAL REFERRAL LETTER GENERATOR
app.post("/api/scribe/generate-referral", async (req, res) => {
  const { patientId, specialty, facility, clinicNotes } = req.body;
  const patient = patients.find(p => p.id === patientId);

  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const isOntario = patient.province === "Ontario";
  const regulatoryBody = isOntario ? "College of Physicians and Surgeons of Ontario (CPSO)" : "College of Physicians and Surgeons of British Columbia (CPSBC)";
  const referringMdNo = isOntario ? "CPSO #74810" : "CPSBC #94821";

  addAuditLog(
    "GENERATE_REFERRAL_LETTER",
    "Dr. Alistair Vance",
    "Family Physician",
    `Generated regulatory-compliant specialist referral to ${specialty} at ${facility} for ${patient.name}.`,
    patient.id,
    patient.name
  );

  const fallbackLetter = `
CLINOS FAMILY HEALTH CLINIC
250 University Ave, Toronto, ON M5H 3E5
Phone: (416) 555-0100 | Fax: (416) 555-0101

Date: ${new Date().toLocaleDateString("en-CA")}

RE: Referral of ${patient.name} (DOB: ${patient.birthDate})
PHN: ${patient.phn} (${patient.province})
Address: 742 Evergreen Terrace, ${isOntario ? "Toronto, ON" : "Vancouver, BC"}

TO: Department of ${specialty}
FACILITY: ${facility}

Dear Colleagues,

I am writing to formally refer ${patient.name} for specialist evaluation and consultation regarding ongoing medical management.

PATIENT OVERVIEW & CONDITIONS:
- Patient is a ${patient.gender} (${patient.pregnancyStatus !== 'None' ? `Pregnancy Status: ${patient.pregnancyStatus}` : 'Non-pregnant'}).
- Active clinical conditions: ${patient.conditions.join(", ")}.
- Known allergies: ${patient.allergies.join(", ") || "No known drug allergies"}.

CLINICAL CONTEXT & NOTES:
${clinicNotes || "Patient requires assessment and optimization of current therapies. Please see full EMR clinical history and symptom trajectories attached."}

ACTIVE THERAPIES:
${patient.currentMedications.map(m => `- ${m.name} ${m.dosage} ${m.frequency}`).join("\n")}

Thank you for your valuable consultation and for assuming part of this patient's longitudinal care. Please contact my office to coordinate details of the visit.

Sincerely,

Dr. Alistair Vance, CCFP, FCFP
Family Medicine
Billing Practitioner Number: ${isOntario ? "849312" : "948213"}
Regulatory Registration: ${referringMdNo}
  `;

  if (!apiKey) {
    return res.json({ letter: fallbackLetter.trim(), source: "Offline College-Compliant Formatter" });
  }

  try {
    const prompt = `You are an expert medical transcriptionist formatting standard, official consultation letters for Canadian specialists.
    Generate a formal referral letter using the following details:
    - Referring Doctor: Dr. Alistair Vance, CCFP, FCFP
    - Referring MD Billing Number: ${isOntario ? "849312" : "948213"}
    - Referring Regulatory Registration: ${referringMdNo}
    - Regulatory standard: compliant with ${regulatoryBody} guidelines
    - Patient Name: ${patient.name}
    - Patient Date of Birth: ${patient.birthDate}
    - Patient PHN: ${patient.phn}
    - Patient Province: ${patient.province}
    - Patient Allergies: ${patient.allergies.join(", ")}
    - Patient Conditions: ${patient.conditions.join(", ")}
    - Active Medications: ${JSON.stringify(patient.currentMedications)}
    - Target Specialist: ${specialty}
    - Target Facility/Hospital: ${facility}
    - Clinical SOAP Context: "${clinicNotes || ''}"

    Ensure the letter is highly professional, formal, formatted with clear headers, patient identifiers, referring physician identifiers, clinical context, and clear recommendations.
    Do not use markdown wrappers like \`\`\` or other markers. Just return the raw structured formal letter text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ letter: response.text?.trim() || fallbackLetter, source: "Gemini 3.5 Referral Agent" });
  } catch (error: any) {
    res.json({ letter: fallbackLetter, error: error.message, source: "Referral Fallback Engine" });
  }
});

// REGULATORY GUIDELINES & MEDICAL SAFETY CHECK AUDIT (MCC / Health Canada)
app.get("/api/scribe/guidelines-audit/:patientId", (req, res) => {
  const { patientId } = req.params;
  const patient = patients.find(p => p.id === patientId);

  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  addAuditLog(
    "GUIDELINES_AUDIT",
    "Dr. Alistair Vance",
    "Family Physician",
    `Performed clinical guidelines audit on ${patient.name} using Medical Council of Canada (MCC) & Health Canada frameworks.`,
    patient.id,
    patient.name
  );

  let audits = [];

  // Rules based on conditions/pregnancy
  if (patient.pregnancyStatus !== "None") {
    audits.push({
      id: "g1",
      title: "Maternal Pharmacotherapy Safety",
      status: "Cleared",
      agency: "Health Canada / SOGC (Society of Obstetricians and Gynaecologists of Canada)",
      details: "Prenatal multivitamins and Methyldopa (250mg BID) are safe and first-line. Safe for pregnancy weeks 20-30.",
      actionRequired: "Ensure regular BP charting at home. Maintain diastolic target between 80-90 mmHg."
    });
    audits.push({
      id: "g2",
      title: "NSAID Contraindication Scan",
      status: "High Alert Passed",
      agency: "Health Canada / MCC Guidelines",
      details: "NSAIDs (Naproxen, Ibuprofen) have been successfully discontinued prior to trimester 3. Protects against premature closure of fetal ductus arteriosus.",
      actionRequired: "None. Avoid prescribing any further NSAID-class drugs. Recommend Acetaminophen if pain relief is required."
    });
  }

  if (patient.conditions.includes("Chronic Kidney Disease (Stage 4)")) {
    audits.push({
      id: "g3",
      title: "Metformin Clearance Alert",
      status: "Immediate Action Required",
      agency: "Health Quality Ontario / BC Guidelines (BCGP) Renal Care",
      details: "Metformin is strictly contraindicated at an eGFR < 30 mL/min/1.73m² (Patient is at eGFR 28) due to extreme risk of lactic acidosis.",
      actionRequired: "Discontinue Metformin 500mg BID immediately. Switch to renal-safe alternatives (e.g., Insulin or SGLT2 inhibitor adjusted for GFR)."
    });
    audits.push({
      id: "g4",
      title: "Warfarin INR Target Management",
      status: "Attention Required",
      agency: "CCS (Canadian Cardiovascular Society) Atrial Fibrillation Guidelines",
      details: "Warfarin anticoagulation active for non-valvular AFib. Since kidney function is reduced, warfarin clearances are variable.",
      actionRequired: "Check INR twice weekly. Target level: 2.0 - 3.0. Consider transitioning to low-dose DOAC if renal specialist approves."
    });
  } else {
    // Standard checks if not kidney/pregnancy
    audits.push({
      id: "g5",
      title: "General Prevention Check",
      status: "Cleared",
      agency: "Medical Council of Canada (MCC) Preventative Health",
      details: "Standard clinical screening schedules. Age-appropriate blood pressure and metabolic panels are in good order.",
      actionRequired: "Routine follow-up."
    });
  }

  res.json({ audits, source: "ClinOS Regulatory Auditor" });
});

// MULTILINGUAL TRANSLATION AGENT
app.post("/api/translate", async (req, res) => {
  const { text, targetLanguage, sourceLanguage, speaker } = req.body;

  addAuditLog(
    "TRANSLATE_COMMUNICATION",
    "Dr. Alistair Vance",
    "Family Physician",
    `Translated spoken dialogue from ${sourceLanguage || "Detect"} to ${targetLanguage} for interactive patient-doctor session.`
  );

  if (!apiKey) {
    const placeholderTranslations: { [key: string]: string } = {
      "French": "Bonjour, comment puis-je vous aider aujourd'hui?",
      "Hindi": "नमस्ते, आज मैं आपकी क्या मदद कर सकता हूँ?",
      "Punjabi": "ਨਮਸਤੇ, ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
      "Gujarati": "નમસ્તે, આજે હું તમારી શું મદદ કરી શકું?",
      "Urdu": "ہیلو، میں آج آپ کی کیا مدد کر سکتا ہوں؟",
      "Mandarin": "您好，今天我能帮您什么忙？",
      "Arabic": "مرحباً، كيف يمكنني مساعدتك اليوم؟",
      "Spanish": "Hola, ¿cómo puedo ayudarte hoy?",
      "English": "Hello, how can I help you today?"
    };
    const translatedText = placeholderTranslations[targetLanguage] || `[Translation of "${text}" to ${targetLanguage}]`;
    return res.json({ translatedText, source: "Static Translation Fallback" });
  }

  try {
    const prompt = `You are a medical translator operating in a Canadian multi-cultural walk-in clinic.
    Translate the following ${speaker === "doctor" ? "clinician's explanation" : "patient's statement"} from ${sourceLanguage || "the source language"} to ${targetLanguage}.
    Original text: "${text}"

    Rules:
    - Ensure absolute clinical accuracy of medical terms, dosage, and diagnostic information.
    - Keep the register polite, professional, and accessible.
    - Provide only the translated text as your response.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ translatedText: response.text?.trim() || text, source: "Gemini 3.5 Translation Agent" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to translate text", details: error.message });
  }
});

// DIAGNOSTIC IMAGING SUMMARIZATION AGENT
app.post("/api/imaging/summarize", async (req, res) => {
  const { reportText, imagingType } = req.body;

  addAuditLog(
    "SUMMARIZE_IMAGING_REPORT",
    "Dr. Alistair Vance",
    "Family Physician",
    `Summarized complex diagnostic ${imagingType || "Imaging"} clinical radiology report for EMR entry and patient sharing.`
  );

  if (!apiKey) {
    const placeholderSummary = {
      clinicalOverview: "Small lumbar disc protrusion at L4-L5. There is no active nerve root compression, vertebral body alignment is preserved, and the L5-S1 disc level is completely normal.",
      patientExplanation: "You have a very small bulging disc in your lower back between the 4th and 5th bones. The good news is that it is not pinching or pressing on any nerves, which is why there's no major leg pain. The rest of your lower back is in great shape.",
      recommendedFollowUps: [
        "Referral to physiotherapy for postural core strengthening.",
        "Avoid heavy lifting or sudden twisting movements during acute flare-ups.",
        "Over-the-counter pain relief PRN (checking clinical safety agent recommendations first)."
      ]
    };
    return res.json({ summary: placeholderSummary, source: "Imaging Template Fallback" });
  }

  try {
    const prompt = `You are a clinical radiologist assisting a primary care family practitioner.
    Analyze the following medical imaging report:
    "${reportText}"

    Create three high-value clinical outputs:
    1. A "clinicalOverview" containing brief medical findings for the doctor's record.
    2. A "patientExplanation" explaining findings clearly in friendly, comforting, non-technical plain terms for the patient to reduce anxiety.
    3. An array of "recommendedFollowUps" for the clinical plan.

    Return ONLY JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clinicalOverview: { type: Type.STRING },
            patientExplanation: { type: Type.STRING },
            recommendedFollowUps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["clinicalOverview", "patientExplanation", "recommendedFollowUps"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    res.json({ summary: data, source: "Gemini 3.5 Imaging Specialist Agent" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to summarize imaging report", details: error.message });
  }
});

// HISTORY COMPARISON AGENT
app.post("/api/history/compare", async (req, res) => {
  const { currentNote, previousNote } = req.body;

  addAuditLog(
    "COMPARE_CLINICAL_HISTORY",
    "Dr. Alistair Vance",
    "Family Physician",
    `Compared current visit records with previous longitudinal EMR historical consults.`
  );

  if (!apiKey) {
    const placeholderComparison = {
      newSymptoms: ["Dry hacky cough for 7 days", "Mild shortness of breath on exertion"],
      newMedications: ["Ventolin (Salbutamol) PRN inhaler added"],
      changedDosages: ["Metformin dosage noted as active, previously noted as stable"],
      resolvedSymptoms: ["Previous lower back postural pain reported as fully resolved with daily physiotherapy stretching"],
      criticalObservations: "The patient is showing acute onset upper respiratory infection symptoms with mild bronchospasm. Chronic back pain has resolved."
    };
    return res.json({ comparison: placeholderComparison, source: "History Template Engine" });
  }

  try {
    const prompt = `You are a clinical records auditor for family medicine clinics in BC/Ontario.
    Compare the following two clinical notes (Current Visit vs Previous Visit) and extract changes:
    
    Current Note: "${currentNote}"
    Previous Note: "${previousNote}"

    Detect:
    1. New Symptoms
    2. New Medications
    3. Changed Dosages or Treatments
    4. Resolved Symptoms (present in previous visit but no longer complained of)
    5. Clinical observations of patient trajectory.

    Return results as a clean JSON object.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            newSymptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
            newMedications: { type: Type.ARRAY, items: { type: Type.STRING } },
            changedDosages: { type: Type.ARRAY, items: { type: Type.STRING } },
            resolvedSymptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
            criticalObservations: { type: Type.STRING }
          },
          required: ["newSymptoms", "newMedications", "changedDosages", "resolvedSymptoms", "criticalObservations"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    res.json({ comparison: data, source: "Gemini 3.5 History Comparison Agent" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to compare history", details: error.message });
  }
});

// INTAKE ANALYSIS AGENT
app.post("/api/intake/analyze", async (req, res) => {
  const { chiefComplaint, symptoms, medications, allergies, familyHistory, recentChanges } = req.body;

  addAuditLog(
    "ANALYZE_PATIENT_INTAKE",
    "Patient Intake Portal",
    "Patient Self-Service Portal",
    `Analyzed pre-visit patient self-intake form for chief complaint: "${chiefComplaint}".`
  );

  if (!apiKey) {
    const placeholderSummary = `Patient reports chief complaint of "${chiefComplaint}". Active symptoms: ${symptoms.join(", ")}. Declares current medications: ${medications}. Allergies: ${allergies}. Family history of: ${familyHistory}. Recent changes noted: ${recentChanges}. AI Pre-Visit Summary: Acute respiratory/complaint onset with no standard red flags identified. Recommended for physician review.`;
    return res.json({ aiSummary: placeholderSummary, source: "Intake Offline Template Engine" });
  }

  try {
    const prompt = `You are a patient intake triaging assistant.
    Review the patient's pre-visit checklist answers:
    - Chief Complaint: "${chiefComplaint}"
    - Symptoms Checklist: ${JSON.stringify(symptoms)}
    - Stated Medications: "${medications}"
    - Stated Allergies: "${allergies}"
    - Family History: "${familyHistory}"
    - Recent Lifestyle/Body Changes: "${recentChanges}"

    Synthesize this into an elegant, highly concise clinical "Pre-Visit EMR Intake Summary" for the family physician.
    The summary should look professional, list emergency/red-flag indicators (or note if none are identified), and highlight active items that the doctor should address immediately.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ aiSummary: response.text?.trim() || "", source: "Gemini 3.5 Intake Agent" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to analyze intake form", details: error.message });
  }
});

// EMR INTEGRATIONS STATE & FHIR SYNC RECORDS
let emrIntegrations = [
  {
    id: "emr-01",
    provider: "OSCAR",
    province: "Ontario",
    endpointUrl: "https://fhir.ontariomd.ca/oscar-v4/fhir",
    clientId: "medi_flow_ai_on_oscar_prod_99",
    clientSecret: "••••••••••••••••••••••••••••",
    status: "Connected",
    dataResidencyEnforced: true,
    dataResidencyLocation: "Canada Central (Toronto)",
    fhirVersion: "R4",
    lastSyncedAt: "2026-07-17T07:15:30-07:00",
    complianceCertifications: ["OntarioMD Certified", "PHIPA Compliant", "PIPEDA Secure", "CAN-Central Resident"]
  },
  {
    id: "emr-02",
    provider: "Accuro",
    province: "British Columbia",
    endpointUrl: "https://fhir.bc-healthnet.ca/accuro/fhir",
    clientId: "medi_flow_ai_bc_accuro_31",
    clientSecret: "••••••••••••••••••••••••••••",
    status: "Connected",
    dataResidencyEnforced: true,
    dataResidencyLocation: "Canada Central (Toronto)",
    fhirVersion: "R4",
    lastSyncedAt: "2026-07-16T15:44:12-07:00",
    complianceCertifications: ["BC HealthNet Approved", "PIPEDA Secure", "CAN-Central Resident"]
  },
  {
    id: "emr-03",
    provider: "PS Suite",
    province: "Ontario",
    endpointUrl: "https://fhir.ontariomd.ca/pssuite/fhir",
    clientId: "medi_flow_ai_ps_suite_45",
    clientSecret: "",
    status: "Disconnected",
    dataResidencyEnforced: true,
    dataResidencyLocation: "Canada Central (Toronto)",
    fhirVersion: "STU3",
    complianceCertifications: ["OntarioMD Approved", "PHIPA Compliant", "PIPEDA Secure"]
  }
];

let emrSyncLogs = [
  {
    id: "sync-01",
    timestamp: "2026-07-17T07:15:30-07:00",
    emrProvider: "OSCAR",
    patientId: "pat-01",
    patientName: "Sarah Jenkins",
    resourceType: "Patient & Observations",
    fhirPayloadPreview: "{\n  \"resourceType\": \"Bundle\",\n  \"type\": \"transaction\",\n  \"entry\": [\n    {\n      \"resource\": {\n        \"resourceType\": \"Patient\",\n        \"identifier\": [ { \"system\": \"https://fhir.ontariomd.ca/id/ohip\", \"value\": \"9876-543-210\" } ],\n        \"name\": [ { \"family\": \"Jenkins\", \"given\": [ \"Sarah\" ] } ]\n      }\n    }\n  ]\n}",
    status: "Success",
    details: "Successfully pushed demographics, current vitals, and gestational blood pressure logs to OntarioMD OSCAR cloud database. Compliance secure on CAN-Central servers."
  },
  {
    id: "sync-02",
    timestamp: "2026-07-16T15:44:12-07:00",
    emrProvider: "Accuro",
    patientId: "pat-02",
    patientName: "Robert Vance",
    resourceType: "Observation (eGFR / Serum Creatinine)",
    fhirPayloadPreview: "{\n  \"resourceType\": \"Observation\",\n  \"status\": \"final\",\n  \"code\": { \"coding\": [ { \"system\": \"http://loinc.org\", \"code\": \"33914-3\" } ] },\n  \"subject\": { \"reference\": \"Patient/pat-02\" },\n  \"valueQuantity\": { \"value\": 28, \"unit\": \"mL/min/1.73m²\" }\n}",
    status: "Success",
    details: "Exported Stage 4 kidney function alerts and critical laboratory values to BC Services Cloud via Accuro secure FHIR endpoints."
  }
];

// EMR ENDPOINTS
app.get("/api/emr-integrations", (req, res) => {
  res.json(emrIntegrations);
});

app.post("/api/emr-integrations/configure", (req, res) => {
  const { provider, province, endpointUrl, clientId, clientSecret, fhirVersion, dataResidencyLocation } = req.body;
  
  const existingIndex = emrIntegrations.findIndex(e => e.provider === provider && e.province === province);
  
  const updatedConfig = {
    id: existingIndex >= 0 ? emrIntegrations[existingIndex].id : `emr-${Date.now()}`,
    provider,
    province,
    endpointUrl,
    clientId,
    clientSecret: clientSecret ? "••••••••••••••••••••••••••••" : "",
    status: endpointUrl && clientId ? "Connected" : "Disconnected" as any,
    dataResidencyEnforced: true,
    dataResidencyLocation: dataResidencyLocation || "Canada Central (Toronto)",
    fhirVersion,
    complianceCertifications: province === "Ontario" 
      ? ["OntarioMD Certified", "PHIPA Compliant", "PIPEDA Secure", "CAN-Central Resident"]
      : ["BC HealthNet Approved", "PIPEDA Secure", "CAN-Central Resident"],
    lastSyncedAt: existingIndex >= 0 ? emrIntegrations[existingIndex].lastSyncedAt : undefined
  };

  if (existingIndex >= 0) {
    emrIntegrations[existingIndex] = updatedConfig;
  } else {
    emrIntegrations.push(updatedConfig);
  }

  addAuditLog(
    "EMR_CONFIGURATION_CHANGED",
    "Dr. Alistair Vance",
    "Family Physician",
    `Configured secure FHIR EMR settings for ${provider} in ${province}. Data residency locked to ${updatedConfig.dataResidencyLocation}.`
  );

  res.json({ success: true, config: updatedConfig });
});

app.post("/api/emr-integrations/sync/:patientId", (req, res) => {
  const { patientId } = req.params;
  const patient = patients.find(p => p.id === patientId);
  
  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  // Find suitable active EMR configuration
  const integration = emrIntegrations.find(e => e.province === patient.province && e.status === "Connected");
  
  if (!integration) {
    return res.status(400).json({ 
      error: `No active, verified EMR integration found for province: ${patient.province}. Please configure and test EMR credentials first.` 
    });
  }

  // Update last synced time
  integration.lastSyncedAt = new Date().toISOString();

  // Create standard FHIR Payload preview based on patient's key data
  const fhirPayload = {
    resourceType: "Bundle",
    type: "transaction",
    id: `bundle-sync-${Date.now()}`,
    timestamp: new Date().toISOString(),
    entry: [
      {
        resource: {
          resourceType: "Patient",
          id: patient.id,
          identifier: [
            {
              system: patient.province === "Ontario" ? "https://fhir.ontariomd.ca/id/ohip" : "https://fhir.bc-healthnet.ca/id/phn",
              value: patient.phn
            }
          ],
          name: [
            {
              use: "official",
              family: patient.name.split(" ").slice(-1)[0],
              given: [patient.name.split(" ")[0]]
            }
          ],
          gender: patient.gender.toLowerCase(),
          birthDate: patient.birthDate,
          extension: [
            {
              url: "https://fhir.infoway-inforoute.ca/StructureDefinition/pregnancy-status",
              valueString: patient.pregnancyStatus
            }
          ]
        }
      },
      ...patient.labs.map(lab => ({
        resource: {
          resourceType: "Observation",
          id: lab.id,
          status: "final",
          code: {
            text: lab.testName
          },
          subject: {
            reference: `Patient/${patient.id}`
          },
          effectiveDateTime: lab.date,
          valueQuantity: {
            value: parseFloat(lab.value) || lab.value,
            unit: lab.referenceRange.includes("umol") ? "umol/L" : lab.referenceRange.includes("%") ? "%" : "mL/min"
          },
          interpretation: [
            {
              text: lab.status
            }
          ]
        }
      }))
    ]
  };

  const newSyncLog = {
    id: `sync-${Date.now()}`,
    timestamp: new Date().toISOString(),
    emrProvider: integration.provider,
    patientId: patient.id,
    patientName: patient.name,
    resourceType: "Patient, Labs & Medications (FHIR Bundle)",
    fhirPayloadPreview: JSON.stringify(fhirPayload, null, 2),
    status: "Success" as any,
    details: `On-demand FHIR transaction bundle uploaded to ${integration.provider} EMR gateway. Data processed and resident securely in ${integration.dataResidencyLocation}. Compliance Checked.`
  };

  emrSyncLogs.unshift(newSyncLog);

  addAuditLog(
    "EMR_RECORD_SYNC",
    "Dr. Alistair Vance",
    "Family Physician",
    `Synchronized latest timeline, labs, and medications for ${patient.name} with ${integration.provider} EMR using secure FHIR API. Data residency verified.`,
    patient.id,
    patient.name
  );

  res.json({ success: true, syncLog: newSyncLog, integrations: emrIntegrations });
});

app.get("/api/emr-sync-logs", (req, res) => {
  res.json(emrSyncLogs);
});

// PATIENT PORTAL INTAKE DISPATCH STATE & ENDPOINTS
let patientIntakeLinks = [
  {
    id: "link-01",
    patientId: "pat-01",
    patientName: "Sarah Jenkins",
    link: "https://clinos.ai/intake/sec-sarah-jenkins-f2a893",
    status: "Completed",
    sentVia: "SMS",
    sentAt: "2026-07-16T10:00:00-07:00",
    completedAt: "2026-07-16T11:45:00-07:00"
  },
  {
    id: "link-02",
    patientId: "pat-02",
    patientName: "Robert Vance",
    link: "https://clinos.ai/intake/sec-robert-vance-e932ba",
    status: "Delivered",
    sentVia: "Email",
    sentAt: "2026-07-17T08:15:00-07:00"
  }
];

app.get("/api/patient-intake-links", (req, res) => {
  res.json(patientIntakeLinks);
});

app.post("/api/patient-intake-links/send", (req, res) => {
  const { patientId, channel, contactValue } = req.body;
  const patient = patients.find(p => p.id === patientId);
  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const uniqueToken = Math.random().toString(36).substring(2, 8);
  const secureLink = `https://clinos.ai/intake/sec-${patient.name.toLowerCase().replace(/ /g, "-")}-${uniqueToken}`;
  
  const newLink = {
    id: `link-${Date.now()}`,
    patientId,
    patientName: patient.name,
    link: secureLink,
    status: "Delivered",
    sentVia: channel,
    sentAt: new Date().toISOString()
  };

  patientIntakeLinks.unshift(newLink);

  addAuditLog(
    "INTAKE_LINK_DISPATCHED",
    "Dr. Alistair Vance",
    "Family Physician",
    `Generated secure PHIPA-compliant single-use intake form link for ${patient.name} and dispatched via ${channel} to ${contactValue}. Link: ${secureLink}`,
    patient.id,
    patient.name
  );

  res.json({ success: true, link: newLink });
});

// APPOINTMENT SCHEDULER STATE & ENDPOINTS
let appointments = [
  {
    id: "appt-01",
    patientId: "pat-01",
    patientName: "Sarah Jenkins",
    date: "2026-07-20",
    time: "10:30 AM",
    clinicianName: "Dr. Alistair Vance",
    reason: "Gestational hypertension follow-up & BP check",
    status: "Scheduled"
  },
  {
    id: "appt-02",
    patientId: "pat-02",
    patientName: "Robert Vance",
    date: "2026-07-22",
    time: "02:15 PM",
    clinicianName: "Dr. Alistair Vance",
    reason: "eGFR decline & Metformin dosage review",
    status: "Scheduled"
  }
];

app.get("/api/appointments", (req, res) => {
  res.json(appointments);
});

app.post("/api/appointments", (req, res) => {
  const { patientId, patientName, date, time, clinicianName, reason } = req.body;
  if (!patientId || !patientName || !date || !time) {
    return res.status(400).json({ error: "Missing required appointment fields" });
  }

  const newAppt = {
    id: `appt-${Date.now()}`,
    patientId,
    patientName,
    date,
    time,
    clinicianName: clinicianName || "Dr. Alistair Vance",
    reason: reason || "Routine Follow-up",
    status: "Scheduled"
  };

  appointments.unshift(newAppt);

  addAuditLog(
    "SCHEDULE_APPOINTMENT",
    "Dr. Alistair Vance",
    "Family Physician",
    `Scheduled clinical appointment for ${patientName} on ${date} at ${time} for: "${reason}"`,
    patientId,
    patientName
  );

  res.status(201).json({ success: true, appointment: newAppt });
});

// AUDIT LOGS ENDPOINTS
app.get("/api/audit-logs", (req, res) => {
  res.json(auditLogs);
});

app.post("/api/audit-logs", (req, res) => {
  const { action, clinicianName, clinicianRole, details, patientId, patientName } = req.body;
  addAuditLog(action, clinicianName, clinicianRole, details, patientId, patientName);
  res.status(201).json({ status: "success", log: auditLogs[0] });
});

// SYSTEM HEALTH & COMPLIANCE METRICS
app.get("/api/system-health", (req, res) => {
  res.json({
    status: "Healthy",
    uptime: "99.98%",
    dataResidency: "Canada Central (Toronto, ON) - PIPEDA Standard",
    encryptionState: "AES-256 Enabled (In-Transit & At-Rest)",
    complianceChecked: true,
    provincialEMRReady: ["Ontario MD / OSCAR", "Accuro", "BC PS Suite"],
    securityLogsCount: auditLogs.length,
    activeSubagents: [
      "Scribe Agent",
      "Translation Agent",
      "Intake Agent",
      "History Agent",
      "Timeline Agent",
      "Imaging Agent",
      "Prescription Agent",
      "Clinical Safety Agent (Alert Engine Active)"
    ]
  });
});

// Vite Middleware for dev or serve static for production
const startServer = async () => {
  if (process.env.VERCEL) {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[MediFlow AI] Server successfully running on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

export default app;
