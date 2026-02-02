"use client";

import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type HeaderProps = {
  onRefresh: () => void;
  lastUpdated: string;
  isSyncing: boolean;
  onMenuClick?: () => void;
};

const MenuIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </svg>
);

export function Header({
  onRefresh,
  lastUpdated,
  isSyncing,
  onMenuClick,
}: HeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-6 sm:py-5">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 lg:hidden"
            aria-label="Abrir menú"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        )}
        <Image
          src="/logo-header.png"
          alt="Dr Fries"
          width={160}
          height={160}
          className="h-20 w-20 shrink-0 object-contain sm:h-28 sm:w-28"
          priority
        />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Dr Fries
          </p>
          <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
            Inventario Dr Fries
          </h1>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Badge className="shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700">
          {isSyncing ? "Sincronizando" : "En línea"}
        </Badge>
        <span className="hidden text-xs text-slate-500 sm:inline">
          Actualizado: {lastUpdated}
        </span>
        <Button
          variant="secondary"
          onClick={onRefresh}
          className="min-h-[44px] min-w-[44px] sm:min-w-0"
        >
          Actualizar
        </Button>
      </div>
    </div>
  );
}
