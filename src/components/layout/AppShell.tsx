"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

type AppShellProps = {
  children: ReactNode;
  onRefresh: () => void;
  lastUpdated: string;
  isSyncing: boolean;
};

export function AppShell({
  children,
  onRefresh,
  lastUpdated,
  isSyncing,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header
          onRefresh={onRefresh}
          lastUpdated={lastUpdated}
          isSyncing={isSyncing}
        />
        <main className="flex-1 space-y-8 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
