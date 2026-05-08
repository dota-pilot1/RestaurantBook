"use client";

import { RequireAuth } from "@/widgets/guards/RequireAuth";

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
