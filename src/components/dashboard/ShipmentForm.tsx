"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import type { Database } from "@/lib/supabase/types";
import type { StandardProductOption } from "@/lib/products";
import { STANDARD_PACKAGE_KG } from "@/lib/products";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

type Client = Database["public"]["Tables"]["clients"]["Row"];

type ShipmentFormProps = {
  productOptions: StandardProductOption[];
  clients: Client[];
  onSubmit: (payload: {
    shipment_date: string;
    product_id: string;
    client_id: string;
    packages: number;
    notes: string | null;
  }) => Promise<void>;
  isSubmitting?: boolean;
};

export function ShipmentForm({
  productOptions,
  clients,
  onSubmit,
  isSubmitting,
}: ShipmentFormProps) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [productId, setProductId] = useState("");
  const [clientId, setClientId] = useState("");
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
    if (!date || !productId || !clientId || !packages) {
      setStatus("Completa fecha, cliente, producto y paquetes.");
      return;
    }
    try {
      await onSubmit({
        shipment_date: date,
        product_id: productId,
        client_id: clientId,
        packages: Number(packages),
        notes: notes.trim() ? notes : null,
      });
      setPackages("");
      setNotes("");
      setStatus("Envío registrado.");
    } catch {
      setStatus("No se pudo registrar el envío.");
    }
  };

  return (
    <Card>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Envíos
        </p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">
          Registrar Envíos
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
          <label className="text-xs font-semibold text-slate-600">Cliente</label>
          <Select
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
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
          Guardar Envío
        </Button>
      </div>
    </Card>
  );
}
