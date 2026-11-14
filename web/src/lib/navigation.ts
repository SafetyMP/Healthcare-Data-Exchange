export type NavItem = { href: string; label: string };
export const chexNav: NavItem[] = [
  { href: "/", label: "Overview" },
  { href: "/patients", label: "Patient access" },
  { href: "/consent", label: "Consent management" },
  { href: "/identity", label: "Identity matching" },
  { href: "/activity", label: "Activity" },
  { href: "/ai-triage", label: "AI oversight" },
];
