"use client";

import { useCallback, useEffect, useState } from "react";

import { DEMO_PATIENTS, DEMO_RESET_EVENT } from "@/lib/demo";

export const selectClass = "h-12 w-full rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const selectionStorageKey = "chex-selected-patient-v1";
const defaultPatientId = "patient-eu-001";

function validPatientId(value: string | null): value is string {
  return value !== null && DEMO_PATIENTS.some((patient) => patient.id === value);
}

/** Also called by the shell so reset works when no patient form is mounted. */
export function resetSelectedPatient() {
  try {
    window.sessionStorage.removeItem(selectionStorageKey);
  } catch {
    // Browser storage can be unavailable; mounted forms still reset via the event.
  }
  const url = new URL(window.location.href);
  if (url.searchParams.has("patient")) {
    url.searchParams.delete("patient");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }
}

export function useSelectedPatient() {
  const [patientId, updatePatientId] = useState(defaultPatientId);
  const setPatientId = useCallback((value: string) => {
    if (!validPatientId(value)) return;
    updatePatientId(value);
    try {
      window.sessionStorage.setItem(selectionStorageKey, value);
    } catch {
      // Selection remains usable on this page when session storage is disabled.
    }
    // Keep an existing explicit patient link aligned with a deliberate selection.
    const url = new URL(window.location.href);
    if (url.searchParams.has("patient") && url.searchParams.get("patient") !== value) {
      url.searchParams.set("patient", value);
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  useEffect(() => {
    const restore = () => {
      const requested = new URLSearchParams(window.location.search).get("patient");
      let stored: string | null = null;
      try {
        stored = window.sessionStorage.getItem(selectionStorageKey);
      } catch {
        // A valid explicit URL still works when session storage is unavailable.
      }
      setPatientId(validPatientId(requested) ? requested : validPatientId(stored) ? stored : defaultPatientId);
    };
    const reset = () => {
      resetSelectedPatient();
      updatePatientId(defaultPatientId);
    };
    restore();
    window.addEventListener("popstate", restore);
    window.addEventListener(DEMO_RESET_EVENT, reset);
    return () => {
      window.removeEventListener("popstate", restore);
      window.removeEventListener(DEMO_RESET_EVENT, reset);
    };
  }, [setPatientId]);
  return { patientId, setPatientId, patient: DEMO_PATIENTS.find((patient) => patient.id === patientId) };
}

export function PatientSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <label htmlFor="selected-patient" className="text-sm font-medium">Patient</label>
      <select id="selected-patient" value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
        {DEMO_PATIENTS.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · {patient.region}</option>)}
      </select>
    </div>
  );
}

export function ResponseDetails({ data }: { data: unknown }) {
  return (
    <details className="mt-5 rounded-lg border border-border bg-background text-sm">
      <summary className="cursor-pointer px-4 py-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View technical response</summary>
      <pre className="max-h-80 overflow-auto border-t border-border p-4 text-xs leading-relaxed">{JSON.stringify(data, null, 2)}</pre>
    </details>
  );
}
