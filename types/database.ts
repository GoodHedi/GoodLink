/**
 * Types TypeScript reflétant le schéma Supabase défini dans supabase/schema.sql.
 * Aligné avec le format produit par `supabase gen types typescript`
 * (postgrest-js ≥ 1.20 : présence de `__InternalSupabase` et `Relationships`).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          bio: string | null
          avatar_url: string | null
          background_url: string | null
          background_color: string
          background_overlay: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string
          bio?: string | null
          avatar_url?: string | null
          background_url?: string | null
          background_color?: string
          background_overlay?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string
          display_name?: string
          bio?: string | null
          avatar_url?: string | null
          background_url?: string | null
          background_color?: string
          background_overlay?: number
          updated_at?: string
        }
        Relationships: []
      }
      links: {
        Row: {
          id: string
          profile_id: string
          title: string
          url: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          title: string
          url: string
          position?: number
          created_at?: string
        }
        Update: {
          title?: string
          url?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: { [key: string]: never }
    Functions: { [key: string]: never }
    Enums: { [key: string]: never }
    CompositeTypes: { [key: string]: never }
  }
}

// Raccourcis pratiques
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]
export type Link = Database["public"]["Tables"]["links"]["Row"]
export type LinkInsert = Database["public"]["Tables"]["links"]["Insert"]
export type LinkUpdate = Database["public"]["Tables"]["links"]["Update"]
