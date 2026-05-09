"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Particles } from "@/lib/particles";
import { useWordStore } from "@/lib/word-store";
import type { ShapeKind } from "@/lib/types";

const SHAPE_KEYS: ShapeKind[] = ["poster", "prayer", "attic", "stairs", "house", "window", "circle"];
const SHAPE_LABELS: Record<ShapeKind, string> = {
  poster: "포스터 (다락방+손)",
  prayer: "기도하는 손",
  attic: "다락방",
  stairs: "계단 위 다락",
  house: "단순 집",
  window: "창문",
  circle: "원형",
};

function ShapeIcon({ kind }: { kind: ShapeKind }) {
  if (kind === "house") return (
    <svg viewBox="0 0 32 32" fill="none"><path d="M5 26V14L16 6l11 8v12H5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><rect x="13.5" y="15.5" width="5" height="5" fill="currentColor"/></svg>
  );
  if (kind === "attic") return (
    <svg viewBox="0 0 32 32" fill="none">
      <path d="M4 28V20h24v8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M8 20v-7h16v7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M6 13l10-7 10 7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <rect x="14" y="15" width="4" height="4" fill="currentColor"/>
      <rect x="22" y="6" width="2" height="4" fill="currentColor"/>
    </svg>
  );
  if (kind === "stairs") return (
    <svg viewBox="0 0 32 32" fill="none">
      <path d="M12 8h8v6h4v4h4v4h4v4H0v-4h4v-4h4v-4h4V8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M13 7l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <rect x="15" y="9" width="2" height="2" fill="currentColor"/>
    </svg>
  );
  if (kind === "prayer") return (
    <svg viewBox="0 0 32 32" fill="none">
      <path d="M11 28v-6c0-3 .5-6 1.5-9l1-3c.3-.8 1-1.4 1.5-1.4s1.2.6 1.5 1.4l1 3c1 3 1.5 6 1.5 9v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 22c-1.5-.5-3-1.5-3.5-3M21 22c1.5-.5 3-1.5 3.5-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
  if (kind === "poster") return (
    <svg viewBox="0 0 32 32" fill="none">
      <path d="M2 30c2-10 6-18 14-26 8 8 12 16 14 26" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M11 30V20l5-4 5 4v10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <rect x="14.5" y="21" width="3" height="3" fill="currentColor"/>
    </svg>
  );
  if (kind === "window") return (
    <svg viewBox="0 0 32 32" fill="none"><rect x="6" y="6" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M6 16h20M16 6v20" stroke="currentColor" strokeWidth="1.6"/></svg>
  );
  return (
    <svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1.6"/><circle cx="16" cy="16" r="2.5" fill="currentColor"/></svg>
  );
}

export default function AdminPage() {
  const { state, isRemote, updateSession, addWord, clearWords } = useWordStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const p = new Particles(canvasRef.current, { density: 0.5, speed: 0.8 });
    p.start();
    return () => p.stop();
  }, []);

  const total = state.words.reduce((a, w) => a + w.count, 0);

  const seedSample = () => {
    const samples = ["새벽", "말씀", "회복", "평안", "회개", "공동체", "감사", "순종", "용서", "일터", "가정", "다음세대", "선교", "자녀", "부르심", "믿음", "광야", "쉼"];
    void addWord(samples[Math.floor(Math.random() * samples.length)]);
  };

  return (
    <div className="admin">
      {/* ── Side panel ── */}
      <aside className="admin-side">
        <div className="brand">
          <span className="brand-mark" />
          <span className="brand-name">UPPER ROOM</span>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Step 01 · Word Cloud</div>
          <h1>질문을 만들고<br />참여를 받아보세요.</h1>
          <p className="desc" style={{ marginTop: 14 }}>참여자는 QR을 스캔해 단어를 보냅니다. 발표 화면에서 그 단어들이 실루엣 안에 모여 들어요.</p>
        </div>

        <div className="admin-form">
          <div className="field">
            <label>질문</label>
            <textarea rows={2} value={state.question} onChange={e => void updateSession({ question: e.target.value })} />
          </div>
          <div className="field">
            <label>안내 텍스트</label>
            <input value={state.subtitle} onChange={e => void updateSession({ subtitle: e.target.value })} />
          </div>
          <div className="field">
            <label>워드아트 모양</label>
            <div className="shape-picker">
              {SHAPE_KEYS.map(k => (
                <button
                  key={k}
                  className={`shape-chip${state.shape === k ? " is-on" : ""}`}
                  onClick={() => void updateSession({ shape: k })}
                  type="button"
                >
                  <ShapeIcon kind={k} />
                  <span className="lbl">{SHAPE_LABELS[k]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="live-row">
          <div>
            <div className="lbl">실시간 응답</div>
            <div className="num">{total}</div>
          </div>
          <span className="pill">{isRemote ? "Live" : "Demo"}</span>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { if (window.confirm("모든 응답을 지울까요?")) void clearWords(); }}
            type="button"
          >
            응답 초기화
          </button>
          <button className="btn btn-sm" onClick={seedSample} type="button">
            + 샘플 단어
          </button>
        </div>
      </aside>

      {/* ── Preview stage ── */}
      <main className="admin-stage">
        <canvas ref={canvasRef} className="bg" />
        <div className="stage-head">
          <span className="crumb">미리보기 · 발표 화면 슬라이드 1</span>
          <div className="actions">
            <Link className="btn btn-sm btn-ghost" href="/join">참여자 화면 열기</Link>
            <Link className="btn btn-sm btn-warm" href="/present">▶ 발표 시작</Link>
          </div>
        </div>

        <div className="q-card">
          <div className="q-eyebrow">
            <span className="num">1</span> WORD CLOUD · 단답형
          </div>
          <textarea
            className="q-input"
            rows={2}
            value={state.question}
            onChange={e => void updateSession({ question: e.target.value })}
          />
          <input
            className="q-sub"
            value={state.subtitle}
            onChange={e => void updateSession({ subtitle: e.target.value })}
          />
          <div className="my-words" style={{ marginTop: 28 }}>
            {state.words.slice(0, 12).map(w => (
              <span key={w.id} className="my-word">
                {w.text}<small>{w.count}</small>
              </span>
            ))}
            {state.words.length > 12 && (
              <span className="my-word" style={{ background: "transparent", borderColor: "var(--line)", color: "var(--ink-faint)" }}>
                +{state.words.length - 12}
              </span>
            )}
          </div>
        </div>
      </main>

      {/* ── Nav bar ── */}
      <nav className="route-bar">
        <button className="is-active" type="button"><span className="dot" />SETUP</button>
        <Link href="/join" style={{ display: "contents" }}><button type="button">JOIN</button></Link>
        <Link href="/responses" style={{ display: "contents" }}><button type="button">RESPONSES</button></Link>
        <Link href="/present" style={{ display: "contents" }}><button type="button">PRESENT</button></Link>
      </nav>
    </div>
  );
}
