"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import type { Database } from "@/lib/supabase/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";
import { toDateOnly } from "@/lib/dates";
import {
  STANDARD_PACKAGE_KG,
  getProductCodeById,
  getProductLabelById,
  getStandardProductOptions,
} from "@/lib/products";

type ProductionRow = Database["public"]["Tables"]["production"]["Row"];
type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type Client = Database["public"]["Tables"]["clients"]["Row"];
type ProductionUpdate = Database["public"]["Tables"]["production"]["Update"];
type ShipmentUpdate = Database["public"]["Tables"]["shipments"]["Update"];

type CalendarViewProps = {
  production: ProductionRow[];
  shipments: ShipmentRow[];
  products: Product[];
  clients: Client[];
  onRefresh: () => Promise<void> | void;
  onUpdateProduction: (id: number, payload: ProductionUpdate) => Promise<void>;
  onUpdateShipment: (id: number, payload: ShipmentUpdate) => Promise<void>;
  onDeleteProduction: (id: number) => Promise<void>;
  onDeleteShipment: (id: number) => Promise<void>;
};

type EditTarget =
  | { type: "production"; record: ProductionRow }
  | { type: "shipment"; record: ShipmentRow };

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const PencilIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    <path d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.213l-4.5 1.125 1.125-4.5L16.862 3.487z" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

