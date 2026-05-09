"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useWordStore } from "@/lib/word-store";
import type { WordEntry } from "@/lib/types";

type SortBy = "count" | "recent" | "text";

function fmtTime(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return new Date(ts).toLocaleDateString("ko-KR");
}

function exportCsv(words: WordEntry[], question: string) {
  const rows = [
    ["질문", question],
    [],
    ["단어", "응답 수", "최근 응답 시각"],
    ...words
      .slice()
      .sort((a, b) => b.count - a.count)
      .map(w => [w.text, String(w.count), new Date(w.ts).toLocaleString("ko-KR")]),
  ];
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `upper-room-responses-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResponsesPage() {
  const { state, removeWord, decrementWord, clearWords } = useWordStore();
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("count");

  const filtered = useMemo(() => {
    let arr = state.words.filter((w: WordEntry) => !q || w.text.toLowerCase().includes(q.toLowerCase()));
    if (sortBy === "count") arr = [...arr].sort((a, b) => b.count - a.count || b.ts - a.ts);
    else if (sortBy === "recent") arr = [...arr].sort((a, b) => b.ts - a.ts);
    else arr = [...arr].sort((a, b) => a.text.localeCompare(b.text, "ko"));
    return arr;
  }, [state.words, q, sortBy]);

  const total = state.words.reduce((a: number, w: WordEntry) => a + w.count, 0);

  return (
    <div className="responses">
      <div className="responses-head">
        <div>
          <div className="eyebrow">RESPONSES · 실시간 응답 관리</div>
          <h1 style={{ marginTop: 8 }}>{state.question}</h1>
          <div className="meta">{state.subtitle}</div>
        </div>
        <div className="responses-stats">
          <div className="stat">
            <div className="n">{state.words.length}</div>
            <div className="lbl">고유 단어</div>
          </div>
          <div className="stat">
            <div className="n">{total}</div>
            <div className="lbl">총 응답</div>
          </div>
        </div>
      </div>

      <div className="resp-toolbar">
        <input
          className="resp-search"
          placeholder="단어 검색…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <div className="resp-sort">
          <button className={sortBy === "count" ? "is-on" : ""} onClick={() => setSortBy("count")} type="button">빈도</button>
          <button className={sortBy === "recent" ? "is-on" : ""} onClick={() => setSortBy("recent")} type="button">최신</button>
          <button className={sortBy === "text" ? "is-on" : ""} onClick={() => setSortBy("text")} type="button">가나다</button>
        </div>
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => exportCsv(state.words, state.question)}
          type="button"
        >
          CSV 내보내기
        </button>
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => { if (window.confirm("모든 응답을 삭제할까요?")) void clearWords(); }}
          type="button"
        >
          전체 삭제
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="resp-table">
          <div className="resp-empty" style={{ gridColumn: "1 / -1" }}>응답이 없습니다</div>
        </div>
      ) : (
        <div className="resp-table">
          <div className="h">#</div>
          <div className="h">단어</div>
          <div className="h">응답 수</div>
          <div className="h">최근 응답</div>
          <div className="h" style={{ justifyContent: "flex-end" }}>작업</div>
          {filtered.map((w, i) => (
            <div className="resp-row" key={w.id}>
              <div className="c idx">{String(i + 1).padStart(2, "0")}</div>
              <div className="c text">{w.text}</div>
              <div className="c count"><span className="pill">×{w.count}</span></div>
              <div className="c time">{fmtTime(w.ts)}</div>
              <div className="c actions">
                {w.count > 1 && (
                  <button
                    className="icon-btn"
                    title="1개 차감"
                    onClick={() => void decrementWord(w.id)}
                    type="button"
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
                <button
                  className="icon-btn danger"
                  title="삭제"
                  onClick={() => { if (window.confirm(`"${w.text}" 응답을 삭제할까요? (${w.count}개)`)) void removeWord(w.id); }}
                  type="button"
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <nav className="route-bar">
        <Link href="/admin" style={{ display: "contents" }}><button type="button">SETUP</button></Link>
        <Link href="/join" style={{ display: "contents" }}><button type="button">JOIN</button></Link>
        <button className="is-active" type="button"><span className="dot" />RESPONSES</button>
        <Link href="/present" style={{ display: "contents" }}><button type="button">PRESENT</button></Link>
      </nav>
    </div>
  );
}
