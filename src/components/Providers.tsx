"use client";

import dynamic from "next/dynamic";
import { SessionProvider } from "next-auth/react";

const ThemeProvider = dynamic(
  () => import("./ThemeProvider").then((mod) => mod.ThemeProvider),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
    >
      <SessionProvider>
        {children}
      </SessionProvider>
    </ThemeProvider>
  );
}
