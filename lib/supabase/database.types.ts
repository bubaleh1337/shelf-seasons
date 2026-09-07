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
      library_books: {
        Row: {
          id: string;
          user_id: string;
          source: Database["public"]["Enums"]["book_source"];
          provider_id: string | null;
          title: string;
          authors: string[];
          description: string | null;
          cover_url: string | null;
          cover_path: string | null;
          isbn: string | null;
          published_year: number | null;
          page_count: number | null;
          format: Database["public"]["Enums"]["book_format"];
          status: Database["public"]["Enums"]["library_status"];
          reading_language: Database["public"]["Enums"]["reading_language"];
          season: Database["public"]["Enums"]["book_season"] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source?: Database["public"]["Enums"]["book_source"];
          provider_id?: string | null;
          title: string;
          authors?: string[];
          description?: string | null;
          cover_url?: string | null;
          cover_path?: string | null;
          isbn?: string | null;
          published_year?: number | null;
          page_count?: number | null;
          format?: Database["public"]["Enums"]["book_format"];
          status?: Database["public"]["Enums"]["library_status"];
          reading_language?: Database["public"]["Enums"]["reading_language"];
          season?: Database["public"]["Enums"]["book_season"] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["library_books"]["Insert"]>;
        Relationships: [];
      };
      reading_runs: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          status: Database["public"]["Enums"]["run_status"];
          tracking_mode: Database["public"]["Enums"]["tracking_mode"];
          started_on: string;
          finished_on: string | null;
          is_reread: boolean;
          current_position: number | null;
          total_units: number | null;
          rating: number | null;
          impression: string | null;
          reading_language: Database["public"]["Enums"]["reading_language"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          status?: Database["public"]["Enums"]["run_status"];
          tracking_mode?: Database["public"]["Enums"]["tracking_mode"];
          started_on: string;
          finished_on?: string | null;
          is_reread?: boolean;
          current_position?: number | null;
          total_units?: number | null;
          rating?: number | null;
          impression?: string | null;
          reading_language?: Database["public"]["Enums"]["reading_language"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reading_runs"]["Insert"]>;
        Relationships: [];
      };
      run_nominations: {
        Row: {
          id: string;
          user_id: string;
          run_id: string;
          kind: Database["public"]["Enums"]["nomination_kind"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          run_id: string;
          kind: Database["public"]["Enums"]["nomination_kind"];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["run_nominations"]["Insert"]>;
        Relationships: [];
      };
      recap_selections: {
        Row: {
          id: string;
          user_id: string;
          period_type: Database["public"]["Enums"]["recap_period_type"];
          period_start: string;
          category: Database["public"]["Enums"]["recap_category"];
          run_id: string | null;
          series_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_type: Database["public"]["Enums"]["recap_period_type"];
          period_start: string;
          category: Database["public"]["Enums"]["recap_category"];
          run_id?: string | null;
          series_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["recap_selections"]["Insert"]>;
        Relationships: [];
      };
      series: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          creator: string | null;
          description: string | null;
          status: Database["public"]["Enums"]["series_status"];
          cover_book_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          creator?: string | null;
          description?: string | null;
          status?: Database["public"]["Enums"]["series_status"];
          cover_book_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["series"]["Insert"]>;
        Relationships: [];
      };
      series_entries: {
        Row: {
          id: string;
          user_id: string;
          series_id: string;
          book_id: string | null;
          placeholder_title: string | null;
          sort_order: number;
          position_label: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          series_id: string;
          book_id?: string | null;
          placeholder_title?: string | null;
          sort_order: number;
          position_label: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["series_entries"]["Insert"]>;
        Relationships: [];
      };
      reading_sessions: {
        Row: {
          id: string;
          user_id: string;
          run_id: string;
          read_on: string;
          check_in_only: boolean;
          pages_read: number | null;
          minutes_read: number | null;
          resulting_percent: number | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          run_id: string;
          read_on: string;
          check_in_only?: boolean;
          pages_read?: number | null;
          minutes_read?: number | null;
          resulting_percent?: number | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reading_sessions"]["Insert"]>;
        Relationships: [];
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
      log_reading_session: {
        Args: {
          p_book_id: string;
          p_read_on?: string | null;
          p_check_in_only?: boolean;
          p_pages_read?: number | null;
          p_minutes_read?: number | null;
          p_resulting_percent?: number | null;
          p_note?: string | null;
        };
        Returns: string;
      };
      set_library_book_status: {
        Args: {
          p_book_id: string;
          p_status: Database["public"]["Enums"]["library_status"];
          p_changed_on?: string | null;
        };
        Returns: undefined;
      };
      finish_reading_run: {
        Args: {
          p_book_id: string;
          p_finished_on: string;
          p_rating?: number | null;
          p_impression?: string | null;
          p_nomination?: Database["public"]["Enums"]["nomination_kind"] | null;
        };
        Returns: string;
      };
      reorder_series_entries: {
        Args: {
          p_series_id: string;
          p_entry_ids: string[];
        };
        Returns: undefined;
      };
      delete_own_account: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      app_locale: "en" | "ru";
      theme_mode: "system" | "light" | "dark";
      book_source: "manual" | "google_books" | "open_library";
      book_format: "print" | "ebook" | "audiobook";
      library_status: "want" | "reading" | "read" | "paused" | "dnf";
      tracking_mode: "pages" | "percent" | "minutes";
      run_status: "reading" | "paused" | "completed" | "dnf";
      nomination_kind: "favorite" | "disappointment";
      series_status: "planned" | "in_progress" | "completed" | "abandoned";
      recap_period_type: "month" | "year";
      recap_category: "favorite_book" | "biggest_disappointment" | "favorite_cover" | "favorite_series";
      book_season: "spring" | "summer" | "autumn" | "winter";
      reading_language: "ru" | "en" | "other";
    };
    CompositeTypes: Record<string, never>;
  };
};
