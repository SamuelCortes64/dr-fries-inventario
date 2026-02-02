"use client";

import { useMemo } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { AppShell } from "@/components/layout/AppShell";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { InventoryTable } from "@/components/dashboard/InventoryTable";
import { Charts } from "@/components/dashboard/Charts";
import { Card } from "@/components/ui/Card";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  STANDARD_PACKAGE_KG,
  getProductCodeById,
  groupInventoryByCode,
  sumPackagesByCode,
} from "@/lib/products";

export function ResumenPage() {
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

  const inventoryMap = useMemo(
    () => new Map(groupedInventory.map((row) => [row.code, row])),
    [groupedInventory],
  );

  const today = new Date();
  const currentMonthRange = {
    start: startOfMonth(today),
    end: endOfMonth(today),
  };
  const previousMonthDate = subMonths(today, 1);
  const previousMonthRange = {
    start: startOfMonth(previousMonthDate),
    end: endOfMonth(previousMonthDate),
  };

  const productionToday = useMemo(() => {
    const totals = { FR: 0, CA: 0 };
    production.forEach((row) => {
      if (!isSameDay(parseISO(row.production_date), today)) return;
      const code = getProductCodeById(productMap, row.product_id);
      if (!code) return;
      totals[code] += row.packages ?? 0;
    });
    return totals;
  }, [production, productMap, today]);

  const shipmentsToday = useMemo(() => {
    const totals = { FR: 0, CA: 0 };
    shipments.forEach((row) => {
      if (!isSameDay(parseISO(row.shipment_date), today)) return;
      const code = getProductCodeById(productMap, row.product_id);
      if (!code) return;
      totals[code] += row.packages ?? 0;
    });
    return totals;
  }, [shipments, productMap, today]);

  const stockFr = inventoryMap.get("FR")?.stock_packages ?? 0;
  const stockCa = inventoryMap.get("CA")?.stock_packages ?? 0;
  const stockFrKg = stockFr * STANDARD_PACKAGE_KG;
  const stockCaKg = stockCa * STANDARD_PACKAGE_KG;
  const totalInventoryPackages = stockFr + stockCa;
  const totalInventoryKg = stockFrKg + stockCaKg;

  const sumProductionWeightInRange = (
    rows: typeof production,
    range: { start: Date; end: Date },
  ) =>
    rows.reduce((sum, row) => {
      const date = parseISO(row.production_date);
      if (isWithinInterval(date, range)) {
        return sum + (row.packages ?? 0) * STANDARD_PACKAGE_KG;
      }
      return sum;
    }, 0);

  const sumShipmentWeightInRange = (
    rows: typeof shipments,
    range: { start: Date; end: Date },
  ) =>
    rows.reduce((sum, row) => {
      const date = parseISO(row.shipment_date);
      if (isWithinInterval(date, range)) {
        return sum + (row.packages ?? 0) * STANDARD_PACKAGE_KG;
      }
      return sum;
    }, 0);

  const productionCurrentMonth = useMemo(
    () =>
      sumPackagesByCode(
        production,
        productMap,
        "production_date",
        currentMonthRange,
      ),
    [production, productMap, currentMonthRange],
  );
  const productionPreviousMonth = useMemo(
    () =>
      sumPackagesByCode(
        production,
        productMap,
        "production_date",
        previousMonthRange,
      ),
    [production, productMap, previousMonthRange],
  );
  const shipmentsCurrentMonth = useMemo(
    () =>
      sumPackagesByCode(
        shipments,
        productMap,
        "shipment_date",
        currentMonthRange,
      ),
    [shipments, productMap, currentMonthRange],
  );
  const shipmentsPreviousMonth = useMemo(
    () =>
      sumPackagesByCode(
        shipments,
        productMap,
        "shipment_date",
        previousMonthRange,
      ),
    [shipments, productMap, previousMonthRange],
  );

  const productionWeightCurrent = useMemo(
    () => sumProductionWeightInRange(production, currentMonthRange),
    [production, currentMonthRange],
  );
  const shipmentWeightCurrent = useMemo(
    () => sumShipmentWeightInRange(shipments, currentMonthRange),
    [shipments, currentMonthRange],
  );

  const trendValue = (current: number, previous: number) => {
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const productionTrend = trendValue(
    productionCurrentMonth.total,
    productionPreviousMonth.total,
  );
  const shipmentsTrend = trendValue(
    shipmentsCurrentMonth.total,
    shipmentsPreviousMonth.total,
  );

  const kpiItems = [
    {
      label: "Stock Actual Papas a la Francesa",
      value: `${stockFr} paquetes`,
      helper: `${stockFrKg.toFixed(1)} kg`,
    },
    {
      label: "Stock Actual Papas en Cascos",
      value: `${stockCa} paquetes`,
      helper: `${stockCaKg.toFixed(1)} kg`,
    },
    {
      label: "Producción Hoy",
      lines: [
        {
          label: "Papas a la Francesa",
          value: `${productionToday.FR} paquetes (${(
            productionToday.FR * STANDARD_PACKAGE_KG
          ).toFixed(1)} kg)`,
        },
        {
          label: "Papas en Cascos",
          value: `${productionToday.CA} paquetes (${(
            productionToday.CA * STANDARD_PACKAGE_KG
          ).toFixed(1)} kg)`,
        },
      ],
    },
    {
      label: "Envíos Hoy",
      lines: [
        {
          label: "Papas a la Francesa",
          value: `${shipmentsToday.FR} paquetes (${(
            shipmentsToday.FR * STANDARD_PACKAGE_KG
          ).toFixed(1)} kg)`,
        },
        {
          label: "Papas en Cascos",
          value: `${shipmentsToday.CA} paquetes (${(
            shipmentsToday.CA * STANDARD_PACKAGE_KG
          ).toFixed(1)} kg)`,
        },
      ],
    },
    {
      label: "Inventario Total",
      lines: [
        {
          label: "Papas a la Francesa",
          value: `${stockFr} paquetes (${stockFrKg.toFixed(1)} kg)`,
        },
        {
          label: "Papas en Cascos",
          value: `${stockCa} paquetes (${stockCaKg.toFixed(1)} kg)`,
        },
      ],
      helper: `Total: ${totalInventoryPackages} paquetes (${totalInventoryKg.toFixed(
        1,
      )} kg)`,
    },
  ];

  const productionByDate = useMemo(
    () =>
      production.reduce<Record<string, number>>((acc, row) => {
        acc[row.production_date] = (acc[row.production_date] ?? 0) + row.packages;
        return acc;
      }, {}),
    [production],
  );

  const shipmentsByDate = useMemo(
    () =>
      shipments.reduce<Record<string, number>>((acc, row) => {
        acc[row.shipment_date] = (acc[row.shipment_date] ?? 0) + row.packages;
        return acc;
      }, {}),
    [shipments],
  );

  const daysRange = useMemo(() => {
    const start = subDays(today, 29);
    return eachDayOfInterval({ start, end: today });
  }, [today]);

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
    const totals = shipments.reduce<Record<string, number>>((acc, row) => {
      const date = parseISO(row.shipment_date);
      if (isWithinInterval(date, currentMonthRange)) {
        acc[row.client_id] = (acc[row.client_id] ?? 0) + row.packages;
      }
      return acc;
    }, {});

    return Object.entries(totals)
      .map(([clientId, packages]) => ({
        name: clientMap.get(clientId)?.name ?? "Cliente",
        packages,
      }))
      .sort((a, b) => b.packages - a.packages)
      .slice(0, 6);
  }, [shipments, clientMap, currentMonthRange]);

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
    let runningStock = totalInventoryPackages - netTotal;

    return daysRange.map((day) => {
      const key = format(day, "yyyy-MM-dd");
      runningStock += netByDate.get(key) ?? 0;
      return {
        date: format(day, "dd MMM"),
        stock: Math.max(runningStock, 0),
      };
    });
  }, [daysRange, productionByDate, shipmentsByDate, totalInventoryPackages]);

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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Dashboard Principal
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Resumen
            </h2>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-700">
              Inventario Actual (Suma total de Francesas y Cascos)
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {totalInventoryPackages}
            </p>
          </div>
        </div>
        <KpiGrid items={kpiItems} />
        <Card>
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">
                Resumen Mensual
              </h3>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Producción y Envíos
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-500">
                  Producción del Mes
                </p>
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Papas a la Francesa (2.5 kg)</span>
                    <span className="font-semibold text-slate-900">
                      {productionCurrentMonth.FR} paquetes
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Papas en Cascos (2.5 kg)</span>
                    <span className="font-semibold text-slate-900">
                      {productionCurrentMonth.CA} paquetes
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Total</span>
                    <span>{productionCurrentMonth.total} paquetes</span>
                  </div>
                </div>
                {productionTrend !== null && (
                  <p
                    className={`mt-1 text-xs ${
                      productionTrend >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    Comparado al mes anterior: {productionTrend.toFixed(1)}%
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-500">
                  Envíos del Mes
                </p>
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Papas a la Francesa (2.5 kg)</span>
                    <span className="font-semibold text-slate-900">
                      {shipmentsCurrentMonth.FR} paquetes
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Papas en Cascos (2.5 kg)</span>
                    <span className="font-semibold text-slate-900">
                      {shipmentsCurrentMonth.CA} paquetes
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Total</span>
                    <span>{shipmentsCurrentMonth.total} paquetes</span>
                  </div>
                </div>
                {shipmentsTrend !== null && (
                  <p
                    className={`mt-1 text-xs ${
                      shipmentsTrend >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    Comparado al mes anterior: {shipmentsTrend.toFixed(1)}%
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-500">
                  Peso Total Producido
                </p>
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Papas a la Francesa</span>
                    <span className="font-semibold text-slate-900">
                      {(productionCurrentMonth.FR * STANDARD_PACKAGE_KG).toFixed(1)}{" "}
                      kg
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Papas en Cascos</span>
                    <span className="font-semibold text-slate-900">
                      {(productionCurrentMonth.CA * STANDARD_PACKAGE_KG).toFixed(1)}{" "}
                      kg
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Total</span>
                    <span>{productionWeightCurrent.toFixed(1)} kg</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-500">
                  Peso Total Enviado
                </p>
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Papas a la Francesa</span>
                    <span className="font-semibold text-slate-900">
                      {(shipmentsCurrentMonth.FR * STANDARD_PACKAGE_KG).toFixed(1)}{" "}
                      kg
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Papas en Cascos</span>
                    <span className="font-semibold text-slate-900">
                      {(shipmentsCurrentMonth.CA * STANDARD_PACKAGE_KG).toFixed(1)}{" "}
                      kg
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Total</span>
                    <span>{shipmentWeightCurrent.toFixed(1)} kg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>
      <section className="space-y-6">
        <InventoryTable inventory={groupedInventory} />
        <Charts
          productionByDay={productionByDay}
          shipmentsByClient={shipmentsByClient}
          stockHistory={stockHistory}
          showStockHistory={false}
        />
      </section>
    </AppShell>
  );
}
