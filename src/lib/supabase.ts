import { createClient } from "@supabase/supabase-js";
import type { ParticipantSubmission, SessionConfig } from "./types";

export type Database = {
  public: {
    Tables: {
      presentation_sessions: {
        Row: {
          code: string;
          title: string;
          question: string;
          frame_id: string;
          color_theme: string[];
          is_accepting_responses: boolean;
          created_at: string;
        };
        Insert: {
          code: string;
          title: string;
          question: string;
          frame_id?: string;
          color_theme?: string[];
          is_accepting_responses?: boolean;
        };
        Update: {
          code?: string;
          title?: string;
          question?: string;
          frame_id?: string;
          color_theme?: string[];
          is_accepting_responses?: boolean;
        };
        Relationships: [];
      };
      participant_submissions: {
        Row: {
          id: string;
          session_code: string;
          group_name: string;
          room_name: string;
          text: string;
          created_at: string;
        };
        Insert: {
          session_code: string;
          group_name: string;
          room_name: string;
          text: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "participant_submissions_session_code_fkey";
            columns: ["session_code"];
            isOneToOne: false;
            referencedRelation: "presentation_sessions";
            referencedColumns: ["code"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : null;

export function mapSession(row: Database["public"]["Tables"]["presentation_sessions"]["Row"]): SessionConfig {
  return {
    code: row.code,
    title: row.title,
    question: row.question,
    frameId: row.frame_id as SessionConfig["frameId"],
    colorTheme: row.color_theme,
    isAcceptingResponses: row.is_accepting_responses,
  };
}

export function mapSubmission(
  row: Database["public"]["Tables"]["participant_submissions"]["Row"],
): ParticipantSubmission {
  return {
    id: row.id,
    sessionCode: row.session_code,
    groupName: row.group_name,
    roomName: row.room_name,
    text: row.text,
    createdAt: row.created_at,
  };
}
