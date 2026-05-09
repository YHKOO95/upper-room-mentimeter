"use client";

import { useCallback, useEffect, useState } from "react";
import type { ShapeKind, WordEntry } from "./types";
import { hasSupabaseConfig, supabase } from "./supabase";

const STORAGE_KEY = "upperroom.menti.v2";
export const DEFAULT_SESSION_CODE = "UPPER";
export const DEFAULT_SHAPE: ShapeKind = "poster";

// ─── Store state ──────────────────────────────────────────────────────────────

export type StoreState = {
  code: string;
  question: string;
  subtitle: string;
  shape: ShapeKind;
  words: WordEntry[];
};

function cryptoId() {
  return Math.random().toString(36).slice(2, 9);
}

const SEED_WORDS = [
  ["기도", 4], ["말씀", 3], ["예배", 3], ["공동체", 2], ["찬양", 2],
  ["고요", 2], ["새벽", 1], ["감사", 2], ["묵상", 1], ["은혜", 3],
  ["회복", 1], ["빛", 2], ["소망", 1], ["눈물", 1], ["일터", 1],
];

function defaultState(): StoreState {
  return {
    code: DEFAULT_SESSION_CODE,
    question: "",
    subtitle: "",
    shape: DEFAULT_SHAPE,
    words: SEED_WORDS.map(([t, c]) => ({
      id: cryptoId(),
      text: t as string,
      count: c as number,
      ts: Date.now() - Math.random() * 60000,
    })),
  };
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadLocal(): StoreState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState(), ...(JSON.parse(raw) as StoreState) };
  } catch {}
  const s = defaultState();
  saveLocal(s);
  return s;
}

