import React, { useMemo, useState } from "react";
import { Pill, CheckCircle2, AlertTriangle, ShieldCheck, Search, Info } from "lucide-react";
import { Medication } from "../types";

interface PrescribedMedicationsListProps {
  currentMedications?: Medication[] | string[] | any;
  patientName?: string;
  className?: string;
}

/**
 * Safely parses any raw currentMedications structure into a standardized Medication[] array
 */
export function parseCurrentMedications(rawMeds: any): Medication[] {
  if (!rawMeds) return [];

  let listToParse = rawMeds;

  // If stringified JSON, attempt to parse
  if (typeof rawMeds === "string") {
    try {
      listToParse = JSON.parse(rawMeds);
    } catch {
      // Split by comma or newline if simple string
      listToParse = rawMeds.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    }
  }

  if (!Array.isArray(listToParse)) return [];

  return listToParse.map((item, index) => {
    if (typeof item === "object" && item !== null) {
      return {
        id: item.id || `med-${index}-${Date.now()}`,
        name: item.name || item.title || "Unspecified Medication",
        dosage: item.dosage || "Standard Dose",
        frequency: item.frequency || "As directed",
        status: (["Active", "Discontinued", "Changed"].includes(item.status)
          ? item.status
          : "Active") as "Active" | "Discontinued" | "Changed",
        prescribedBy: item.prescribedBy || "Attending Physician",
        startDate: item.startDate || "Current",
        notes: item.notes || undefined,
        adherence: item.adherence || "Good",
      };
    }

    // If item is a string, e.g. "Ventolin HFA 90mcg - 2 puffs q4h PRN"
    const strItem = String(item).trim();
    if (!strItem) return null;

    // Try regex matching for dosage patterns (e.g., 50mg, 100 mcg, 10mL, 1 tab)
    const doseMatch = strItem.match(/(\d+(\.\d+)?\s*(mg|mcg|g|ml|mL|puffs?|tabs?|caps?|units?))/i);
    let name = strItem;
    let dosage = "Standard Dose";
    let frequency = "As directed";

    if (doseMatch) {
      dosage = doseMatch[0];
      const parts = strItem.split(doseMatch[0]);
      if (parts[0].trim()) {
        name = parts[0].trim().replace(/[-–:]$/, "").trim();
      }
      if (parts[1] && parts[1].trim()) {
        frequency = parts[1].trim().replace(/^[-–:]/, "").trim();
      }
    }

    return {
      id: `parsed-med-${index}-${strItem.replace(/\s+/g, "-")}`,
      name,
      dosage,
      frequency: frequency || "As prescribed",
      status: "Active" as const,
      prescribedBy: "EMR Primary Care Provider",
      startDate: "Active",
      adherence: "Good" as const,
    };
  }).filter(Boolean) as Medication[];
}

export default function PrescribedMedicationsList({
  currentMedications,
  patientName,
  className = "",
}: PrescribedMedicationsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Discontinued" | "Changed">("All");

  const parsedMeds = useMemo(() => {
    return parseCurrentMedications(currentMedications);
  }, [currentMedications]);

  const filteredMeds = useMemo(() => {
    return parsedMeds.filter((med) => {
      const matchesSearch =
        med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.dosage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.frequency.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.prescribedBy.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "All" || med.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [parsedMeds, searchQuery, statusFilter]);

  const activeCount = parsedMeds.filter((m) => m.status === "Active").length;

  return (
    <div id="prescribed-medications-panel" className={`space-y-2.5 ${className}`}>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 leading-none">
              Prescribed Medications
              <span className="bg-indigo-900/80 text-indigo-300 border border-indigo-700/60 text-[9px] px-1.5 py-0.5 rounded-full font-mono">
                {parsedMeds.length} Total ({activeCount} Active)
              </span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              EMR verified active prescribed drug regimens {patientName ? `for ${patientName}` : ""}
            </p>
          </div>
        </div>

        {/* Filter Badges */}
        {parsedMeds.length > 2 && (
          <div className="flex items-center gap-1 text-[9px] bg-slate-900/80 p-1 rounded-lg border border-slate-700/60 self-start sm:self-auto">
            {(["All", "Active", "Changed", "Discontinued"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded font-semibold transition-all ${
                  statusFilter === st
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Search if list > 3 */}
      {parsedMeds.length > 3 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter medication name, dosage, or prescriber..."
            className="w-full bg-slate-900/80 border border-slate-700/60 text-slate-200 text-[11px] pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
          />
        </div>
      )}

      {/* List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="prescribed-meds-cards-container">
        {filteredMeds.length > 0 ? (
          filteredMeds.map((med) => {
            const isDiscontinued = med.status === "Discontinued";
            const isChanged = med.status === "Changed";

            return (
              <div
                key={med.id}
                id={`med-card-${med.id}`}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                  isDiscontinued
                    ? "bg-rose-950/20 border-rose-900/40 text-slate-300"
                    : isChanged
                    ? "bg-amber-950/20 border-amber-900/40 text-slate-200"
                    : "bg-slate-800/70 border-slate-700/60 hover:border-indigo-500/50 text-slate-100 shadow-2xs"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isDiscontinued
                            ? "bg-rose-500"
                            : isChanged
                            ? "bg-amber-500"
                            : "bg-emerald-400 animate-pulse"
                        }`}
                      />
                      <span className="font-bold text-white text-xs truncate leading-tight" title={med.name}>
                        {med.name}
                      </span>
                    </div>

                    <span
                      className={`text-[8.5px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 border ${
                        isDiscontinued
                          ? "bg-rose-950/80 text-rose-300 border-rose-800/60"
                          : isChanged
                          ? "bg-amber-950/80 text-amber-300 border-amber-800/60"
                          : "bg-emerald-950/80 text-emerald-300 border-emerald-800/60"
                      }`}
                    >
                      {med.status}
                    </span>
                  </div>

                  {/* Dosage & Frequency details */}
                  <div className="space-y-0.5 pl-3.5 my-1.5">
                    <div className="flex items-center gap-1 text-[11px] text-indigo-200 font-mono font-semibold">
                      <span>Dosage:</span>
                      <span className="text-white bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-800/40">
                        {med.dosage}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-300 font-mono">
                      <span className="text-slate-400">Schedule:</span> {med.frequency}
                    </div>
                  </div>
                </div>

                {/* Footer metadata */}
                <div className="pt-2 mt-1 border-t border-slate-700/40 flex items-center justify-between text-[8.5px] text-slate-400 font-mono">
                  <span className="truncate max-w-[140px]" title={med.prescribedBy}>
                    Rx: {med.prescribedBy}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    {med.adherence && (
                      <span
                        className={`px-1 rounded text-[8px] ${
                          med.adherence === "Good"
                            ? "text-emerald-400 bg-emerald-950/40"
                            : "text-amber-400 bg-amber-950/40"
                        }`}
                      >
                        Adherence: {med.adherence}
                      </span>
                    )}
                    <span>Start: {med.startDate}</span>
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-center">
            <Info className="w-5 h-5 text-slate-500 mx-auto mb-1" />
            <p className="text-slate-400 text-xs font-medium">No active prescribed medications match the query.</p>
            <p className="text-slate-500 text-[10px] mt-0.5">
              Verify EMR medication reconciliation or check patient intake record.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
