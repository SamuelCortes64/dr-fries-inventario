import type { GroupedInventoryRow } from "@/lib/products";
import { Card } from "@/components/ui/Card";

type InventoryTableProps = {
  inventory: GroupedInventoryRow[];
};

export function InventoryTable({ inventory }: InventoryTableProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Inventario Actual
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            Stock por Producto
          </h3>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="py-3 pr-4">Código</th>
              <th className="py-3 pr-4">Producto</th>
              <th className="py-3 pr-4 text-right">Producido</th>
              <th className="py-3 pr-4 text-right">Enviado</th>
              <th className="py-3 pr-4 text-right">Stock</th>
              <th className="py-3 pr-4 text-right">Peso (kg)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-600">
            {inventory.map((row, index) => (
              <tr
                key={row.code}
                className={index % 2 === 1 ? "bg-slate-50/70" : "bg-white"}
              >
                <td className="py-3 pr-4 font-semibold text-slate-900">
                  {row.code ?? "-"}
                </td>
                <td className="py-3 pr-4 text-slate-700">{row.name}</td>
                <td className="py-3 pr-4 text-right">
                  {row.total_produced_packages ?? 0}
                </td>
                <td className="py-3 pr-4 text-right">
                  {row.total_shipped_packages ?? 0}
                </td>
                <td className="py-3 pr-4 text-right font-semibold text-slate-900">
                  {row.stock_packages ?? 0}
                </td>
                <td className="py-3 pr-4 text-right">
                  {((row.stock_packages ?? 0) * (row.weight_kg ?? 0)).toFixed(2)}
                </td>
              </tr>
            ))}
            {inventory.length === 0 && (
              <tr>
                <td className="py-6 text-center text-slate-500" colSpan={6}>
                  Sin datos de inventario disponibles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
