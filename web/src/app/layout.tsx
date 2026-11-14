import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { chexNav } from "@/lib/navigation";
import { IS_PUBLIC_DEMO, pageMetadata, SITE_URL, siteStructuredData } from "@/lib/site";

import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  ...pageMetadata("/"),
  icons: { icon: [{ url: IS_PUBLIC_DEMO ? new URL("favicon.svg", SITE_URL).href : "/favicon.svg", type: "image/svg+xml" }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {IS_PUBLIC_DEMO && <link rel="describedby" type="text/plain" href={new URL("llms.txt", SITE_URL).href} />}
      </head>
      <body className="min-h-full bg-background text-foreground">
        {IS_PUBLIC_DEMO && <script id="site-structured-data" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteStructuredData()).replace(/</g, "\\u003c") }} />}
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-[150%] rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <Providers>
          <AppShell productName="Healthcare Data Exchange" eyebrow="SafetyMP OSS" nav={chexNav}>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
