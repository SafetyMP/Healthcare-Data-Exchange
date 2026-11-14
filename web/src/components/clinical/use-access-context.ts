"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type { CredentialProfile } from "@/lib/api";
import { DEMO_PATIENTS, DEMO_RESET_EVENT } from "@/lib/demo";

export type AccessPurpose = "treatment" | "research" | "derivative";
type AccessContext = { purpose: AccessPurpose; credential: CredentialProfile; credentialChosen: boolean };
const storageKey = "chex-access-context-v1";

export const requesterPresets: { value: CredentialProfile; label: string }[] = [
  { value: "eu-visiting", label: "EU visiting care team" },
  { value: "eu-home", label: "EU home care team" },
  { value: "us-home", label: "US home care team" },
  { value: "us-clinician", label: "US care team · limited cross-region access" },
];

export function isAccessPurpose(value: unknown): value is AccessPurpose {
  return value === "treatment" || value === "research" || value === "derivative";
}

export function isRequesterPreset(value: unknown): value is CredentialProfile {
  return value === "eu-visiting" || value === "eu-home" || value === "us-home" || value === "us-clinician";
}

function readStoredContext(): AccessContext | null {
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    const stored: unknown = raw ? JSON.parse(raw) : null;
    if (typeof stored !== "object" || stored === null) return null;
    const candidate = stored as Record<string, unknown>;
    if (!isAccessPurpose(candidate.purpose) || !isRequesterPreset(candidate.credential)) return null;
    return { purpose: candidate.purpose, credential: candidate.credential, credentialChosen: candidate.credentialChosen === true };
  } catch {
    return null;
  }
}

/** Called by the shell too, so reset does not depend on a mounted workflow. */
export function resetAccessContext() {
  try { window.sessionStorage.removeItem(storageKey); } catch { /* Storage can be unavailable. */ }
  const url = new URL(window.location.href);
  url.searchParams.delete("purpose");
  url.searchParams.delete("requester");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

export function useAccessContext(defaultPurpose: AccessPurpose, region: "EU" | "US" | undefined) {
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [context, setContext] = useState<AccessContext>({ purpose: defaultPurpose, credential: "eu-visiting", credentialChosen: false });
  const [ready, setReady] = useState(false);
  const lastWrittenSearch = useRef<string | null>(null);

  const commit = useCallback((next: AccessContext) => {
    setContext((current) => current.purpose === next.purpose && current.credential === next.credential && current.credentialChosen === next.credentialChosen ? current : next);
    try {
      // Only validated preset names are retained; never bearer or administrator tokens.
      window.sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch { /* The current page remains usable without tab persistence. */ }
    const url = new URL(window.location.href);
    url.searchParams.set("purpose", next.purpose);
    if (next.credentialChosen) url.searchParams.set("requester", next.credential);
    else url.searchParams.delete("requester");
    lastWrittenSearch.current = url.searchParams.toString();
    if (url.search !== window.location.search) window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  useEffect(() => {
    // Resolve URL changes and automatic regional defaults in one transition.
    // A second effect could otherwise overwrite a newly restored explicit requester
    // using the previous render's automatic-default state.
    const currentSearch = new URLSearchParams(window.location.search).toString();
    const regionalDefault = region === "US" ? "us-home" : "eu-visiting";
    if (currentSearch === lastWrittenSearch.current) {
      if (!context.credentialChosen && context.credential !== regionalDefault) {
        // Synchronize an automatic preset with externally restored patient context.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        commit({ ...context, credential: regionalDefault });
      }
      return;
    }
    const params = new URLSearchParams(currentSearch);
    const stored = readStoredContext();
    const queryPurpose = params.get("purpose");
    const queryRequester = params.get("requester");
    const queryRegion = DEMO_PATIENTS.find((patient) => patient.id === params.get("patient"))?.region;
    // A patient link without a requester selects the regional automatic preset.
    // Sidebar navigation has no patient query, so it retains the prior preset.
    const keepStoredRequester = !params.has("patient") && stored?.credentialChosen === true;
    const next: AccessContext = {
      purpose: isAccessPurpose(queryPurpose) ? queryPurpose : stored?.purpose ?? defaultPurpose,
      credential: isRequesterPreset(queryRequester) ? queryRequester : keepStoredRequester ? stored.credential : ((queryRegion ?? region) === "US" ? "us-home" : "eu-visiting"),
      credentialChosen: isRequesterPreset(queryRequester) || keepStoredRequester,
    };
    commit(next);
    setReady(true);
  }, [search, defaultPurpose, region, context, commit]);

  useEffect(() => {
    const reset = () => {
      resetAccessContext();
      commit({ purpose: defaultPurpose, credential: "eu-visiting", credentialChosen: false });
    };
    window.addEventListener(DEMO_RESET_EVENT, reset);
    return () => window.removeEventListener(DEMO_RESET_EVENT, reset);
  }, [commit, defaultPurpose]);

  const setPurpose = (purpose: AccessPurpose) => commit({ ...context, purpose });
  const setCredential = (credential: CredentialProfile) => commit({ ...context, credential, credentialChosen: true });
  return { purpose: context.purpose, credential: context.credential, setPurpose, setCredential, ready };
}
