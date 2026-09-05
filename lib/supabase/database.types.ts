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
      profiles: {
        Row: {
          user_id: string;
          display_name: string | null;
          avatar_url: string | null;
          locale: Database["public"]["Enums"]["app_locale"];
          timezone: string;
          theme: Database["public"]["Enums"]["theme_mode"];
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          locale?: Database["public"]["Enums"]["app_locale"];
          timezone?: string;
          theme?: Database["public"]["Enums"]["theme_mode"];
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      reading_goals: {
        Row: {
          id: string;
          user_id: string;
          year: number;
          target_books: number;
          include_rereads: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          year: number;
          target_books: number;
          include_rereads?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reading_goals"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "reading_goals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      complete_onboarding: {
        Args: {
          p_locale: Database["public"]["Enums"]["app_locale"];
          p_timezone: string;
          p_theme: Database["public"]["Enums"]["theme_mode"];
          p_yearly_goal?: number | null;
        };
        Returns: undefined;
      };
    };
    Enums: {
      app_locale: "en" | "ru";
      theme_mode: "system" | "light" | "dark";
    };
    CompositeTypes: Record<string, never>;
  };
};
