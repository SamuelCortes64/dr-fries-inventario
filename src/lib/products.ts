import { isWithinInterval, parseISO } from "date-fns";
import type { Database } from "@/lib/supabase/types";

export const STANDARD_PACKAGE_KG = 2.5;
export const STANDARD_PRODUCT_CODES = ["FR", "CA"] as const;
export type StandardProductCode = (typeof STANDARD_PRODUCT_CODES)[number];

type Product = Database["public"]["Tables"]["products"]["Row"];
type InventoryRow = Database["public"]["Views"]["inventory_summary"]["Row"];

const STANDARD_BASE_LABELS: Record<StandardProductCode, string> = {
  FR: "Papa a la francesa",
  CA: "Papas en cascos",
};

const formatWeight = (weightKg: number) => {
  const fixed = weightKg.toFixed(1);
  return fixed.endsWith(".0") ? fixed.slice(0, -2) : fixed;
};

export function normalizeCode(code?: string | null) {
  return (code ?? "").trim().toUpperCase();
}

export function isStandardCode(
  code?: string | null,
): code is StandardProductCode {
  return STANDARD_PRODUCT_CODES.includes(normalizeCode(code) as StandardProductCode);
}

export function getStandardProductLabel(
  code?: string | null,
  weightKg: number = STANDARD_PACKAGE_KG,
  options?: { compact?: boolean },
) {
  const normalized = normalizeCode(code) as StandardProductCode;
  const base = STANDARD_BASE_LABELS[normalized];
  if (!base) return "Producto";
  const weightValue = formatWeight(weightKg);
  const suffix = options?.compact ? `${weightValue}kg` : `${weightValue} kg`;
  return `${base} (${suffix})`;
}

const scoreProduct = (product: Product) => {
  let score = 0;
  if (
    product.weight_kg !== null &&
    Math.abs(product.weight_kg - STANDARD_PACKAGE_KG) < 0.01
  ) {
    score += 3;
  }
  const name = product.name?.toLowerCase() ?? "";
  if (name.includes("estandar") || name.includes("estándar")) score += 2;
  if (name.includes("bolsa")) score += 1;
  if (name.includes("2.5") || name.includes("2,5")) score += 1;
  return score;
};

export type StandardProductOption = {
  id: string;
  code: StandardProductCode;
  label: string;
  weight_kg: number;
};

export function getStandardProductOptions(
  products: Product[],
): StandardProductOption[] {
  const byCode = new Map<StandardProductCode, Product>();

  products.forEach((product) => {
    if (!isStandardCode(product.code)) return;
    const code = normalizeCode(product.code) as StandardProductCode;
    const existing = byCode.get(code);
    if (!existing || scoreProduct(product) > scoreProduct(existing)) {
      byCode.set(code, product);
    }
  });

  return STANDARD_PRODUCT_CODES.map((code) => {
    const product = byCode.get(code);
    if (!product) return null;
    const weight = product.weight_kg ?? STANDARD_PACKAGE_KG;
    return {
      id: product.id,
      code,
      label: getStandardProductLabel(code, weight, { compact: true }),
      weight_kg: weight,
    };
  }).filter(Boolean) as StandardProductOption[];
}

export function getProductCodeById(
  productMap: Map<string, Product>,
  productId: string,
) {
  const code = normalizeCode(productMap.get(productId)?.code);
  return isStandardCode(code) ? (code as StandardProductCode) : null;
}

export function getProductLabelById(
  productMap: Map<string, Product>,
  productId: string,
) {
  const product = productMap.get(productId);
  if (!product) return "Producto";
  if (isStandardCode(product.code)) {
    return getStandardProductLabel(
      product.code,
      product.weight_kg ?? STANDARD_PACKAGE_KG,
    );
  }
  return product.name ?? "Producto";
}

export type GroupedInventoryRow = {
  code: StandardProductCode;
  name: string;
  total_produced_packages: number;
  total_shipped_packages: number;
  stock_packages: number;
  weight_kg: number;
};

export function groupInventoryByCode(
  inventory: InventoryRow[],
): GroupedInventoryRow[] {
  const grouped = new Map<StandardProductCode, GroupedInventoryRow>();

  inventory.forEach((row) => {
    if (!isStandardCode(row.code)) return;
    const code = normalizeCode(row.code) as StandardProductCode;
    const weight = row.weight_kg ?? STANDARD_PACKAGE_KG;
    const existing = grouped.get(code);
    const produced = row.total_produced_packages ?? 0;
    const shipped = row.total_shipped_packages ?? 0;
    const stock = row.stock_packages ?? 0;

    if (!existing) {
      grouped.set(code, {
        code,
        name: getStandardProductLabel(code, weight),
        total_produced_packages: produced,
        total_shipped_packages: shipped,
        stock_packages: stock,
        weight_kg: weight,
      });
      return;
    }

    grouped.set(code, {
      ...existing,
      total_produced_packages: existing.total_produced_packages + produced,
      total_shipped_packages: existing.total_shipped_packages + shipped,
      stock_packages: existing.stock_packages + stock,
    });
  });

  return STANDARD_PRODUCT_CODES.map((code) => grouped.get(code)).filter(
    Boolean,
  ) as GroupedInventoryRow[];
}

type DatedRow = {
  product_id: string;
  packages: number;
  [key: string]: string | number | null;
};

export function sumPackagesByCode<T extends DatedRow>(
  rows: T[],
  productMap: Map<string, Product>,
  dateKey?: keyof T,
  range?: { start: Date; end: Date },
) {
  const totals = { FR: 0, CA: 0, total: 0 };

  rows.forEach((row) => {
    if (dateKey && range) {
      const value = row[dateKey];
      if (typeof value !== "string") return;
      const date = parseISO(value);
      if (!isWithinInterval(date, range)) return;
    }
    const code = getProductCodeById(productMap, String(row.product_id));
    if (!code) return;
    totals[code] += Number(row.packages ?? 0);
    totals.total += Number(row.packages ?? 0);
  });

  return totals;
}