function saveLocal(s: StoreState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
  window.dispatchEvent(new Event("ur-changed"));
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────

// Aggregate raw text submissions into word counts.
// Each submission.text is treated as one word/phrase (new join UI).
function submissionsToWords(
  rows: { id: string; text: string; created_at: string }[],
): WordEntry[] {
  const map = new Map<string, WordEntry>();
  for (const row of rows) {
    const key = row.text.toLowerCase().trim();
    if (!key) continue;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      existing.ts = Math.max(existing.ts, new Date(row.created_at).getTime());
    } else {
      map.set(key, {
        id: key,
        text: row.text.trim(),
        count: 1,
        ts: new Date(row.created_at).getTime(),
      });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || b.ts - a.ts);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWordStore() {
  const [state, setState] = useState<StoreState>(() =>
    hasSupabaseConfig ? defaultState() : loadLocal(),
  );
  const [isRemote, setIsRemote] = useState(false);
  const [isLoading, setIsLoading] = useState(hasSupabaseConfig);

  // ── local mode ──────────────────────────────────────────────────────────────
  const refreshLocal = useCallback(() => {
    setState(loadLocal());
    setIsRemote(false);
    setIsLoading(false);
  }, []);

  // ── remote mode ─────────────────────────────────────────────────────────────
  const refreshRemote = useCallback(async () => {
    if (!supabase) { refreshLocal(); return; }

    const [{ data: sessionRow }, { data: rows }] = await Promise.all([
      supabase.from("presentation_sessions").select("*").eq("code", DEFAULT_SESSION_CODE).maybeSingle(),
      supabase.from("participant_submissions").select("id, text, created_at")
        .eq("session_code", DEFAULT_SESSION_CODE)
        .order("created_at", { ascending: false }),
    ]);

    const words = submissionsToWords(rows ?? []);

    setState(prev => ({
      ...prev,
      code: DEFAULT_SESSION_CODE,
      question: sessionRow?.question ?? prev.question,
      shape: (sessionRow?.frame_id as ShapeKind | undefined) ?? DEFAULT_SHAPE,
      words,
    }));
    setIsRemote(true);
    setIsLoading(false);
  }, [refreshLocal]);

  // ── subscribe / sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasSupabaseConfig) {
      const onChanged = () => setState(loadLocal());
      window.addEventListener("ur-changed", onChanged);
      window.addEventListener("storage", onChanged);
      return () => {
        window.removeEventListener("ur-changed", onChanged);
        window.removeEventListener("storage", onChanged);
      };
    }

    const timer = window.setTimeout(() => void refreshRemote(), 0);
    const channel = supabase
      ?.channel(`ur-session-${DEFAULT_SESSION_CODE}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "participant_submissions",
        filter: `session_code=eq.${DEFAULT_SESSION_CODE}`,
      }, () => void refreshRemote())
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "presentation_sessions",
        filter: `code=eq.${DEFAULT_SESSION_CODE}`,
      }, () => void refreshRemote())
      .subscribe();

    return () => {
      window.clearTimeout(timer);
      if (channel) void supabase?.removeChannel(channel);
    };
  }, [refreshLocal, refreshRemote]);

  // ── mutations ────────────────────────────────────────────────────────────────

  const addWord = useCallback(async (text: string) => {
    const t = text.trim();
    if (!t || t.length > 24) return;

    if (supabase) {
      const { error } = await supabase.from("participant_submissions").insert({
        session_code: DEFAULT_SESSION_CODE,
        group_name: "",
        room_name: "",
        text: t,
      });
      if (!error) await refreshRemote();
      return;
    }

    // local mode — merge same word
    const s = loadLocal();
    const key = t.toLowerCase();
    const idx = s.words.findIndex(w => w.text.toLowerCase() === key);
    const words =
      idx >= 0
        ? s.words.map((w, i) => i === idx ? { ...w, count: w.count + 1, ts: Date.now() } : w)
        : [...s.words, { id: cryptoId(), text: t, count: 1, ts: Date.now() }];
    saveLocal({ ...s, words });
  }, [refreshRemote]);

  const removeWord = useCallback(async (id: string) => {
    if (supabase) {
      const word = state.words.find(w => w.id === id);
      if (!word) return;
      // Delete all submissions whose text matches (case-insensitive equals)
      const { error } = await supabase.from("participant_submissions")
        .delete()
        .eq("session_code", DEFAULT_SESSION_CODE)
        .ilike("text", word.text);
      if (!error) await refreshRemote();
      return;
    }
    const s = loadLocal();
    saveLocal({ ...s, words: s.words.filter(w => w.id !== id) });
  }, [state.words, refreshRemote]);

  const decrementWord = useCallback(async (id: string) => {
    if (supabase) {
      const word = state.words.find(w => w.id === id);
      if (!word) return;
      // Find the most-recent submission matching this word and delete just one
      const { data } = await supabase.from("participant_submissions")
        .select("id")
        .eq("session_code", DEFAULT_SESSION_CODE)
        .ilike("text", word.text)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data?.[0]?.id) {
        const { error } = await supabase.from("participant_submissions")
          .delete()
          .eq("id", data[0].id);
        if (!error) await refreshRemote();
      }
      return;
    }
    const s = loadLocal();
    saveLocal({
      ...s,
      words: s.words
        .map(w => w.id === id ? { ...w, count: w.count - 1 } : w)
        .filter(w => w.count > 0),
    });
  }, [state.words, refreshRemote]);

  const clearWords = useCallback(async () => {
    if (supabase) {
      const { error } = await supabase.from("participant_submissions")
        .delete()
        .eq("session_code", DEFAULT_SESSION_CODE);
      if (!error) await refreshRemote();
      return;
    }
    const s = loadLocal();
    saveLocal({ ...s, words: [] });
  }, [refreshRemote]);

  // Updates question / subtitle in Supabase + local state.
  // subtitle is not stored in DB (no column) — always local only.
  const updateSession = useCallback(async (
    patch: Partial<Pick<StoreState, "question" | "subtitle" | "shape">>,
  ) => {
    if (supabase) {
      const dbPatch: { question?: string; frame_id?: string } = {};
      if (patch.question !== undefined) dbPatch.question = patch.question;
      if (patch.shape !== undefined) dbPatch.frame_id = patch.shape;
      if (Object.keys(dbPatch).length > 0) {
        await supabase.from("presentation_sessions")
          .update(dbPatch)
          .eq("code", DEFAULT_SESSION_CODE);
      }
      // Optimistic local update (subtitle not persisted to DB)
      setState(prev => ({ ...prev, ...patch }));
      return;
    }
    saveLocal({ ...loadLocal(), ...patch });
  }, []);

  return { state, isRemote, isLoading, addWord, removeWord, decrementWord, clearWords, updateSession };
}
