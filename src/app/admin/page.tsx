"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Particles } from "@/lib/particles";
import { useWordStore } from "@/lib/word-store";

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
    const samples = [
      "새벽", "말씀", "회복", "평안", "회개", "공동체", "감사", "순종",
      "용서", "일터", "가정", "다음세대", "선교", "자녀", "부르심", "믿음", "광야", "쉼",
    ];
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
          <p className="desc" style={{ marginTop: 14 }}>
            참여자는 QR을 스캔해 단어를 보냅니다. 발표 화면에서 그 단어들이 기도하는 손 모양 안에 모여 들어요.
          </p>
        </div>

        <div className="admin-form">
          <div className="field">
            <label>질문</label>
            <textarea
              rows={2}
              value={state.question}
              onChange={e => void updateSession({ question: e.target.value })}
            />
          </div>
          <div className="field">
            <label>안내 텍스트</label>
            <input
              value={state.subtitle}
              onChange={e => void updateSession({ subtitle: e.target.value })}
            />
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
