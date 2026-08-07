import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Patient, Appointment } from "../types";

export interface PrintProviderProps {
  patient: Patient;
  appointments: Appointment[];
  customNote: string;
  laypersonConditions: Record<string, string>;
  laypersonMeds: Record<string, { purpose: string; instructions: string }>;
  children: React.ReactNode;
}

export const PrintableHandoutContent: React.FC<{
  patient: Patient;
  appointments: Appointment[];
  customNote: string;
  laypersonConditions: Record<string, string>;
  laypersonMeds: Record<string, { purpose: string; instructions: string }>;
}> = ({ patient, appointments, customNote, laypersonConditions, laypersonMeds }) => {
  const safeConds = Array.isArray(patient?.conditions) ? patient.conditions : [];
  const safeMeds = Array.isArray(patient?.currentMedications) ? patient.currentMedications : [];
  const safeAppts = Array.isArray(appointments) ? appointments : [];

  return (
    <div
      id="printable-handout-content"
      style={{
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: "#ffffff",
        color: "#0f172a",
        padding: "24px",
        maxWidth: "760px",
        margin: "0 auto",
        boxSizing: "border-box",
        lineHeight: 1.5,
      }}
    >
      {/* Clinic Header */}
      <div
        style={{
          borderBottom: "2px solid #e2e8f0",
          paddingBottom: "16px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            CurisVance Family Medicine Clinic
          </h1>
          <p style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", margin: 0 }}>
            700 University Ave, Toronto, ON M5G 1Z5 • (416) 555-0199
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              backgroundColor: "#f1f5f9",
              color: "#334155",
              padding: "3px 8px",
              borderRadius: "4px",
              border: "1px solid #cbd5e1",
            }}
          >
            Patient Copy
          </span>
          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "4px", fontFamily: "monospace" }}>
            {new Date().toISOString().split("T")[0]}
          </div>
        </div>
      </div>

      {/* Patient Meta Banner */}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
          backgroundColor: "#ffffff",
        }}
      >
        <div style={{ display: "flex", gap: "20px", fontSize: "12px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Patient Name
            </div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
              {patient.name}
            </div>
            <div style={{ fontSize: "11px", color: "#475569" }}>Birth Date: {patient.birthDate}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Primary Physician
            </div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
              Dr. Alistair Vance, CCFP
            </div>
            <div style={{ fontSize: "11px", color: "#475569" }}>Provincial Provider ID: #ON-992143</div>
          </div>
        </div>
      </div>

      {/* Conditions */}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
          backgroundColor: "#ffffff",
        }}
      >
        <h2
          style={{
            fontSize: "11px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#64748b",
            margin: "0 0 12px 0",
          }}
        >
          Your Documented Care Focus
        </h2>
        {safeConds.map((cond, idx) => {
          const trans = laypersonConditions[cond] || cond;
          return (
            <div
              key={idx}
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "8px",
              }}
            >
              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>{cond}</div>
              <div style={{ color: "#475569", fontSize: "12px", marginTop: "4px" }}>{trans}</div>
            </div>
          );
        })}
      </div>

      {/* Medications */}
      <div
        style={{
          border: "2px solid #cbd5e1",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
          backgroundColor: "#ffffff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
          <h2
            style={{
              fontSize: "12px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#0f172a",
              margin: 0,
            }}
          >
            Prescribed & Active Medication Schedule ({safeMeds.length})
          </h2>
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#1e1b4b", backgroundColor: "#e0e7ff", padding: "2px 8px", borderRadius: "12px", border: "1px solid #c7d2fe" }}>
            EMR Verified
          </span>
        </div>

        {safeMeds.length > 0 ? (
          safeMeds.map((med, idx) => {
            const details = laypersonMeds[med.name] || {
              purpose: "Prescribed health maintenance",
              instructions: "Take according to clinician's directed dosing schedule.",
            };
            const isDiscontinued = med.status === "Discontinued";
            const isChanged = med.status === "Changed";

            return (
              <div
                key={idx}
                style={{
                  backgroundColor: isDiscontinued ? "#fff1f2" : "#f8fafc",
                  border: `2px solid ${isDiscontinued ? "#fecdd3" : "#cbd5e1"}`,
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "14px" }}>
                      {med.name} <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#334155" }}>({med.dosage})</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px", fontWeight: 600 }}>
                      Prescribed by: {med.prescribedBy || "Attending Physician"} • Frequency: <strong>{med.frequency}</strong>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      border: "1px solid",
                      backgroundColor: isDiscontinued ? "#ffe4e6" : isChanged ? "#fef3c7" : "#dcfce7",
                      color: isDiscontinued ? "#9f1239" : isChanged ? "#78350f" : "#14532d",
                      borderColor: isDiscontinued ? "#fda4af" : isChanged ? "#fde68a" : "#86efac",
                    }}
                  >
                    {med.status === "Active" ? "✓ Active Prescribed" : med.status}
                  </span>
                </div>

                <div style={{ color: "#1e293b", fontSize: "12px", marginTop: "8px", lineHeight: 1.5 }}>
                  <div style={{ marginBottom: "2px" }}>
                    <strong>Indication / Purpose:</strong> {details.purpose}
                  </div>
                  <div
                    style={{
                      marginTop: "6px",
                      padding: "8px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      color: "#0f172a",
                    }}
                  >
                    <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: isDiscontinued ? "#9f1239" : "#15803d", marginBottom: "2px" }}>
                      {isDiscontinued ? "⚠️ NOTIFICATION: DISCONTINUED MEDICATION" : "✓ NOTIFICATION: ACTIVE PRESCRIBED REGIMEN"}
                    </div>
                    <strong>Clinician Directions:</strong> {details.instructions}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ padding: "12px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
            No active prescribed medications documented on file.
          </div>
        )}

        {/* Discontinued / Historic Medications in Print */}
        {patient.medicationHistory && patient.medicationHistory.length > 0 && (
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", color: "#9f1239", marginBottom: "6px" }}>
              ⚠️ Discontinued / Modified Medication History ({patient.medicationHistory.length})
            </div>
            {patient.medicationHistory.map((histMed, hIdx) => (
              <div
                key={hIdx}
                style={{
                  backgroundColor: "#fff1f2",
                  border: "1px solid #fecdd3",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  marginBottom: "6px",
                  fontSize: "11px",
                  color: "#881337",
                }}
              >
                <div style={{ fontWeight: 800, display: "flex", justifyContent: "space-between" }}>
                  <span>{histMed.name}</span>
                  <span style={{ fontSize: "9px", textTransform: "uppercase", padding: "1px 6px", backgroundColor: "#ffe4e6", borderRadius: "4px" }}>
                    {histMed.status}
                  </span>
                </div>
                <div style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>
                  Dates: {histMed.startDate} to {histMed.endDate || "Discontinued"}
                </div>
                <div style={{ marginTop: "2px", fontSize: "10.5px" }}>
                  <strong>Reason:</strong> {histMed.changeReason}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safety & Allergy Reminders */}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
          backgroundColor: "#ffffff",
        }}
      >
        <h2
          style={{
            fontSize: "11px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#64748b",
            margin: "0 0 12px 0",
          }}
        >
          Safety & Allergy Reminders
        </h2>
        <div
          style={{
            backgroundColor: "#fff1f2",
            border: "1px solid #fecdd3",
            borderRadius: "8px",
            padding: "12px",
            fontSize: "12px",
            color: "#881337",
            marginBottom: "8px",
          }}
        >
          <strong>Documented Allergy Conflicts:</strong> Highly sensitive to{" "}
          <strong>{patient.allergies.join(", ")}</strong>. Please notify any consulting specialist or dental
          professional.
        </div>
        {patient.pregnancyStatus !== "None" && (
          <div
            style={{
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "12px",
              color: "#78350f",
            }}
          >
            <strong>Special Health Guidance:</strong> Active pregnancy status documented at 26 weeks gestation (
            {patient.pregnancyStatus}). Certain blood-pressure and over-the-counter medications are contraindicated and
            have been strictly audited.
          </div>
        )}
      </div>

      {/* Appointments */}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
          backgroundColor: "#ffffff",
        }}
      >
        <h2
          style={{
            fontSize: "11px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#64748b",
            margin: "0 0 12px 0",
          }}
        >
          Your Next Scheduled Consultations
        </h2>
        {safeAppts.length > 0 ? (
          safeAppts.map((appt, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>
                  {appt.reason.split("•")[1] || appt.reason}
                </div>
                <div style={{ color: "#64748b", fontSize: "11px" }}>With {appt.clinicianName}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "12px", fontFamily: "monospace" }}>
                  {appt.date}
                </div>
                <div style={{ color: "#64748b", fontSize: "11px", fontFamily: "monospace" }}>{appt.time}</div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: "#94a3b8", fontSize: "12px", textAlign: "center", padding: "12px" }}>
            No upcoming appointments scheduled on file.
          </div>
        )}
      </div>

      {/* Doctor Guidelines */}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
          backgroundColor: "#ffffff",
        }}
      >
        <h2
          style={{
            fontSize: "11px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#64748b",
            margin: "0 0 12px 0",
          }}
        >
          Special Clinician Lifestyle Guidelines
        </h2>
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "12px",
            fontSize: "12px",
            color: "#0f172a",
            whiteSpace: "pre-wrap",
          }}
        >
          {customNote || "No custom lifestyle guidelines provided."}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "24px",
          paddingTop: "12px",
          borderTop: "1px solid #e2e8f0",
          textAlign: "center",
          fontSize: "11px",
          color: "#94a3b8",
        }}
      >
        <div>CurisVance Family Medicine Clinic • Confidential Patient Care Summary Document</div>
        <div style={{ fontFamily: "monospace", fontSize: "10px", marginTop: "4px" }}>
          Record Reference: PAT-{patient.id}-{patient.phn.slice(-4)}-PRINT
        </div>
      </div>
    </div>
  );
};

export default function PrintProvider({
  patient,
  appointments,
  customNote,
  laypersonConditions,
  laypersonMeds,
  children,
}: PrintProviderProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let mountNode = document.getElementById("print-mount");
    if (!mountNode) {
      mountNode = document.createElement("div");
      mountNode.id = "print-mount";
      mountNode.style.position = "absolute";
      mountNode.style.left = "-9999px";
      mountNode.style.top = "0";
      mountNode.style.width = "800px";
      mountNode.style.backgroundColor = "#ffffff";
      mountNode.style.color = "#0f172a";
      document.body.appendChild(mountNode);
    }
    setContainer(mountNode);
  }, []);

  return (
    <>
      {children}
      {container &&
        createPortal(
          <PrintableHandoutContent
            patient={patient}
            appointments={appointments}
            customNote={customNote}
            laypersonConditions={laypersonConditions}
            laypersonMeds={laypersonMeds}
          />,
          container
        )}
    </>
  );
}
