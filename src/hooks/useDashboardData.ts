"use client";

import { useCallback, useEffect, useState } from "react";
import { format, subMonths } from "date-fns";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Client = Database["public"]["Tables"]["clients"]["Row"];
type ProductionRow = Database["public"]["Tables"]["production"]["Row"];
type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];
type InventoryRow = Database["public"]["Views"]["inventory_summary"]["Row"];
type ProductionInsert = Database["public"]["Tables"]["production"]["Insert"];
type ShipmentInsert = Database["public"]["Tables"]["shipments"]["Insert"];
type ProductionUpdate = Database["public"]["Tables"]["production"]["Update"];
type ShipmentUpdate = Database["public"]["Tables"]["shipments"]["Update"];

type DashboardState = {
  products: Product[];
  clients: Client[];
  production: ProductionRow[];
  shipments: ShipmentRow[];
  inventory: InventoryRow[];
};

const emptyState: DashboardState = {
  products: [],
  clients: [],
  production: [],
  shipments: [],
  inventory: [],
};

export function useDashboardData() {
  const [state, setState] = useState<DashboardState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const startDate = format(subMonths(new Date(), 12), "yyyy-MM-dd");

    const [
      productsResponse,
      clientsResponse,
      productionResponse,
      shipmentsResponse,
      inventoryResponse,
    ] = await Promise.all([
      supabase.from("products").select("*").order("name", { ascending: true }),
      supabase.from("clients").select("*").order("name", { ascending: true }),
      supabase
        .from("production")
        .select("*")
        .gte("production_date", startDate)
        .order("production_date", { ascending: true }),
      supabase
        .from("shipments")
        .select("*")
        .gte("shipment_date", startDate)
        .order("shipment_date", { ascending: true }),
      supabase.from("inventory_summary").select("*").order("name"),
    ]);

    const firstError =
      productsResponse.error ||
      clientsResponse.error ||
      productionResponse.error ||
      shipmentsResponse.error ||
      inventoryResponse.error;

    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    setState({
      products: productsResponse.data ?? [],
      clients: clientsResponse.data ?? [],
      production: productionResponse.data ?? [],
      shipments: shipmentsResponse.data ?? [],
      inventory: inventoryResponse.data ?? [],
    });
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    const load = () => {
      refresh();
    };
    const id = setTimeout(load, 0);

    const channel = supabase
      .channel("inventory-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "production" },
        () => refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shipments" },
        () => refresh(),
      )
      .subscribe();

    return () => {
      clearTimeout(id);
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const insertProduction = useCallback(async (payload: ProductionInsert) => {
    const { error: insertError } = await supabase
      .from("production")
      // @ts-expect-error Supabase client infers never for insert; payload matches Insert type
      .insert(payload);
    if (insertError) {
      throw insertError;
    }
  }, []);

  const insertShipment = useCallback(async (payload: ShipmentInsert) => {
    const { error: insertError } = await supabase
      .from("shipments")
      // @ts-expect-error Supabase client infers never for insert; payload matches Insert type
      .insert(payload);
    if (insertError) {
      throw insertError;
    }
  }, []);

  const updateProduction = useCallback(
    async (id: number, payload: ProductionUpdate) => {
      const { error: updateError } = await supabase
        .from("production")
        // @ts-expect-error Supabase client infers never for update; payload matches Update type
        .update(payload)
        .eq("id", id);
      if (updateError) {
        throw updateError;
      }
    },
    [],
  );

  const updateShipment = useCallback(
    async (id: number, payload: ShipmentUpdate) => {
      const { error: updateError } = await supabase
        .from("shipments")
        // @ts-expect-error Supabase client infers never for update; payload matches Update type
        .update(payload)
        .eq("id", id);
      if (updateError) {
        throw updateError;
      }
    },
    [],
  );

  const deleteProduction = useCallback(async (id: number) => {
    const { error: deleteError } = await supabase
      .from("production")
      .delete()
      .eq("id", id);
    if (deleteError) {
      throw deleteError;
    }
  }, []);

  const deleteShipment = useCallback(async (id: number) => {
    const { error: deleteError } = await supabase
      .from("shipments")
      .delete()
      .eq("id", id);
    if (deleteError) {
      throw deleteError;
    }
  }, []);

  return {
    ...state,
    loading,
    error,
    lastUpdated,
    refresh,
    insertProduction,
    insertShipment,
    updateProduction,
    updateShipment,
    deleteProduction,
    deleteShipment,
  };
}
