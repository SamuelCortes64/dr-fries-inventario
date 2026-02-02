"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";

type ProductionDatum = { date: string; packages: number };
type ShipmentDatum = { name: string; packages: number };
type StockDatum = { date: string; stock: number };

type ChartsProps = {
  productionByDay: ProductionDatum[];
  shipmentsByClient: ShipmentDatum[];
  stockHistory: StockDatum[];
  showStockHistory?: boolean;
};

const pieColors = [
  "#2563eb",
  "#22c55e",
  "#f97316",
  "#a855f7",
  "#0ea5e9",
  "#f43f5e",
];

export function Charts({
  productionByDay,
  shipmentsByClient,
  stockHistory,
  showStockHistory = true,
}: ChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2 min-w-0">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Producción por día
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            Paquetes producidos
          </h3>
        </div>
        <div className="h-56 min-h-[200px] min-w-0 sm:h-64">
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <BarChart data={productionByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fill: "#64748b" }} />
              <YAxis tick={{ fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  color: "#0f172a",
                }}
              />
              <Bar dataKey="packages" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Envíos por cliente
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            Distribución mensual
          </h3>
        </div>
        <div className="h-56 min-h-[200px] min-w-0 sm:h-64">
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <PieChart>
              <Pie
                data={shipmentsByClient}
                dataKey="packages"
                nameKey="name"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={4}
              >
                {shipmentsByClient.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={pieColors[index % pieColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  color: "#0f172a",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
      {showStockHistory && (
        <Card className="lg:col-span-3">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Stock histórico
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              Evolución del inventario
            </h3>
          </div>
          <div className="h-56 min-h-[200px] min-w-0 sm:h-64">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <LineChart data={stockHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fill: "#64748b" }} />
                <YAxis tick={{ fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    color: "#0f172a",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="stock"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
