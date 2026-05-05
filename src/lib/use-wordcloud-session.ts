"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addLocalSubmission,
  defaultSession,
  readLocalSession,
  readLocalSubmissions,
  subscribeLocalChanges,
} from "./demo-store";
import { hasSupabaseConfig, mapSession, mapSubmission, supabase } from "./supabase";
import type { ParticipantSubmission, SessionConfig } from "./types";

export function useWordCloudSession(sessionCode = defaultSession.code) {
  const [session, setSession] = useState<SessionConfig>(() =>
    hasSupabaseConfig ? defaultSession : readLocalSession(),
  );
  const [submissions, setSubmissions] = useState<ParticipantSubmission[]>(() =>
    hasSupabaseConfig ? [] : readLocalSubmissions(),
  );
  const [isRemote, setIsRemote] = useState(false);
  const [isLoading, setIsLoading] = useState(hasSupabaseConfig);

  const loadLocal = useCallback(() => {
    setSession(readLocalSession());
    setSubmissions(readLocalSubmissions());
    setIsRemote(false);
    setIsLoading(false);
  }, []);

  const loadRemote = useCallback(async () => {
    if (!supabase) {
      loadLocal();
      return;
    }

    const [{ data: sessionRow }, { data: submissionRows }] = await Promise.all([
      supabase.from("presentation_sessions").select("*").eq("code", sessionCode).maybeSingle(),
      supabase
        .from("participant_submissions")
        .select("*")
        .eq("session_code", sessionCode)
        .order("created_at", { ascending: false }),
    ]);

    setSession(sessionRow ? mapSession(sessionRow) : defaultSession);
    setSubmissions((submissionRows ?? []).map(mapSubmission));
    setIsRemote(true);
    setIsLoading(false);
  }, [loadLocal, sessionCode]);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      return subscribeLocalChanges(loadLocal);
    }

    const initialLoad = window.setTimeout(() => void loadRemote(), 0);

    const channel = supabase
      ?.channel(`session-${sessionCode}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participant_submissions", filter: `session_code=eq.${sessionCode}` },
        () => void loadRemote(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "presentation_sessions", filter: `code=eq.${sessionCode}` },
        () => void loadRemote(),
      )
      .subscribe();

    return () => {
      window.clearTimeout(initialLoad);
      if (channel) {
        void supabase?.removeChannel(channel);
      }
    };
  }, [loadLocal, loadRemote, sessionCode]);

  const submitResponse = useCallback(
    async (input: { groupName: string; roomName: string; text: string }) => {
      if (supabase) {
        const { error } = await supabase.from("participant_submissions").insert({
          session_code: sessionCode,
          group_name: input.groupName,
          room_name: input.roomName,
          text: input.text,
        });

        if (error) {
          throw error;
        }

        await loadRemote();
        return;
      }

      addLocalSubmission({
        sessionCode,
        groupName: input.groupName,
        roomName: input.roomName,
        text: input.text,
      });
      loadLocal();
    },
    [loadLocal, loadRemote, sessionCode],
  );

  return {
    isLoading,
    isRemote,
    session,
    submissions,
    submitResponse,
  };
}
