"use client";

import { useMemo, useState } from "react";
import { format, getMonth, getYear, parseISO } from "date-fns";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ShipmentForm } from "@/components/dashboard/ShipmentForm";
import { ShipmentsTable } from "@/components/dashboard/ShipmentsTable";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Tabs } from "@/components/ui/Tabs";
import { useDashboardData } from "@/hooks/useDashboardData";
import { toDateOnly } from "@/lib/dates";
import { getProductCodeById, getStandardProductLabel, getStandardProductOptions } from "@/lib/products";
import type { Database } from "@/lib/supabase/types";

type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];

const PAGE_SIZE = 20;
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function EnviosPage() {
  const {
    products,
    clients,
    shipments,
    loading,
    error,
    lastUpdated,
    refresh,
    insertShipment,
    updateShipment,
    deleteShipment,
  } = useDashboardData();

  const searchParams = useSearchParams();
  const filterDate = searchParams.get("date");

  const productOptions = useMemo(
    () => getStandardProductOptions(products),
    [products],
  );
  const productOptionByCode = useMemo(() => {
    const map = new Map<string, (typeof productOptions)[number]>();
    productOptions.forEach((option) => map.set(option.code, option));
    return map;
  }, [productOptions]);
  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const clientMap = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  );

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    shipments.forEach((row) => {
      try {
        years.add(getYear(parseISO(row.shipment_date)));
      } catch {
        years.add(new Date().getFullYear());
      }
    });
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => a - b);
  }, [shipments]);

  const [activeTab, setActiveTab] = useState<"registrar" | "ver">("registrar");
  const [filterMonth, setFilterMonth] = useState<number | "">("");
  const [filterYear, setFilterYear] = useState<number | "">("");
  const [filterClient, setFilterClient] = useState<string>("");
  const [filterProduct, setFilterProduct] = useState<"all" | "FR" | "CA">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState<ShipmentRow | null>(null);
  const [editValues, setEditValues] = useState({
    shipment_date: "",
    productId: "",
    clientId: "",
    packages: "",
    notes: "",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleShipmentSubmit = async (payload: {
    shipment_date: string;
    product_id: string;
    client_id: string;
    packages: number;
    notes: string | null;
  }) => {
    setIsSubmitting(true);
    try {
      await insertShipment(payload);
      await refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (row: ShipmentRow) => {
    const code = getProductCodeById(productMap, row.product_id);
    const option = code ? productOptionByCode.get(code) : null;
    setEditValues({
      shipment_date: toDateOnly(row.shipment_date),
      productId: option?.id ?? row.product_id,
      clientId: row.client_id,
      packages: String(row.packages ?? 0),
      notes: row.notes ?? "",
    });
    setEditError(null);
    setEditTarget(row);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setEditError(null);
    if (!editValues.shipment_date || !editValues.productId || !editValues.packages) {
      setEditError("Completa fecha, producto y paquetes.");
      return;
    }
    if (!editValues.clientId) {
      setEditError("Selecciona un cliente.");
      return;
    }
    setIsSaving(true);
    try {
      await updateShipment(editTarget.id, {
        shipment_date: editValues.shipment_date,
        product_id: editValues.productId,
        client_id: editValues.clientId,
        packages: Number(editValues.packages),
        notes: editValues.notes.trim() ? editValues.notes.trim() : null,
      });
      await refresh();
      setEditTarget(null);
    } catch {
      setEditError("No se pudo actualizar el envío.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (row: ShipmentRow) => {
    const confirmed = window.confirm("¿Deseas eliminar este envío?");
    if (!confirmed) return;
    await deleteShipment(row.id);
    await refresh();
  };

  const filteredShipments = useMemo(() => {
    let rows = shipments;
    if (filterDate) {
      rows = rows.filter((row) => toDateOnly(row.shipment_date) === filterDate);
    }
    if (filterMonth !== "" && filterYear !== "") {
      rows = rows.filter((row) => {
        try {
          const d = parseISO(row.shipment_date);
          return getMonth(d) + 1 === filterMonth && getYear(d) === filterYear;
        } catch {
          return false;
        }
      });
    }
    if (filterClient) {
      rows = rows.filter((row) => row.client_id === filterClient);
    }
    if (filterProduct !== "all") {
      rows = rows.filter(
        (row) => getProductCodeById(productMap, row.product_id) === filterProduct,
      );
    }
    return [...rows].sort((a, b) =>
      b.shipment_date.localeCompare(a.shipment_date),
    );
  }, [shipments, filterDate, filterMonth, filterYear, filterClient, filterProduct, productMap]);

  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredShipments.slice(start, start + PAGE_SIZE);
  }, [filteredShipments, safePage]);

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
            Operaciones
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Envíos
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Registra y gestiona los envíos a clientes.
          </p>
        </div>

        <Tabs
          tabs={[
            { id: "registrar", label: "Registrar envíos" },
            { id: "ver", label: "Ver envíos" },
          ]}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as "registrar" | "ver")}
        />

        {activeTab === "registrar" && (
          <div className="max-w-xl">
            <ShipmentForm
              productOptions={productOptions}
              clients={clients}
              onSubmit={handleShipmentSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {activeTab === "ver" && (
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-6">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Ver envíos
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  Filtros
                </h3>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600">
                      Año
                    </label>
                    <Select
                      value={filterYear === "" ? "" : String(filterYear)}
                      onChange={(e) =>
                        setFilterYear(e.target.value ? Number(e.target.value) : "")
                      }
                    >
                      <option value="">Todos</option>
                      {availableYears.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600">
                      Mes
                    </label>
                    <Select
                      value={filterMonth === "" ? "" : String(filterMonth)}
                      onChange={(e) =>
                        setFilterMonth(e.target.value ? Number(e.target.value) : "")
                      }
                    >
                      <option value="">Todos</option>
                      {MONTHS.map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600">
                      Tipo de papa
                    </label>
                    <Select
                      value={filterProduct}
                      onChange={(e) =>
                        setFilterProduct(
                          e.target.value === "all"
                            ? "all"
                            : (e.target.value as "FR" | "CA"),
                        )
                      }
                    >
                      <option value="all">Todas</option>
                      <option value="FR">{getStandardProductLabel("FR")}</option>
                      <option value="CA">{getStandardProductLabel("CA")}</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600">
                      Cliente
                    </label>
                    <Select
                      value={filterClient}
                      onChange={(e) => setFilterClient(e.target.value)}
                    >
                      <option value="">Todos</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Select>
                  </div>
                  {(filterDate ||
                    filterMonth !== "" ||
                    filterYear !== "" ||
                    filterClient !== "" ||
                    filterProduct !== "all") && (
                    <Button
                      variant="secondary"
                      className="min-h-[44px]"
                      onClick={() => {
                        setFilterMonth("");
                        setFilterYear("");
                        setFilterClient("");
                        setFilterProduct("all");
                      }}
                    >
                      Limpiar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
            <ShipmentsTable
              rows={paginatedRows}
              productMap={productMap}
              clientMap={clientMap}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:px-6">
                <p className="text-xs text-slate-500">
                  {filteredShipments.length} registro(s)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    disabled={safePage <= 1}
                    className="min-h-[44px]"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-slate-600">
                    Pág. {safePage} / {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={safePage >= totalPages}
                    className="min-h-[44px]"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Editar Envío
                </p>
                <h4 className="mt-1 text-lg font-semibold text-slate-900">
                  {editTarget.shipment_date}
                </h4>
              </div>
              <button
                type="button"
                className="min-h-[44px] min-w-[44px] text-sm text-slate-500 hover:text-slate-700"
                onClick={() => setEditTarget(null)}
              >
                Cerrar
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Fecha de envío
                </label>
                <Input
                  type="date"
                  value={editValues.shipment_date}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      shipment_date: e.target.value,
                    }))
                  }
                />
              </div>
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
              <Button variant="secondary" onClick={() => setEditTarget(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={isSaving}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
