"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ProductionForm } from "@/components/dashboard/ProductionForm";
import { ProductionTable } from "@/components/dashboard/ProductionTable";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useDashboardData } from "@/hooks/useDashboardData";
import { getProductCodeById, getStandardProductOptions } from "@/lib/products";
import type { Database } from "@/lib/supabase/types";

type ProductionRow = Database["public"]["Tables"]["production"]["Row"];

export function ProduccionPage() {
  const {
    products,
    production,
    loading,
    error,
    lastUpdated,
    refresh,
    insertProduction,
    updateProduction,
    deleteProduction,
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState<ProductionRow | null>(null);
  const [editValues, setEditValues] = useState({
    productId: "",
    packages: "",
    notes: "",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleProductionSubmit = async (payload: {
    production_date: string;
    product_id: string;
    packages: number;
    notes: string | null;
  }) => {
    setIsSubmitting(true);
    try {
      await insertProduction(payload);
      await refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (row: ProductionRow) => {
    const code = getProductCodeById(productMap, row.product_id);
    const option = code ? productOptionByCode.get(code) : null;
    setEditValues({
      productId: option?.id ?? row.product_id,
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
    setIsSaving(true);
    try {
      await updateProduction(editTarget.id, {
        product_id: editValues.productId,
        packages: Number(editValues.packages),
        notes: editValues.notes.trim() ? editValues.notes.trim() : null,
      });
      await refresh();
      setEditTarget(null);
    } catch (error) {
      setEditError("No se pudo actualizar la producción.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (row: ProductionRow) => {
    const confirmed = window.confirm(
      "¿Deseas eliminar este registro de producción?",
    );
    if (!confirmed) return;
    await deleteProduction(row.id);
    await refresh();
  };

  const filteredProduction = useMemo(() => {
    const rows = filterDate
      ? production.filter((row) => row.production_date === filterDate)
      : production;
    return [...rows].sort((a, b) =>
      b.production_date.localeCompare(a.production_date),
    );
  }, [production, filterDate]);

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
              Registrar Producción
            </h2>
          </div>
          {filterDate && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">
                Filtro activo: {filterDate}
              </span>
              <Button variant="secondary" onClick={() => router.push("/produccion")}>
                Limpiar filtro
              </Button>
            </div>
          )}
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.1fr,1.9fr]">
          <ProductionForm
            productOptions={productOptions}
            onSubmit={handleProductionSubmit}
            isSubmitting={isSubmitting}
          />
          <ProductionTable
            rows={filteredProduction}
            productMap={productMap}
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
                  Editar Producción
                </p>
                <h4 className="mt-1 text-lg font-semibold text-slate-900">
                  {editTarget.production_date}
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
