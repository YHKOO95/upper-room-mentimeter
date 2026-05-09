"use client";

import { KeyboardEvent, Suspense, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPin } from "./actions";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/admin";

  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!pin || isPending) return;
    setError(false);
    startTransition(async () => {
      const ok = await verifyPin(pin);
      if (ok) {
        router.replace(redirect);
      } else {
        setError(true);
        setPin("");
        inputRef.current?.focus();
      }
    });
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div
      style={{
        width: "min(360px, 92vw)",
        background: "#0a0908",
        border: "1px solid rgba(244,239,230,.10)",
        borderRadius: 24,
        padding: "48px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="brand">
          <span className="brand-mark" />
          <span className="brand-name">UPPER ROOM</span>
        </div>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "rgba(244,239,230,.32)",
            margin: 0,
          }}
        >
          관리자 PIN 입력
        </p>
      </div>

      {/* PIN input */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          placeholder="PIN"
          value={pin}
          maxLength={12}
          onChange={e => { setPin(e.target.value); setError(false); }}
          onKeyDown={handleKey}
          autoFocus
          style={{
            width: "100%",
            background: "rgba(255,255,255,.03)",
            border: `1px solid ${error ? "#ff7a7a" : "rgba(244,239,230,.10)"}`,
            borderRadius: 12,
            padding: "14px 16px",
            color: "#f4efe6",
            fontSize: 20,
            fontFamily: "var(--font-mono)",
            letterSpacing: ".4em",
            outline: "none",
            transition: ".15s",
            boxSizing: "border-box",
          }}
        />
        {error && (
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "#ff7a7a",
              margin: 0,
            }}
          >
            잘못된 PIN입니다
          </p>
        )}
      </div>

      <button
        onClick={submit}
        disabled={!pin || isPending}
        type="button"
        style={{
          background: isPending ? "rgba(246,213,138,.5)" : "#f6d58a",
          color: "#1a1306",
          border: "none",
          borderRadius: 999,
          padding: "14px 0",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 15,
          letterSpacing: ".04em",
          cursor: !pin || isPending ? "not-allowed" : "pointer",
          transition: ".15s",
        }}
      >
        {isPending ? "확인 중…" : "입장하기"}
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
