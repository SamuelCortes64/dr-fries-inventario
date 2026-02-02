"use client";

import { useMemo, useState } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { AppShell } from "@/components/layout/AppShell";
import { InventoryTable } from "@/components/dashboard/InventoryTable";
import { Charts } from "@/components/dashboard/Charts";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useDashboardData } from "@/hooks/useDashboardData";
import { downloadCsv, toCsv } from "@/lib/csv";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { toDateOnly } from "@/lib/dates";
import {
  STANDARD_PACKAGE_KG,
  getProductLabelById,
  getStandardProductLabel,
  groupInventoryByCode,
  sumPackagesByCode,
} from "@/lib/products";

type ProductionRow = Database["public"]["Tables"]["production"]["Row"];
type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function ReportesPage() {
  const {
    products,
    clients,
    production,
    shipments,
    inventory,
    loading,
    error,
    lastUpdated,
    refresh,
  } = useDashboardData();

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const clientMap = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  );

  const groupedInventory = useMemo(
    () => groupInventoryByCode(inventory),
    [inventory],
  );

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number | "all">("all");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    production.forEach((row) => {
      years.add(parseISO(row.production_date).getFullYear());
    });
    shipments.forEach((row) => {
      years.add(parseISO(row.shipment_date).getFullYear());
    });
    if (years.size === 0) {
      years.add(today.getFullYear());
    }
    const minYear = Math.min(...years, today.getFullYear());
    const maxYear = Math.max(...years, 2030);
    const range: number[] = [];
    for (let year = minYear; year <= maxYear; year += 1) {
      range.push(year);
    }
    return range;
  }, [production, shipments, today]);

  const filterRange = useMemo(() => {
    if (selectedMonth === "all" || selectedYear === "all") return null;
    const date = new Date(selectedYear, selectedMonth - 1, 1);
    return { start: startOfMonth(date), end: endOfMonth(date) };
  }, [selectedMonth, selectedYear]);

  const filterLabel =
    filterRange && selectedMonth !== "all" && selectedYear !== "all"
      ? `${MONTHS[selectedMonth - 1]} ${selectedYear}`
      : "Total";

  const filteredProduction = useMemo(() => {
    if (!filterRange) return production;
    return production.filter((row) =>
      isWithinInterval(parseISO(row.production_date), filterRange),
    );
  }, [production, filterRange]);

  const filteredShipments = useMemo(() => {
    if (!filterRange) return shipments;
    return shipments.filter((row) =>
      isWithinInterval(parseISO(row.shipment_date), filterRange),
    );
  }, [shipments, filterRange]);

  const productionByDate = useMemo(
    () =>
      filteredProduction.reduce<Record<string, number>>((acc, row) => {
        const key = toDateOnly(row.production_date);
        acc[key] = (acc[key] ?? 0) + row.packages;
        return acc;
      }, {}),
    [filteredProduction],
  );

  const shipmentsByDate = useMemo(
    () =>
      filteredShipments.reduce<Record<string, number>>((acc, row) => {
        const key = toDateOnly(row.shipment_date);
        acc[key] = (acc[key] ?? 0) + row.packages;
        return acc;
      }, {}),
    [filteredShipments],
  );

  const daysRange = useMemo(() => {
    if (filterRange) {
      return eachDayOfInterval({
        start: filterRange.start,
        end: filterRange.end,
      });
    }
    const start = subDays(today, 29);
    return eachDayOfInterval({ start, end: today });
  }, [today, filterRange]);

  const productionByDay = useMemo(
    () =>
      daysRange.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        return {
          date: format(day, "dd MMM"),
          packages: productionByDate[key] ?? 0,
        };
      }),
    [daysRange, productionByDate],
  );

  const shipmentsByClient = useMemo(() => {
    const totals = filteredShipments.reduce<Record<string, number>>((acc, row) => {
      acc[row.client_id] = (acc[row.client_id] ?? 0) + row.packages;
      return acc;
    }, {});

    return Object.entries(totals)
      .map(([clientId, packages]) => ({
        name: clientMap.get(clientId)?.name ?? "Cliente",
        packages,
      }))
      .sort((a, b) => b.packages - a.packages)
      .slice(0, 6);
  }, [filteredShipments, clientMap]);

  const inventoryTotalPackages = useMemo(
    () =>
      groupedInventory.reduce((sum, row) => sum + (row.stock_packages ?? 0), 0),
    [groupedInventory],
  );

  const stockHistory = useMemo(() => {
    const netByDate = new Map<string, number>();
    daysRange.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      const produced = productionByDate[key] ?? 0;
      const shipped = shipmentsByDate[key] ?? 0;
      netByDate.set(key, produced - shipped);
    });

    const netTotal = Array.from(netByDate.values()).reduce(
      (sum, value) => sum + value,
      0,
    );
    const initialStock = filterRange ? 0 : inventoryTotalPackages - netTotal;

    return daysRange.reduce<Array<{ date: string; stock: number }>>(
      (acc, day) => {
        const key = format(day, "yyyy-MM-dd");
        const prevStock =
          acc.length === 0 ? initialStock : acc[acc.length - 1].stock;
        const net = netByDate.get(key) ?? 0;
        const newStock = Math.max(prevStock + net, 0);
        acc.push({ date: format(day, "dd MMM"), stock: newStock });
        return acc;
      },
      [],
    );
  }, [
    daysRange,
    inventoryTotalPackages,
    productionByDate,
    shipmentsByDate,
    filterRange,
  ]);

  const productionTotals = useMemo(
    () =>
      filterRange
        ? sumPackagesByCode(
            production,
            productMap,
            "production_date",
            filterRange,
          )
        : sumPackagesByCode(production, productMap),
    [production, productMap, filterRange],
  );

  const shipmentTotals = useMemo(
    () =>
      filterRange
        ? sumPackagesByCode(
            shipments,
            productMap,
            "shipment_date",
            filterRange,
          )
        : sumPackagesByCode(shipments, productMap),
    [shipments, productMap, filterRange],
  );

  const handleExportProduction = async () => {
    const { data, error: exportError } = await supabase
      .from("production")
      .select("*")
      .order("production_date", { ascending: true });

    if (exportError) {
      return;
    }

    const rows = ((data ?? []) as ProductionRow[]).map((row) => ({
      fecha: row.production_date,
      producto: getProductLabelById(productMap, row.product_id),
      paquetes: row.packages,
      peso_kg: (row.packages ?? 0) * STANDARD_PACKAGE_KG,
      notas: row.notes ?? "",
    }));
    const csv = toCsv(rows);
    downloadCsv("produccion.csv", csv);
  };

  const handleExportShipments = async () => {
    const { data, error: exportError } = await supabase
      .from("shipments")
      .select("*")
      .order("shipment_date", { ascending: true });

    if (exportError) {
      return;
    }

    const rows = ((data ?? []) as ShipmentRow[]).map((row) => ({
      fecha: row.shipment_date,
      cliente: clientMap.get(row.client_id)?.name ?? "Cliente",
      producto: getProductLabelById(productMap, row.product_id),
      paquetes: row.packages,
      peso_kg: (row.packages ?? 0) * STANDARD_PACKAGE_KG,
      notas: row.notes ?? "",
    }));
    const csv = toCsv(rows);
    downloadCsv("envios.csv", csv);
  };

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
            Reportes
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            KPI&apos;s y Métricas
          </h2>
        </div>
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                KPI&apos;s y Métricas
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {filterRange ? `Filtro activo: ${filterLabel}` : "Vista Total"}
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Mes
                </label>
                <Select
                  value={selectedMonth === "all" ? "" : String(selectedMonth)}
                  onChange={(event) =>
                    setSelectedMonth(
                      event.target.value
                        ? Number(event.target.value)
                        : "all",
                    )
                  }
                >
                  <option value="">Todos</option>
                  {MONTHS.map((label, index) => (
                    <option key={label} value={index + 1}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Año
                </label>
                <Select
                  value={selectedYear === "all" ? "" : String(selectedYear)}
                  onChange={(event) =>
                    setSelectedYear(
                      event.target.value
                        ? Number(event.target.value)
                        : "all",
                    )
                  }
                >
                  <option value="">Todos</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedMonth(today.getMonth() + 1);
                  setSelectedYear(today.getFullYear());
                }}
              >
                Este Mes
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const prev = subMonths(today, 1);
                  setSelectedMonth(prev.getMonth() + 1);
                  setSelectedYear(prev.getFullYear());
                }}
              >
                Mes Anterior
              </Button>
              {filterRange && (
                <Button
                  onClick={() => {
                    setSelectedMonth("all");
                    setSelectedYear("all");
                  }}
                >
                  Ver Total
                </Button>
              )}
            </div>
          </div>
        </Card>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Producción {filterRange ? "del Mes" : "Total"}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              {filterRange ? filterLabel : "Acumulado Histórico"}
            </h3>
            <div className="mt-4 space-y-1 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>{getStandardProductLabel("FR")}</span>
                <span className="font-semibold text-slate-900">
                  {productionTotals.FR} paquetes
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{getStandardProductLabel("CA")}</span>
                <span className="font-semibold text-slate-900">
                  {productionTotals.CA} paquetes
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Total</span>
                <span>{productionTotals.total} paquetes</span>
              </div>
            </div>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Envíos {filterRange ? "del Mes" : "Totales"}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              {filterRange ? filterLabel : "Acumulado Histórico"}
            </h3>
            <div className="mt-4 space-y-1 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>{getStandardProductLabel("FR")}</span>
                <span className="font-semibold text-slate-900">
                  {shipmentTotals.FR} paquetes
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{getStandardProductLabel("CA")}</span>
                <span className="font-semibold text-slate-900">
                  {shipmentTotals.CA} paquetes
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Total</span>
                <span>{shipmentTotals.total} paquetes</span>
              </div>
            </div>
          </Card>
        </div>
        <InventoryTable inventory={groupedInventory} />
        <Charts
          productionByDay={productionByDay}
          shipmentsByClient={shipmentsByClient}
          stockHistory={stockHistory}
        />
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Exportación
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">
                Descargas Rápidas
              </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleExportProduction}>
                Exportar producción CSV
              </Button>
              <Button variant="secondary" onClick={handleExportShipments}>
                Exportar envíos CSV
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
