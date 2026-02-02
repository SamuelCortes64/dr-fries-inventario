"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ShipmentForm } from "@/components/dashboard/ShipmentForm";
import { ShipmentsTable } from "@/components/dashboard/ShipmentsTable";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useDashboardData } from "@/hooks/useDashboardData";
import { getProductCodeById, getStandardProductOptions } from "@/lib/products";
import type { Database } from "@/lib/supabase/types";

type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];

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

  const router = useRouter();
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState<ShipmentRow | null>(null);
  const [editValues, setEditValues] = useState({
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
    if (!editValues.productId || !editValues.packages) {
      setEditError("Completa producto y paquetes.");
      return;
    }
    if (!editValues.clientId) {
      setEditError("Selecciona un cliente.");
      return;
    }
    setIsSaving(true);
    try {
      await updateShipment(editTarget.id, {
        product_id: editValues.productId,
        client_id: editValues.clientId,
        packages: Number(editValues.packages),
        notes: editValues.notes.trim() ? editValues.notes.trim() : null,
      });
      await refresh();
      setEditTarget(null);
    } catch (error) {
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
    const rows = filterDate
      ? shipments.filter((row) => row.shipment_date === filterDate)
      : shipments;
    return [...rows].sort((a, b) =>
      b.shipment_date.localeCompare(a.shipment_date),
    );
  }, [shipments, filterDate]);

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
              Operaciones
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Registrar Envíos
            </h2>
          </div>
          {filterDate && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">
                Filtro activo: {filterDate}
              </span>
              <Button variant="secondary" onClick={() => router.push("/envios")}>
                Limpiar filtro
              </Button>
            </div>
          )}
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.1fr,1.9fr]">
          <ShipmentForm
            productOptions={productOptions}
            clients={clients}
            onSubmit={handleShipmentSubmit}
            isSubmitting={isSubmitting}
          />
          <ShipmentsTable
            rows={filteredShipments}
            productMap={productMap}
            clientMap={clientMap}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </div>
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
                className="text-sm text-slate-500 hover:text-slate-700"
                onClick={() => setEditTarget(null)}
              >
                Cerrar
              </button>
            </div>
            <div className="mt-4 space-y-4">
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
              <Button
                variant="secondary"
                onClick={() => setEditTarget(null)}
              >
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
