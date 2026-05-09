"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Particles } from "@/lib/particles";
import { WordArt } from "@/lib/wordart";
import { useWordStore } from "@/lib/word-store";
import type { WordEntry } from "@/lib/types";

// ── Present screen ────────────────────────────────────────────────────────────
export default function PresentPage() {
  const { state, isRemote } = useWordStore();
  const stageRef = useRef<HTMLDivElement>(null);
  const cloudRef = useRef<WordArt | null>(null);
  const lastCountRef = useRef(0);
  const [latest, setLatest] = useState<{ id: number; text: string } | null>(null);

  // Init wordart
  useEffect(() => {
    if (!stageRef.current) return;
    const cloud = new WordArt(stageRef.current, { shape: state.shape });
    cloudRef.current = cloud;
    cloud.update(state.words);
    return () => cloud.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync shape
  useEffect(() => {
    cloudRef.current?.setShape(state.shape);
  }, [state.shape]);

  // Sync words + ticker
  useEffect(() => {
    if (!cloudRef.current) return;
    cloudRef.current.update(state.words);
    const total = state.words.reduce((a, w) => a + w.count, 0);
    if (total > lastCountRef.current && state.words.length) {
      const newest = [...state.words].sort((a: WordEntry, b: WordEntry) => b.ts - a.ts)[0];
      setLatest({ id: Math.random(), text: newest.text });
    }
    lastCountRef.current = total;
  }, [state.words]);

  const particlesRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!particlesRef.current) return;
    const p = new Particles(particlesRef.current, { density: 1.0, speed: 1 });
    p.start();
    return () => p.stop();
  }, []);

  const total = state.words.reduce((a, w) => a + w.count, 0);
  const joinUrl = typeof window !== "undefined"
    ? window.location.origin + "/join"
    : "http://localhost:3000/join";

  return (
    <div className={`present shape-${state.shape}`}>
      <canvas ref={particlesRef} className="particles" />

      <div className="stage">
        <header className="head">
          <div className="left">
            <div className="eyebrow joshua-eyebrow">
              <svg viewBox="0 0 100 22" className="joshua-logo" aria-hidden="true">
                <path d="M6 4 C2 4 2 9 6 9 L8 9 L8 14 C8 17 5 17 5 15" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                <circle cx="6" cy="3" r="1.2" fill="currentColor" />
                <text x="14" y="14" fontFamily="var(--font-display)" fontWeight="800" fontSize="13" letterSpacing="2" fill="currentColor">JOSHUA</text>
              </svg>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 999, background: "var(--warm)", marginLeft: 10 }} />
              {" "}26 ONNURI · UPPER ROOM
            </div>
            <h2>{state.question}</h2>
            <div className="eyebrow" style={{ color: "var(--ink-faint)" }}>{state.subtitle}</div>
          </div>
          <div className="right">
            <div className="qr-card">
              <QRCodeSVG
                value={joinUrl}
                size={96}
                bgColor="#ffffff"
                fgColor="#111111"
                level="M"
              />
              <small>SCAN TO JOIN</small>
            </div>
            <div>CODE · <span style={{ color: "var(--ink)", fontWeight: 700, letterSpacing: ".2em" }}>{state.code}</span></div>
          </div>
        </header>

        <div className="canvas-area">
          <div className="window-glow" />
          {state.shape === "poster" && (
            <div className="poster-house" aria-hidden="true">
              <div className="poster-house-window" />
            </div>
          )}
          <div className="wordart" ref={stageRef} />
        </div>

        <footer className="foot">
          <span className="count-badge">
            <span className="live" />
            <span className="n">{state.words.length}</span> WORDS ·
            <span className="n" style={{ marginLeft: 4 }}>{total}</span> RESPONSES
          </span>
          <span>&apos;26 ONNURI JOSHUA VISANG RETREAT · @SOMANG RETREAT CENTER</span>
        </footer>

        {latest && (
          <div className="ticker" key={latest.id}>
            <span className="new">+ {latest.text}</span>
          </div>
        )}
      </div>

      <nav className="route-bar">
        <Link href="/admin" style={{ display: "contents" }}><button type="button">SETUP</button></Link>
        <Link href="/join" style={{ display: "contents" }}><button type="button">JOIN</button></Link>
        <Link href="/responses" style={{ display: "contents" }}><button type="button">RESPONSES</button></Link>
        <button className="is-active" type="button"><span className="dot" />{isRemote ? "Live" : "Demo"}</button>
      </nav>
    </div>
  );
}
