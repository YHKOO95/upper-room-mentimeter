"use client";

import Link from "next/link";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Particles } from "@/lib/particles";
import { useWordStore } from "@/lib/word-store";

export default function JoinPage() {
  const { state, isRemote, addWord } = useWordStore();
  const [val, setVal] = useState("");
  const [mine, setMine] = useState<{ id: string; text: string }[]>([]);
  const [thanksKey, setThanksKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const dustCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!bgCanvasRef.current) return;
    const p = new Particles(bgCanvasRef.current, { density: 0.4, speed: 0.9 });
    p.start();
    return () => p.stop();
  }, []);

  useEffect(() => {
    if (!dustCanvasRef.current) return;
    const p = new Particles(dustCanvasRef.current, { density: 0.35, speed: 0.7 });
    p.start();
    return () => p.stop();
  }, []);

  const submit = async () => {
    const t = val.trim();
    if (!t || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addWord(t);
      setMine(m => [{ id: Math.random().toString(36).slice(2, 8), text: t }, ...m].slice(0, 8));
      setVal("");
      setThanksKey(n => n + 1);
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void submit();
  };

  return (
    <div className="participant">
      <canvas ref={bgCanvasRef} className="bg" />

      <div className="phone-frame">
        <canvas ref={dustCanvasRef} className="dust" />
        <div className="phone-inner">
          <div className="phone-head">
            <div className="brand" style={{ gap: 6 }}>
              <span className="brand-mark" style={{ transform: "scale(.7)" }} />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: ".18em", fontSize: 11 }}>UPPER ROOM</span>
            </div>
            <span>CODE · {state.code}</span>
          </div>

          <div className="phone-q">{state.question}</div>
          <div className="phone-q-sub">{state.subtitle}</div>

          <div className="phone-input-wrap">
            <input
              ref={inputRef}
              className="phone-input"
              placeholder="한 단어로 적어주세요…"
              value={val}
              onChange={e => setVal(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={24}
              disabled={isSubmitting}
              autoFocus
            />
            <button
              className="phone-send"
              onClick={() => void submit()}
              disabled={isSubmitting}
              aria-label="보내기"
              type="button"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="phone-helper">{val.length}/24 · 여러 번 보낼 수 있어요</div>

          {mine.length > 0 && (
            <>
              <div className="phone-foot">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-faint)" }}>나의 응답</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-faint)" }}>{mine.length}개</span>
              </div>
              <div className="my-words">
                {mine.map(m => <span key={m.id} className="my-word">{m.text}</span>)}
              </div>
            </>
          )}

          <div className={`thanks-flash${thanksKey ? " show" : ""}`} key={thanksKey}>
            전송됨
          </div>
        </div>
      </div>

      <p style={{ position: "relative", zIndex: 2, marginTop: 24, fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-faint)" }}>
        {isRemote ? "Supabase 실시간 세션" : "로컬 데모 모드"} · <Link href="/present" style={{ color: "var(--warm)", textDecoration: "none" }}>발표 화면 보기</Link>
      </p>

      <nav className="route-bar">
        <Link href="/admin" style={{ display: "contents" }}><button type="button">SETUP</button></Link>
        <button className="is-active" type="button"><span className="dot" />JOIN</button>
        <Link href="/responses" style={{ display: "contents" }}><button type="button">RESPONSES</button></Link>
        <Link href="/present" style={{ display: "contents" }}><button type="button">PRESENT</button></Link>
      </nav>
    </div>
  );
}
