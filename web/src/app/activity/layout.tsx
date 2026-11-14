import type { Metadata } from "next";
import type { ReactNode } from "react";

import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata("/activity");

export default function RouteLayout({ children }: { children: ReactNode }) {
  return children;
}
