import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export type KpiItem = {
  label: string;
  value?: string;
  helper?: string;
  trend?: number | null;
  lines?: Array<{ label: string; value: string }>;
};

type KpiGridProps = {
  items: KpiItem[];
};

export function KpiGrid({ items }: KpiGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const isPositive = typeof item.trend === "number" && item.trend >= 0;
        return (
          <Card key={item.label} className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {item.label}
            </p>
            {item.value && (
              <div className="flex items-center justify-between gap-3">
                <p className="text-2xl font-semibold text-slate-900">
                  {item.value}
                </p>
                {item.trend !== undefined && item.trend !== null && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-xs font-semibold",
                      isPositive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700",
                    )}
                  >
                    {isPositive ? "+" : ""}
                    {item.trend.toFixed(1)}%
                  </span>
                )}
              </div>
            )}
            {item.lines && (
              <div className="space-y-2 text-sm text-slate-600">
                {item.lines.map((line) => (
                  <div
                    key={`${item.label}-${line.label}`}
                    className="flex items-center justify-between gap-2"
                  >
                    <span>{line.label}</span>
                    <span className="font-semibold text-slate-900">
                      {line.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {item.helper && (
              <p className="text-xs text-slate-500">{item.helper}</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
