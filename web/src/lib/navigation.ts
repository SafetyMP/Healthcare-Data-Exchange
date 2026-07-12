export type NavItem = {
  href: string;
  label: string;
};

export const chexNav: NavItem[] = [
  { href: "/", label: "Overview" },
  { href: "/patients", label: "Patient lookup" },
  { href: "/consent", label: "Consent" },
  { href: "/ai-triage", label: "AI triage" },
  { href: "/identity", label: "Identity resolve" },
];