export function CalendarView({
  production,
  shipments,
  products,
  clients,
  onRefresh,
  onUpdateProduction,
  onUpdateShipment,
  onDeleteProduction,
  onDeleteShipment,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editValues, setEditValues] = useState({
    productId: "",
    clientId: "",
    packages: "",
    notes: "",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const clientMap = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  );

  const productOptions = useMemo(
    () => getStandardProductOptions(products),
    [products],
  );
  const productOptionByCode = useMemo(() => {
    const map = new Map<string, (typeof productOptions)[number]>();
    productOptions.forEach((option) => map.set(option.code, option));
    return map;
  }, [productOptions]);

  const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  const selectedDateKey = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : null;

  const productionForDay = useMemo(() => {
    const rows = selectedDateKey
      ? production.filter(
          (row) => toDateOnly(row.production_date) === selectedDateKey,
        )
      : [];
    return [...rows].sort((a, b) => a.id - b.id);
  }, [production, selectedDateKey]);

  const shipmentsForDay = useMemo(() => {
    const rows = selectedDateKey
      ? shipments.filter(
          (row) => toDateOnly(row.shipment_date) === selectedDateKey,
        )
      : [];
    return [...rows].sort((a, b) => a.id - b.id);
  }, [shipments, selectedDateKey]);

  const dailyTotals = useMemo(() => {
    const totals = new Map<
      string,
      { production: { FR: number; CA: number }; shipments: { FR: number; CA: number } }
    >();

    const ensure = (dateKey: string) => {
      if (!totals.has(dateKey)) {
        totals.set(dateKey, {
          production: { FR: 0, CA: 0 },
          shipments: { FR: 0, CA: 0 },
        });
      }
      return totals.get(dateKey)!;
    };

    production.forEach((row) => {
      const code = getProductCodeById(productMap, row.product_id);
      if (!code) return;
      const dateKey = toDateOnly(row.production_date);
      const entry = ensure(dateKey);
      entry.production[code] += row.packages ?? 0;
    });

    shipments.forEach((row) => {
      const code = getProductCodeById(productMap, row.product_id);
      if (!code) return;
      const dateKey = toDateOnly(row.shipment_date);
      const entry = ensure(dateKey);
      entry.shipments[code] += row.packages ?? 0;
    });

    return totals;
  }, [production, shipments, productMap]);

  const openEditProduction = (row: ProductionRow) => {
    const code = getProductCodeById(productMap, row.product_id);
    const option = code ? productOptionByCode.get(code) : null;
    setEditValues({
      productId: option?.id ?? row.product_id,
      clientId: "",
      packages: String(row.packages ?? 0),
      notes: row.notes ?? "",
    });
    setEditError(null);
    setEditTarget({ type: "production", record: row });
  };

  const openEditShipment = (row: ShipmentRow) => {
    const code = getProductCodeById(productMap, row.product_id);
    const option = code ? productOptionByCode.get(code) : null;
    setEditValues({
      productId: option?.id ?? row.product_id,
      clientId: row.client_id,
      packages: String(row.packages ?? 0),
      notes: row.notes ?? "",
    });
    setEditError(null);
    setEditTarget({ type: "shipment", record: row });
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setEditError(null);
    if (!editValues.productId || !editValues.packages) {
      setEditError("Completa producto y paquetes.");
      return;
    }
    if (editTarget.type === "shipment" && !editValues.clientId) {
      setEditError("Selecciona un cliente.");
      return;
    }

    setIsSaving(true);
    try {
      if (editTarget.type === "production") {
        await onUpdateProduction(editTarget.record.id, {
          product_id: editValues.productId,
          packages: Number(editValues.packages),
          notes: editValues.notes.trim() ? editValues.notes.trim() : null,
        });
      } else {
        await onUpdateShipment(editTarget.record.id, {
          product_id: editValues.productId,
          client_id: editValues.clientId,
          packages: Number(editValues.packages),
          notes: editValues.notes.trim() ? editValues.notes.trim() : null,
        });
      }
      await onRefresh();
      setEditTarget(null);
    } catch {
      setEditError("No se pudo actualizar el registro.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduction = async (row: ProductionRow) => {
    const confirmed = window.confirm(
      "¿Deseas eliminar este registro de producción?",
    );
    if (!confirmed) return;
    await onDeleteProduction(row.id);
    await onRefresh();
  };

  const handleDeleteShipment = async (row: ShipmentRow) => {
    const confirmed = window.confirm("¿Deseas eliminar este envío?");
    if (!confirmed) return;
    await onDeleteShipment(row.id);
    await onRefresh();
  };

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Calendario
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              Producción y Envíos por Día
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {format(currentMonth, "MMMM yyyy")}
            </p>
          </div>
            <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                const today = new Date();
                setCurrentMonth(startOfMonth(today));
                setSelectedDate(today);
              }}
            >
              Hoy
            </Button>
            <Button
              variant="secondary"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              Mes Anterior
            </Button>
            <Button
              variant="secondary"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              Mes Siguiente
            </Button>
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div>
            <div className="grid grid-cols-7 gap-2 text-xs text-slate-500">
              {DAY_LABELS.map((day) => (
                <div key={day} className="px-2 py-1 text-center font-semibold">
                  {day}
                </div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {days.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const totals = dailyTotals.get(dateKey);
                const productionTotals = totals?.production ?? { FR: 0, CA: 0 };
                const shipmentTotals = totals?.shipments ?? { FR: 0, CA: 0 };
                const productionCount =
                  productionTotals.FR + productionTotals.CA;
                const shipmentCount =
                  shipmentTotals.FR + shipmentTotals.CA;
                const isSelected =
                  selectedDateKey && dateKey === selectedDateKey;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "min-h-[100px] sm:min-h-[130px] rounded-xl border border-slate-200 bg-white px-1.5 py-1.5 sm:px-2 sm:py-2 text-left text-[10px] sm:text-[11px] text-slate-600 transition hover:border-sky-300 hover:bg-sky-50/40",
                      !isSameMonth(day, currentMonth) && "opacity-40",
                      isToday(day) && "border-sky-400 bg-sky-50",
                      isSelected && "ring-2 ring-sky-400",
                    )}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>{format(day, "d")}</span>
                      <div className="flex gap-1">
                        {productionCount > 0 && (
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        )}
                        {shipmentCount > 0 && (
                          <span className="h-2 w-2 rounded-full bg-rose-400" />
                        )}
                      </div>
                    </div>
                    <div className="mt-2 space-y-0.5 text-[10px]">
                      <div className="font-medium text-emerald-700">
                        Prod: FR {productionTotals.FR} / CA {productionTotals.CA}
                      </div>
                      <div className="font-medium text-rose-700">
                        Env: FR {shipmentTotals.FR} / CA {shipmentTotals.CA}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Detalle del Día
            </p>
            <h4 className="mt-2 text-lg font-semibold text-slate-900">
              {selectedDate
                ? format(selectedDate, "dd MMM yyyy")
                : "Selecciona una fecha"}
            </h4>
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Producción
                </p>
                <div className="mt-2 space-y-2">
                  {productionForDay.length === 0 && (
                    <p className="text-sm text-slate-400">
                      Sin producción registrada.
                    </p>
                  )}
                  {productionForDay.map((row) => (
                    <div
                      key={`prod-${row.id}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {getProductLabelById(productMap, row.product_id)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Paquetes: {row.packages} · Peso:{" "}
                            {(row.packages * STANDARD_PACKAGE_KG).toFixed(1)} kg
                          </p>
                          {row.notes && (
                            <p className="mt-1 text-xs text-slate-500">
                              Notas: {row.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-[#f97316] transition hover:bg-slate-50 hover:text-[#ea580c]"
                            onClick={() => openEditProduction(row)}
                            aria-label="Editar"
                          >
                            <PencilIcon className="h-4 w-4 text-[#f97316]" />
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-[#dc3545] transition hover:bg-slate-50 hover:text-[#b02a37]"
                            onClick={() => handleDeleteProduction(row)}
                            aria-label="Eliminar"
                          >
                            <TrashIcon className="h-4 w-4 text-[#dc3545]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Envíos
                </p>
                <div className="mt-2 space-y-2">
                  {shipmentsForDay.length === 0 && (
                    <p className="text-sm text-slate-400">
                      Sin envíos registrados.
                    </p>
                  )}
                  {shipmentsForDay.map((row) => (
                    <div
                      key={`ship-${row.id}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {clientMap.get(row.client_id)?.name ?? "Cliente"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Producto:{" "}
                            {getProductLabelById(productMap, row.product_id)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Paquetes: {row.packages} · Peso:{" "}
                            {(row.packages * STANDARD_PACKAGE_KG).toFixed(1)} kg
                          </p>
                          {row.notes && (
                            <p className="mt-1 text-xs text-slate-500">
                              Notas: {row.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-[#f97316] transition hover:bg-slate-50 hover:text-[#ea580c]"
                            onClick={() => openEditShipment(row)}
                            aria-label="Editar"
                          >
                            <PencilIcon className="h-4 w-4 text-[#f97316]" />
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-[#dc3545] transition hover:bg-slate-50 hover:text-[#b02a37]"
                            onClick={() => handleDeleteShipment(row)}
                            aria-label="Eliminar"
                          >
                            <TrashIcon className="h-4 w-4 text-[#dc3545]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {editTarget.type === "production"
                    ? "Editar producción"
                    : "Editar envío"}
                </p>
                <h4 className="mt-1 text-lg font-semibold text-slate-900">
                  {selectedDateKey ?? "Registro"}
                </h4>
              </div>
              <button
                type="button"
                className="text-sm text-slate-500 hover:text-slate-700"
                onClick={() => setEditTarget(null)}
              >
                Cerrar
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Producto
                </label>
                <Select
                  value={editValues.productId}
                  onChange={(event) =>
                    setEditValues((prev) => ({
                      ...prev,
                      productId: event.target.value,
                    }))
                  }
                >
                  <option value="">Seleccionar producto</option>
                  {productOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              {editTarget.type === "shipment" && (
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Cliente
                  </label>
                  <Select
                    value={editValues.clientId}
                    onChange={(event) =>
                      setEditValues((prev) => ({
                        ...prev,
                        clientId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Paquetes
                </label>
                <Input
                  type="number"
                  min={0}
                  value={editValues.packages}
                  onChange={(event) =>
                    setEditValues((prev) => ({
                      ...prev,
                      packages: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Notas
                </label>
                <Textarea
                  value={editValues.notes}
                  onChange={(event) =>
                    setEditValues((prev) => ({
                      ...prev,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Notas opcionales"
                />
              </div>
              {editError && <p className="text-xs text-rose-600">{editError}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setEditTarget(null)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={isSaving}>
                Guardar cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
