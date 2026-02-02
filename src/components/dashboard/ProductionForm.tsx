"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import type { StandardProductOption } from "@/lib/products";
import { STANDARD_PACKAGE_KG } from "@/lib/products";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

type ProductionFormProps = {
  productOptions: StandardProductOption[];
  onSubmit: (payload: {
    production_date: string;
    product_id: string;
    packages: number;
    notes: string | null;
  }) => Promise<void>;
  isSubmitting?: boolean;
};

export function ProductionForm({
  productOptions,
  onSubmit,
  isSubmitting,
}: ProductionFormProps) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [productId, setProductId] = useState("");
  const [packages, setPackages] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const selectedProduct = useMemo(
    () => productOptions.find((product) => product.id === productId),
    [productOptions, productId],
  );

  const weightPerPackage = selectedProduct?.weight_kg ?? STANDARD_PACKAGE_KG;
  const totalWeight =
    Number(packages || 0) * (Number(weightPerPackage) || 0);

  const handleSubmit = async () => {
    setStatus(null);
    if (!date || !productId || !packages) {
      setStatus("Completa fecha, producto y paquetes.");
      return;
    }
    try {
      await onSubmit({
        production_date: date,
        product_id: productId,
        packages: Number(packages),
        notes: notes.trim() ? notes : null,
      });
      setPackages("");
      setNotes("");
      setStatus("Producción registrada.");
    } catch {
      setStatus("No se pudo registrar la producción.");
    }
  };

  return (
    <Card>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Producción Diaria
        </p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">
          Registrar Producción
        </h3>
      </div>
      <div className="mt-6 grid gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-600">Fecha</label>
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">
            Producto
          </label>
          <Select
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
          >
            <option value="">Seleccionar producto</option>
            {productOptions.map((product) => (
              <option key={product.id} value={product.id}>
                {product.label}
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
            value={packages}
            onChange={(event) => setPackages(event.target.value)}
            placeholder="0"
          />
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Peso calculado:{" "}
          <span className="font-semibold text-slate-900">
            {totalWeight.toFixed(2)} kg
          </span>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Notas</label>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notas opcionales"
          />
        </div>
        {status && <p className="text-xs text-slate-500">{status}</p>}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          Guardar Producción
        </Button>
      </div>
    </Card>
  );
}
