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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      club_invites: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          label: string | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id: string
          label?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          label?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "club_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_invites_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "club_users"
            referencedColumns: ["id"]
          },
        ]
      }
      club_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          session_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id: string
          note?: string | null
          session_id?: string | null
          status: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          session_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_payments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "club_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "club_users"
            referencedColumns: ["id"]
          },
        ]
      }
      club_rsvps: {
        Row: {
          id: string
          session_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id: string
          session_id: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          session_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_rsvps_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "club_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "club_users"
            referencedColumns: ["id"]
          },
        ]
      }
      club_sessions: {
        Row: {
          cost_per_player: number
          courts_booked: number
          created_at: string
          created_by: string | null
          date: string
          end_time: string
          id: string
          location: string
          map_link: string | null
          max_players: number
          start_time: string
          title: string
        }
        Insert: {
          cost_per_player?: number
          courts_booked?: number
          created_at?: string
          created_by?: string | null
          date: string
          end_time: string
          id: string
          location: string
          map_link?: string | null
          max_players: number
          start_time: string
          title: string
        }
        Update: {
          cost_per_player?: number
          courts_booked?: number
          created_at?: string
          created_by?: string | null
          date?: string
          end_time?: string
          id?: string
          location?: string
          map_link?: string | null
          max_players?: number
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "club_users"
            referencedColumns: ["id"]
          },
        ]
      }
      club_users: {
        Row: {
          approved: boolean
          bio: string | null
          created_at: string
          email: string
          home_venue: string | null
          id: string
          joined_at: string
          name: string
          password: string
          role: string
          tier: string | null
        }
        Insert: {
          approved?: boolean
          bio?: string | null
          created_at?: string
          email: string
          home_venue?: string | null
          id: string
          joined_at?: string
          name: string
          password: string
          role: string
          tier?: string | null
        }
        Update: {
          approved?: boolean
          bio?: string | null
          created_at?: string
          email?: string
          home_venue?: string | null
          id?: string
          joined_at?: string
          name?: string
          password?: string
          role?: string
          tier?: string | null
        }
        Relationships: []
      }
      games: {
        Row: {
          created_at: string | null
          date: string
          id: string
          location: string
          max_capacity: number | null
          status: Database["public"]["Enums"]["game_status"] | null
          time: string
          total_cost: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          location: string
          max_capacity?: number | null
          status?: Database["public"]["Enums"]["game_status"] | null
          time: string
          total_cost?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          location?: string
          max_capacity?: number | null
          status?: Database["public"]["Enums"]["game_status"] | null
          time?: string
          total_cost?: number | null
        }
        Relationships: []
      }
      ledger: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          game_id: string | null
          id: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          game_id?: string | null
          id?: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          game_id?: string | null
          id?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvps: {
        Row: {
          created_at: string | null
          game_id: string | null
          id: string
          status: Database["public"]["Enums"]["rsvp_status"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          status: Database["public"]["Enums"]["rsvp_status"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          balance: number | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      game_status: "upcoming" | "completed" | "cancelled"
      rsvp_status: "in" | "out" | "tentative" | "+1"
      transaction_type: "charge" | "payment"
      user_role: "admin" | "player" | "pending"
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
      game_status: ["upcoming", "completed", "cancelled"],
      rsvp_status: ["in", "out", "tentative", "+1"],
      transaction_type: ["charge", "payment"],
      user_role: ["admin", "player", "pending"],
    },
  },
} as const
