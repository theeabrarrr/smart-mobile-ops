export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mobiles: {
        Row: {
          brand: string
          condition: Database["public"]["Enums"]["mobile_condition"]
          created_at: string
          id: string
          imei: string | null
          is_sold: boolean
          model: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          seller_cnic: string | null
          seller_phone: string | null
          selling_price: number | null
          supplier_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand: string
          condition?: Database["public"]["Enums"]["mobile_condition"]
          created_at?: string
          id?: string
          imei?: string | null
          is_sold?: boolean
          model: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          seller_cnic?: string | null
          seller_phone?: string | null
          selling_price?: number | null
          supplier_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string
          condition?: Database["public"]["Enums"]["mobile_condition"]
          created_at?: string
          id?: string
          imei?: string | null
          is_sold?: boolean
          model?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          seller_cnic?: string | null
          seller_phone?: string | null
          selling_price?: number | null
          supplier_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          business_name: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          subscription_expires_at: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          business_name?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          created_at: string
          id: string
          mobile_id: string
          notes: string | null
          purchase_date: string
          purchase_price: number
          seller_cnic: string | null
          seller_phone: string | null
          supplier_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mobile_id: string
          notes?: string | null
          purchase_date?: string
          purchase_price: number
          seller_cnic?: string | null
          seller_phone?: string | null
          supplier_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mobile_id?: string
          notes?: string | null
          purchase_date?: string
          purchase_price?: number
          seller_cnic?: string | null
          seller_phone?: string | null
          supplier_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_mobile_id_fkey"
            columns: ["mobile_id"]
            isOneToOne: false
            referencedRelation: "mobiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          mobile_id: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          sale_date: string
          sale_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          mobile_id: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          sale_date?: string
          sale_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          mobile_id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          sale_date?: string
          sale_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_mobile_id_fkey"
            columns: ["mobile_id"]
            isOneToOne: false
            referencedRelation: "mobiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_logs: {
        Row: {
          action: string
          created_at: string
          from_tier: string | null
          id: string
          reason: string | null
          to_tier: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          from_tier?: string | null
          id?: string
          reason?: string | null
          to_tier?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          from_tier?: string | null
          id?: string
          reason?: string | null
          to_tier?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_subscription_tier: {
        Args: { _required_tier: string; _user_id: string }
        Returns: boolean
      }
      get_expiring_subscriptions: {
        Args: { days_ahead?: number }
        Returns: {
          days_remaining: number
          email: string
          expires_at: string
          full_name: string
          subscription_tier: string
          user_id: string
        }[]
      }
      get_user_mobile_count: { Args: { _user_id: string }; Returns: number }
      handle_subscription_expiry: {
        Args: never
        Returns: {
          downgraded_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      mobile_condition: "new" | "excellent" | "good" | "fair" | "poor"
      payment_status: "pending" | "paid" | "partial" | "cancelled"
      subscription_tier: "basic" | "standard" | "premium"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      mobile_condition: ["new", "excellent", "good", "fair", "poor"],
      payment_status: ["pending", "paid", "partial", "cancelled"],
      subscription_tier: ["basic", "standard", "premium"],
    },
  },
} as const
