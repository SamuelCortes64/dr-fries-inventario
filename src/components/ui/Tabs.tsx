"use client";

import { cn } from "@/lib/utils";

type TabItem = {
  id: string;
  label: string;
};

type TabsProps = {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
};

export function Tabs({ tabs, activeId, onChange, className }: TabsProps) {
  return (
    <nav
      role="tablist"
      className={cn(
        "flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50/70 p-1",
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeId === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "min-h-[44px] rounded-lg px-4 py-2.5 text-sm font-medium transition",
            activeId === tab.id
              ? "bg-white text-sky-700 shadow-sm"
              : "text-slate-600 hover:bg-white/60 hover:text-slate-900",
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
