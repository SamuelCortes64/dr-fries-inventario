export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          code: string | null;
          name: string;
          weight_kg: number | null;
        };
        Insert: {
          id?: string;
          code?: string | null;
          name: string;
          weight_kg?: number | null;
        };
        Update: {
          id?: string;
          code?: string | null;
          name?: string;
          weight_kg?: number | null;
        };
      };
      production: {
        Row: {
          id: number;
          production_date: string;
          product_id: string;
          packages: number;
          notes: string | null;
        };
        Insert: {
          id?: number;
          production_date: string;
          product_id: string;
          packages: number;
          notes?: string | null;
        };
        Update: {
          id?: number;
          production_date?: string;
          product_id?: string;
          packages?: number;
          notes?: string | null;
        };
      };
      shipments: {
        Row: {
          id: number;
          shipment_date: string;
          product_id: string;
          client_id: string;
          packages: number;
          notes: string | null;
        };
        Insert: {
          id?: number;
          shipment_date: string;
          product_id: string;
          client_id: string;
          packages: number;
          notes?: string | null;
        };
        Update: {
          id?: number;
          shipment_date?: string;
          product_id?: string;
          client_id?: string;
          packages?: number;
          notes?: string | null;
        };
      };
      clients: {
        Row: {
          id: string;
          name: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string | null;
        };
      };
      movements: {
        Row: {
          id: string;
          fecha: string;
          product_id: string;
          client_id: string | null;
          cantidad: number;
          notas: string | null;
        };
        Insert: {
          id?: string;
          fecha: string;
          product_id: string;
          client_id?: string | null;
          cantidad: number;
          notas?: string | null;
        };
        Update: {
          id?: string;
          fecha?: string;
          product_id?: string;
          client_id?: string | null;
          cantidad?: number;
          notas?: string | null;
        };
      };
    };
    Views: {
      inventory_summary: {
        Row: {
          product_id: string;
          code: string | null;
          name: string;
          total_produced_packages: number | null;
          total_shipped_packages: number | null;
          stock_packages: number | null;
          weight_kg: number | null;
        };
      };
    };
  };
};
