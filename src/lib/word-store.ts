"use client";

import { useCallback, useEffect, useState } from "react";
import type { ShapeKind, WordEntry } from "./types";
import { hasSupabaseConfig, supabase } from "./supabase";

const STORAGE_KEY = "upperroom.menti.v2";

// ─── Default state ────────────────────────────────────────────────────────────

export const DEFAULT_SHAPE: ShapeKind = "poster";
export const DEFAULT_SESSION_CODE = "UPPER";

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

const seedWords: StoreState["words"] = [
  ["기도", 4], ["말씀", 3], ["예배", 3], ["공동체", 2], ["찬양", 2],
  ["고요", 2], ["새벽", 1], ["감사", 2], ["묵상", 1], ["은혜", 3],
  ["회복", 1], ["빛", 2], ["소망", 1], ["눈물", 1], ["일터", 1],
].map(([t, c]) => ({
  id: cryptoId(),
  text: t as string,
  count: c as number,
  ts: Date.now() - Math.random() * 60000,
}));

function defaultState(): StoreState {
  return {
    code: DEFAULT_SESSION_CODE,
    question: "당신의 어퍼룸은 어디인가요?",
    subtitle: "A SINGLE WORD OR SHORT PHRASE",
    shape: DEFAULT_SHAPE,
    words: seedWords.map(w => ({ ...w, id: cryptoId(), ts: Date.now() - Math.random() * 60000 })),
  };
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadLocal(): StoreState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoreState;
  } catch {}
  const s = defaultState();
  saveLocal(s);
  return s;
}

function saveLocal(s: StoreState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
  window.dispatchEvent(new Event("ur-changed"));
}

// ─── Supabase word aggregation helpers ───────────────────────────────────────

function submissionsToWords(rows: { id: string; text: string; created_at: string }[]): WordEntry[] {
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
    const code = DEFAULT_SESSION_CODE;
    const [{ data: sessionRow }, { data: rows }] = await Promise.all([
      supabase.from("presentation_sessions").select("*").eq("code", code).maybeSingle(),
      supabase.from("participant_submissions").select("id, text, created_at").eq("session_code", code).order("created_at", { ascending: false }),
    ]);
    const words = submissionsToWords(rows ?? []);
    setState(prev => ({
      ...prev,
      code,
      question: sessionRow?.question ?? prev.question,
      subtitle: prev.subtitle,
      shape: (sessionRow?.frame_id as ShapeKind) ?? prev.shape,
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
      .on("postgres_changes", { event: "*", schema: "public", table: "participant_submissions", filter: `session_code=eq.${DEFAULT_SESSION_CODE}` }, () => void refreshRemote())
      .on("postgres_changes", { event: "*", schema: "public", table: "presentation_sessions", filter: `code=eq.${DEFAULT_SESSION_CODE}` }, () => void refreshRemote())
      .subscribe();

    return () => {
      window.clearTimeout(timer);
      if (channel) void supabase?.removeChannel(channel);
    };
  }, [refreshLocal, refreshRemote]);

  // ── mutation helpers ─────────────────────────────────────────────────────────

  const addWord = useCallback(async (text: string) => {
    const t = text.trim();
    if (!t || t.length > 24) return;
    if (supabase) {
      await supabase.from("participant_submissions").insert({
        session_code: DEFAULT_SESSION_CODE,
        group_name: "",
        room_name: "",
        text: t,
      });
      await refreshRemote();
      return;
    }
    saveLocal({
      ...loadLocal(),
      words: (() => {
        const s = loadLocal();
        const key = t.toLowerCase();
        const existing = s.words.find(w => w.text.toLowerCase() === key);
        if (existing) {
          return s.words.map(w => w.text.toLowerCase() === key ? { ...w, count: w.count + 1, ts: Date.now() } : w);
        }
        return [...s.words, { id: cryptoId(), text: t, count: 1, ts: Date.now() }];
      })(),
    });
  }, [refreshRemote]);

  const removeWord = useCallback(async (id: string) => {
    if (supabase) {
      const wordText = state.words.find(w => w.id === id)?.text;
      if (!wordText) return;
      await supabase.from("participant_submissions").delete()
        .eq("session_code", DEFAULT_SESSION_CODE)
        .ilike("text", wordText);
      await refreshRemote();
      return;
    }
    const s = loadLocal();
    saveLocal({ ...s, words: s.words.filter(w => w.id !== id) });
  }, [state.words, refreshRemote]);

  const decrementWord = useCallback(async (id: string) => {
    if (supabase) {
      const wordText = state.words.find(w => w.id === id)?.text;
      if (!wordText) return;
      const { data } = await supabase.from("participant_submissions").select("id")
        .eq("session_code", DEFAULT_SESSION_CODE)
        .ilike("text", wordText)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data?.[0]) {
        await supabase.from("participant_submissions").delete().eq("id", data[0].id);
      }
      await refreshRemote();
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
      await supabase.from("participant_submissions").delete().eq("session_code", DEFAULT_SESSION_CODE);
      await refreshRemote();
      return;
    }
    const s = loadLocal();
    saveLocal({ ...s, words: [] });
  }, [refreshRemote]);

  const updateSession = useCallback(async (patch: Partial<Pick<StoreState, "question" | "subtitle" | "shape">>) => {
    if (supabase && patch.shape) {
      await supabase.from("presentation_sessions").update({ frame_id: patch.shape }).eq("code", DEFAULT_SESSION_CODE);
    }
    if (!hasSupabaseConfig) {
      saveLocal({ ...loadLocal(), ...patch });
    } else {
      setState(prev => ({ ...prev, ...patch }));
    }
  }, []);

  return { state, isRemote, isLoading, addWord, removeWord, decrementWord, clearWords, updateSession };
}
