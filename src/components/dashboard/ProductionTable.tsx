import type { Database } from "@/lib/supabase/types";
import { Card } from "@/components/ui/Card";
import { getProductLabelById, STANDARD_PACKAGE_KG } from "@/lib/products";

type ProductionRow = Database["public"]["Tables"]["production"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];

type ProductionTableProps = {
  rows: ProductionRow[];
  productMap: Map<string, Product>;
  onEdit: (row: ProductionRow) => void;
  onDelete: (row: ProductionRow) => void;
};

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

export function ProductionTable({
  rows,
  productMap,
  onEdit,
  onDelete,
}: ProductionTableProps) {
  return (
    <Card>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Listado de Producción
        </p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">
          Tabla de registros
        </h3>
      </div>
      <div className="mt-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="py-3 pr-4">Fecha</th>
              <th className="py-3 pr-4">Producto</th>
              <th className="py-3 pr-4 text-right">Paquetes</th>
              <th className="py-3 pr-4 text-right">Peso (kg)</th>
              <th className="py-3 pr-4">Notas</th>
              <th className="py-3 pr-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-600">
            {rows.map((row, index) => (
              <tr
                key={`${row.id}-${index}`}
                className={index % 2 === 1 ? "bg-slate-50/70" : "bg-white"}
              >
                <td className="py-3 pr-4 font-semibold text-slate-900">
                  {row.production_date}
                </td>
                <td className="py-3 pr-4">
                  {getProductLabelById(productMap, row.product_id)}
                </td>
                <td className="py-3 pr-4 text-right">{row.packages}</td>
                <td className="py-3 pr-4 text-right">
                  {(row.packages * STANDARD_PACKAGE_KG).toFixed(1)}
                </td>
                <td className="py-3 pr-4 text-slate-500">
                  {row.notes ?? "-"}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[#f97316] transition hover:bg-slate-50 hover:text-[#ea580c]"
                    >
                      <PencilIcon className="h-4 w-4 text-[#f97316]" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(row)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[#dc3545] transition hover:bg-slate-50 hover:text-[#b02a37]"
                    >
                      <TrashIcon className="h-4 w-4 text-[#dc3545]" />
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="py-6 text-center text-slate-500" colSpan={6}>
                  Sin producción registrada para este período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
