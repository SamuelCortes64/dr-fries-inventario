"use client";

import { format } from "date-fns";
import { AppShell } from "@/components/layout/AppShell";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { Card } from "@/components/ui/Card";
import { useDashboardData } from "@/hooks/useDashboardData";

export function CalendarioPage() {
  const {
    products,
    clients,
    production,
    shipments,
    loading,
    error,
    lastUpdated,
    refresh,
    updateProduction,
    updateShipment,
    deleteProduction,
    deleteShipment,
  } = useDashboardData();

  return (
    <AppShell
      onRefresh={refresh}
      lastUpdated={format(lastUpdated, "dd MMM yyyy HH:mm")}
      isSyncing={loading}
    >
      {error && (
        <Card className="border-rose-200 bg-rose-50 text-rose-700">
          Error al cargar datos: {error}
        </Card>
      )}
      <section className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Planeación
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Calendario
          </h2>
        </div>
        <CalendarView
          production={production}
          shipments={shipments}
          products={products}
          clients={clients}
          onRefresh={refresh}
          onUpdateProduction={updateProduction}
          onUpdateShipment={updateShipment}
          onDeleteProduction={deleteProduction}
          onDeleteShipment={deleteShipment}
        />
      </section>
    </AppShell>
  );
}
