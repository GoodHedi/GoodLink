/**
 * Types TypeScript reflétant le schéma Supabase v2 défini dans
 * supabase/schema.sql.
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

export type LinkType = "link" | "header" | "social"
export type LinkShape = "pill" | "rounded" | "square"
export type FontFamily = "sans" | "serif" | "mono" | "display"
export type WorkspaceRole = "owner" | "editor" | "viewer"
export type AccountTier = "visiteur" | "pro" | "agence" | "agence_client"
export type ShareRole = "viewer" | "editor"

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string
          username: string
          age: number | null
          tier: AccountTier
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier_expires_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          age?: number | null
          tier?: AccountTier
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_expires_at?: string | null
          created_at?: string
        }
        Update: {
          username?: string
          age?: number | null
          tier?: AccountTier
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      workspaces: {
        Row: {
          id: string
          name: string
          created_by: string
          is_personal: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          is_personal?: boolean
          created_at?: string
        }
        Update: { name?: string; is_personal?: boolean }
        Relationships: []
      }
      workspace_members: {
        Row: {
          workspace_id: string
          user_id: string
          role: WorkspaceRole
          joined_at: string
        }
        Insert: {
          workspace_id: string
          user_id: string
          role?: WorkspaceRole
          joined_at?: string
        }
        Update: { role?: WorkspaceRole }
        Relationships: []
      }
      workspace_invites: {
        Row: {
          id: string
          workspace_id: string
          email: string
          role: WorkspaceRole
          token: string
          invited_by: string
          expires_at: string
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          email: string
          role?: WorkspaceRole
          token?: string
          invited_by: string
          expires_at?: string
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          email?: string
          role?: WorkspaceRole
        }
        Relationships: []
      }
      pages: {
        Row: {
          id: string
          owner_id: string
          workspace_id: string
          username: string
          display_name: string
          bio: string | null
          avatar_url: string | null
          background_url: string | null
          background_desktop_url: string | null
          background_color: string
          background_overlay: number
          link_color: string
          link_shape: LinkShape
          font_family: FontFamily
          audio_url: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          workspace_id: string
          username: string
          display_name?: string
          bio?: string | null
          avatar_url?: string | null
          background_url?: string | null
          background_desktop_url?: string | null
          background_color?: string
          background_overlay?: number
          link_color?: string
          link_shape?: LinkShape
          font_family?: FontFamily
          audio_url?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          workspace_id?: string
          username?: string
          display_name?: string
          bio?: string | null
          avatar_url?: string | null
          background_url?: string | null
          background_desktop_url?: string | null
          background_color?: string
          background_overlay?: number
          link_color?: string
          link_shape?: LinkShape
          font_family?: FontFamily
          audio_url?: string | null
          is_published?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      links: {
        Row: {
          id: string
          page_id: string
          type: LinkType
          title: string
          url: string
          platform: string | null
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          page_id: string
          type?: LinkType
          title: string
          url?: string
          platform?: string | null
          position?: number
          created_at?: string
        }
        Update: {
          type?: LinkType
          title?: string
          url?: string
          platform?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "links_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          }
        ]
      }
      page_views: {
        Row: {
          id: number
          page_id: string
          viewed_at: string
        }
        Insert: {
          id?: number
          page_id: string
          viewed_at?: string
        }
        Update: {
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_views_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          }
        ]
      }
      qr_scans: {
        Row: {
          id: number
          qr_id: string
          scanned_at: string
        }
        Insert: {
          id?: number
          qr_id: string
          scanned_at?: string
        }
        Update: {
          scanned_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_scans_qr_id_fkey"
            columns: ["qr_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          }
        ]
      }
      link_clicks: {
        Row: {
          id: number
          link_id: string
          clicked_at: string
        }
        Insert: {
          id?: number
          link_id: string
          clicked_at?: string
        }
        Update: {
          clicked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          }
        ]
      }
      qr_codes: {
        Row: {
          id: string
          owner_id: string
          workspace_id: string
          label: string
          target_url: string
          fg_color: string
          bg_color: string
          logo_url: string | null
          tracked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          workspace_id: string
          label: string
          target_url: string
          fg_color?: string
          bg_color?: string
          logo_url?: string | null
          tracked?: boolean
          created_at?: string
        }
        Update: {
          label?: string
          target_url?: string
          fg_color?: string
          bg_color?: string
          logo_url?: string | null
          tracked?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      agency_codes: {
        Row: {
          id: string
          agency_account_id: string
          code: string
          label: string
          created_at: string
          revoked_at: string | null
        }
        Insert: {
          id?: string
          agency_account_id: string
          code: string
          label?: string
          created_at?: string
          revoked_at?: string | null
        }
        Update: {
          label?: string
          revoked_at?: string | null
        }
        Relationships: []
      }
      agency_clients: {
        Row: {
          agency_account_id: string
          client_account_id: string
          code_id: string
          joined_at: string
        }
        Insert: {
          agency_account_id: string
          client_account_id: string
          code_id: string
          joined_at?: string
        }
        Update: { joined_at?: string }
        Relationships: []
      }
      page_shares: {
        Row: {
          page_id: string
          shared_with_user_id: string
          shared_by_user_id: string
          role: ShareRole
          created_at: string
        }
        Insert: {
          page_id: string
          shared_with_user_id: string
          shared_by_user_id: string
          role?: ShareRole
          created_at?: string
        }
        Update: { role?: ShareRole }
        Relationships: []
      }
      qr_shares: {
        Row: {
          qr_id: string
          shared_with_user_id: string
          shared_by_user_id: string
          role: ShareRole
          created_at: string
        }
        Insert: {
          qr_id: string
          shared_with_user_id: string
          shared_by_user_id: string
          role?: ShareRole
          created_at?: string
        }
        Update: { role?: ShareRole }
        Relationships: []
      }
    }
    Views: { [key: string]: never }
    Functions: {
      accept_workspace_invite: {
        Args: { p_token: string }
        Returns: string
      }
      activate_agency_code: {
        Args: { p_code: string }
        Returns: string
      }
      revoke_agency_code: {
        Args: { p_code_id: string }
        Returns: number
      }
    }
    Enums: { [key: string]: never }
    CompositeTypes: { [key: string]: never }
  }
}

// Raccourcis pratiques
export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"]
export type WorkspaceMember = Database["public"]["Tables"]["workspace_members"]["Row"]
export type WorkspaceInvite = Database["public"]["Tables"]["workspace_invites"]["Row"]
export type Account = Database["public"]["Tables"]["accounts"]["Row"]
export type AccountUpdate = Database["public"]["Tables"]["accounts"]["Update"]
export type Page = Database["public"]["Tables"]["pages"]["Row"]
export type PageInsert = Database["public"]["Tables"]["pages"]["Insert"]
export type PageUpdate = Database["public"]["Tables"]["pages"]["Update"]
export type Link = Database["public"]["Tables"]["links"]["Row"]
export type LinkInsert = Database["public"]["Tables"]["links"]["Insert"]
export type LinkUpdate = Database["public"]["Tables"]["links"]["Update"]
export type QrCode = Database["public"]["Tables"]["qr_codes"]["Row"]
export type QrCodeInsert = Database["public"]["Tables"]["qr_codes"]["Insert"]
export type QrCodeUpdate = Database["public"]["Tables"]["qr_codes"]["Update"]
export type QrScan = Database["public"]["Tables"]["qr_scans"]["Row"]
export type AgencyCode = Database["public"]["Tables"]["agency_codes"]["Row"]
export type AgencyClient = Database["public"]["Tables"]["agency_clients"]["Row"]
export type PageShare = Database["public"]["Tables"]["page_shares"]["Row"]
export type QrShare = Database["public"]["Tables"]["qr_shares"]["Row"]
