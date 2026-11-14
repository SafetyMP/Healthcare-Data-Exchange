import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { chexNav } from "@/lib/navigation";

import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Healthcare Data Exchange | Access with purpose",
  description: "Explore synthetic patient access, consent and regional data boundaries in an interactive healthcare exchange demo.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-[150%] rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <Providers>
          <AppShell productName="Healthcare Exchange" eyebrow="SafetyMP OSS" nav={chexNav}>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
