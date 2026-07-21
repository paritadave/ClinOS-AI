import { Patient, AuditLog } from "../types";

export const FALLBACK_PATIENTS: Patient[] = [
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

export const FALLBACK_AUDIT_LOGS: AuditLog[] = [
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

export const FALLBACK_SYSTEM_HEALTH = {
  status: "Healthy",
  uptime: "99.98%",
  dataResidency: "Canada Central (Toronto, ON) - PIPEDA Standard",
  encryptionState: "AES-256 Enabled (In-Transit & At-Rest)",
  complianceChecked: true,
  provincialEMRReady: ["Ontario MD / OSCAR", "Accuro", "BC PS Suite"],
  securityLogsCount: 2,
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
};
