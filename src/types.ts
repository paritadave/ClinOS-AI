export enum UserRole {
  PHYSICIAN = "Family Physician",
  NURSE_PRACTITIONER = "Nurse Practitioner",
  WALK_IN_CLINICIAN = "Walk-In Clinician",
  SPECIALIST = "Specialist",
  ALLIED_HEALTH = "Allied Health Professional",
  ADMIN = "Administrator",
}

export interface Patient {
  id: string;
  name: string;
  birthDate: string;
  phn: string; // Provincial Health Number (e.g., OHIP, BC Services Card)
  province: "Ontario" | "British Columbia" | "Alberta" | "Quebec" | "Other";
  gender: string;
  pregnancyStatus: "Pregnant" | "Postpartum" | "Breastfeeding" | "None";
  allergies: string[];
  conditions: string[];
  currentMedications: Medication[];
  labs: LabResult[];
  imaging: ImagingResult[];
  referrals: Referral[];
  procedures: string[];
  symptomTrends?: SymptomTrend[];
  medicationHistory?: MedicationHistory[];
  soapNotes?: SOAPNote[];
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  status: "Active" | "Discontinued" | "Changed";
  prescribedBy: string;
  startDate: string;
  notes?: string;
  adherence?: "Good" | "Poor" | "Unknown";
}

export interface LabResult {
  id: string;
  testName: string;
  date: string;
  value: string;
  referenceRange: string;
  status: "Normal" | "Abnormal" | "Critical";
}

export interface ImagingResult {
  id: string;
  type: "MRI" | "CT" | "X-Ray" | "Ultrasound";
  area: string;
  date: string;
  status: "Ordered" | "Scheduled" | "Completed" | "Reviewed";
  report?: string;
  summary?: string;
}

export interface Referral {
  id: string;
  specialty: string;
  consultant: string;
  date: string;
  status: "Pending" | "Completed";
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  clinicianId: string;
  clinicianName: string;
  clinicianRole: UserRole;
  patientId?: string;
  patientName?: string;
  details: string;
  ipAddress: string;
  complianceChecked: boolean;
}

export interface SOAPNote {
  id: string;
  date: string;
  clinicianId: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  summary?: string;
}

export interface SafetyAlert {
  id?: string;
  type: "warning" | "danger" | "info";
  title: string;
  message: string;
  category: "Pregnancy" | "Renal Function" | "Drug Interaction" | "Lactation" | "Condition Conflict" | "Allergy";
  reviewStatus?: "Pending" | "Acknowledged" | "Resolved";
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  clinicianName: string;
  reason: string;
  status: "Scheduled" | "Completed" | "Cancelled";
}

export interface IntakeSummary {
  chiefComplaint: string;
  symptoms: string[];
  currentMedications: string[];
  allergies: string[];
  familyHistory: string;
  recentChanges: string;
  aiSummary: string;
}

export interface SymptomTrend {
  date: string;
  severity: number; // 0 to 10 score
  symptomName: string;
  notes?: string;
  metricValue?: number; // e.g. blood pressure, blood glucose
  metricUnit?: string;
}

export interface MedicationHistory {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  status: "Active" | "Discontinued" | "Changed";
  prescribedBy: string;
  startDate: string;
  endDate?: string;
  changeReason?: string;
}

export interface EMRIntegration {
  id: string;
  provider: "OSCAR" | "Accuro" | "PS Suite";
  province: "Ontario" | "British Columbia";
  endpointUrl: string;
  clientId: string;
  clientSecret: string;
  status: "Connected" | "Pending" | "Error" | "Disconnected";
  dataResidencyEnforced: boolean;
  dataResidencyLocation: string; // "Canada Central (Toronto)" or "Canada West (Vancouver)"
  fhirVersion: "R4" | "STU3" | "DSTU2";
  lastSyncedAt?: string;
  complianceCertifications: string[]; // e.g. ["OntarioMD Certified", "PHIPA Compliant", "PIPEDA Secure"]
}

export interface EMRSyncLog {
  id: string;
  timestamp: string;
  emrProvider: string;
  patientId: string;
  patientName: string;
  resourceType: string; // e.g., "Patient", "Observation", "MedicationRequest"
  fhirPayloadPreview: string;
  status: "Success" | "Failed";
  details: string;
}

export interface PatientIntakeLink {
  id: string;
  patientId: string;
  patientName: string;
  link: string;
  status: string;
  sentVia: string;
  sentAt: string;
  completedAt?: string;
}

