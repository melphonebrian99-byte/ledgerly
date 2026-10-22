/**
 * Database types mirroring `supabase/migrations/0001_init.sql`.
 *
 * HAND-WRITTEN. Once the Supabase project exists, replace this file with the
 * generated version so it can never drift from the real schema:
 *
 *   npx supabase gen types typescript --project-id <ref> > types/database.ts
 *
 * Keep the convenience aliases at the bottom either way.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TransactionKind = "income" | "expense";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          /** NULL for the shared system defaults. */
          user_id: string | null;
          name: string;
          /** Lucide icon name, resolved against a fixed registry in the UI. */
          icon: string;
          /** Hex colour, e.g. "#8b5cf6". */
          color: string;
          kind: TransactionKind;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          icon?: string;
          color?: string;
          kind: TransactionKind;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          icon?: string;
          color?: string;
          kind?: TransactionKind;
          created_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          /** Positive integer cents. Sign comes from `kind`. */
          amount_cents: number;
          kind: TransactionKind;
          category_id: string;
          /** ISO date (YYYY-MM-DD), no time component. */
          occurred_on: string;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          amount_cents: number;
          kind: TransactionKind;
          category_id: string;
          occurred_on?: string;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          amount_cents?: number;
          kind?: TransactionKind;
          category_id?: string;
          occurred_on?: string;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          /** Always the first day of the month (YYYY-MM-01). */
          month_start: string;
          limit_cents: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          month_start: string;
          limit_cents: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          month_start?: string;
          limit_cents?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      finance_summary: {
        Args: {
          p_month_start: string;
        };
        Returns: {
          total_balance_cents: number;
          month_income_cents: number;
          month_expense_cents: number;
          month_income_count: number;
          month_expense_count: number;
        }[];
      };
    };
    Enums: {
      transaction_kind: TransactionKind;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

// Convenience aliases — import these instead of spelling out the nested paths.
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];
export type BudgetInsert = Database["public"]["Tables"]["budgets"]["Insert"];
