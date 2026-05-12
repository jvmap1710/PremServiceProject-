"use client";

import dynamic from "next/dynamic";
import { SessionProvider } from "next-auth/react";

import { ThemeProvider } from "./ThemeProvider";

import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
    >
      <SessionProvider>
        <Toaster position="top-right" />
        {children}
      </SessionProvider>
    </ThemeProvider>
  );
}
