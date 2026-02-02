"use client";

import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type HeaderProps = {
  onRefresh: () => void;
  lastUpdated: string;
  isSyncing: boolean;
};

export function Header({ onRefresh, lastUpdated, isSyncing }: HeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-6 py-5 backdrop-blur">
      <div className="flex items-center gap-4">
        <Image
          src="/logo-header.png"
          alt="Dr Fries"
          width={160}
          height={160}
          className="h-28 w-28 object-contain"
          priority
        />
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Dr Fries
          </p>
          <h1 className="text-lg font-semibold text-slate-900">
            Inventario Dr Fries
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
          {isSyncing ? "Sincronizando" : "En línea"}
        </Badge>
        <span className="text-xs text-slate-500">
          Actualizado: {lastUpdated}
        </span>
        <Button variant="secondary" onClick={onRefresh}>
          Actualizar
        </Button>
      </div>
    </div>
  );
}
