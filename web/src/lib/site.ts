import type { Metadata } from "next";

export const SITE_NAME = "Healthcare Data Exchange";
export const SITE_URL = "https://safetymp.github.io/Healthcare-Data-Exchange/";
export const REPOSITORY_URL = "https://github.com/SafetyMP/Healthcare-Data-Exchange";
export const IS_PUBLIC_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
export const SITE_ROUTES = ["/", "/patients", "/consent", "/identity", "/activity", "/ai-triage"] as const;
export type SiteRoute = typeof SITE_ROUTES[number];

const pages: Record<SiteRoute, { title: string; description: string; liveDescription: string }> = {
  "/": {
    title: "Research consent and pilot case",
    description: "Decide how a study team can use Anna’s synthetic record. Compare consent receipts, field-level release and the case for a shadow pilot.",
    liveDescription: "Local gateway reference for synthetic patient access, purpose-specific consent and regional sharing rules. Requires the separate reference backend.",
  },
  "/patients": {
    title: "Patient access",
    description: "Search synthetic patients and see how purpose, requesting team, consent and EU/US regional rules produce allowed, blocked or limited data access.",
    liveDescription: "Check synthetic patient access through the local gateway using verified demo caller credentials, purpose-specific consent and regional policy.",
  },
  "/consent": {
    title: "Consent management",
    description: "Grant or revoke purpose-specific consent for a synthetic patient, then recheck access with the same requesting team in this browser-local demonstration.",
    liveDescription: "Update synthetic patient consent through the local reference gateway, then check access to verify the effect of policy propagation.",
  },
  "/identity": {
    title: "Identity matching",
    description: "Resolve registered synthetic identifiers to their home records and regions. Identity matching locates a record; it does not grant access to patient data.",
    liveDescription: "Resolve synthetic identifiers through the local identity broker before checking the requesting team's access permissions.",
  },
  "/activity": {
    title: "Demo activity",
    description: "Review the current tab's synthetic consent changes and access decisions, including requesting teams, purposes and outcomes. This is not a production audit log.",
    liveDescription: "Learn the boundary between browser-local demo activity and the separate local reference backend. This console does not provide a production audit log.",
  },
  "/ai-triage": {
    title: "AI oversight example",
    description: "Explore a fixed-output synthetic AI oversight example held for human review. The demonstration does not assess symptoms or provide clinical advice.",
    liveDescription: "Exercise the local fixed-output AI governance reference and its human-oversight flags using synthetic inputs. It does not provide clinical assessment.",
  },
};

export function canonicalUrl(route: SiteRoute): string {
  return route === "/" ? SITE_URL : new URL(`${route.slice(1)}/`, SITE_URL).href;
}

export function pageMetadata(route: SiteRoute): Metadata {
  const page = pages[route];
  const title = route === "/" ? `${SITE_NAME} | ${IS_PUBLIC_DEMO ? page.title : "Local gateway reference"}` : `${page.title} | ${SITE_NAME}${IS_PUBLIC_DEMO ? "" : " local reference"}`;
  const description = IS_PUBLIC_DEMO ? page.description : page.liveDescription;
  if (!IS_PUBLIC_DEMO) {
    // A local gateway session is a different execution mode, not a duplicate of Pages.
    return { title: { absolute: title }, description, robots: { index: false, follow: false } };
  }
  if (route !== "/") return { title: { absolute: title }, description, alternates: { canonical: SITE_URL }, openGraph: null, twitter: null, robots: { index: false, follow: false } };
  const url = canonicalUrl(route);
  const image = { url: new URL("social-preview.png", SITE_URL).href, width: 1280, height: 640, alt: "Healthcare Data Exchange — synthetic research consent case and exchange pilot" };
  return {
    title: { absolute: title },
    description,
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    alternates: { canonical: url },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US", url, title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [{ url: image.url, alt: image.alt }] },
  };
}

/** Descriptive schema only: no invented reviews, ratings or compliance claims. */
export function siteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}#website`,
        name: SITE_NAME,
        url: SITE_URL,
        description: pages["/"].description,
        inLanguage: "en",
        mainEntity: { "@id": `${SITE_URL}#application` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}#application`,
        name: SITE_NAME,
        url: SITE_URL,
        description: "A browser-local research consent and pilot case with selected-request trials, field manifests and policy publication evidence. A separate FHIR, OPA and OPAL backend reference is available in the source repository. Not a production health-information exchange or a clinical system.",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web browser",
        isAccessibleForFree: true,
        license: `${REPOSITORY_URL}/blob/main/LICENSE`,
        sameAs: REPOSITORY_URL,
        image: new URL("social-preview.png", SITE_URL).href,
        featureList: ["Research, treatment and derivative requests", "Patient consent replay", "Pilot capacity worksheet", "Selected-request technical trials", "Field manifest and policy digest comparison"],
        isPartOf: { "@id": `${SITE_URL}#website` },
      },
    ],
  };
}
