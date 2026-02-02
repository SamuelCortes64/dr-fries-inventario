"use client";

import { useState, type ReactNode } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar onClose={() => setSidebarOpen(false)} isMobile={false} />
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
            aria-hidden
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden">
            <Sidebar
              onClose={() => setSidebarOpen(false)}
              isMobile
            />
          </div>
        </>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onRefresh={onRefresh}
          lastUpdated={lastUpdated}
          isSyncing={isSyncing}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 space-y-8 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
