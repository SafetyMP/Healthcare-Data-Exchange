import type { MetadataRoute } from "next";

import { canonicalUrl, IS_PUBLIC_DEMO } from "@/lib/site";

// Explicit static generation also supports the GitHub Pages output: export build.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // Local gateway mode has no public production URLs of its own to advertise.
  return IS_PUBLIC_DEMO ? [{ url: canonicalUrl("/") }] : [];
}
