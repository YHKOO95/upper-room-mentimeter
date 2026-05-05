"use client";

import Link from "next/link";
import { FrameWordCloud } from "@/components/FrameWordCloud";
import { frames } from "@/lib/frames";
import { readLocalSession, saveLocalSession } from "@/lib/demo-store";
import { supabase } from "@/lib/supabase";
import type { FrameKind } from "@/lib/types";
import { useWordCloudSession } from "@/lib/use-wordcloud-session";

const previewWords = [
  { text: "감사", value: 8 },
  { text: "은혜", value: 7 },
  { text: "공동체", value: 6 },
  { text: "사랑", value: 5 },
  { text: "기도", value: 4 },
  { text: "회복", value: 4 },
  { text: "소망", value: 3 },
  { text: "섬김", value: 3 },
];

export default function AdminPage() {
  const { isRemote, session } = useWordCloudSession();

  async function handleFrameChange(frameId: FrameKind) {
    saveLocalSession({ ...readLocalSession(), ...session, frameId });

    if (supabase) {
      await supabase.from("presentation_sessions").update({ frame_id: frameId }).eq("code", session.code);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-5 py-8 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link className="text-sm font-bold text-slate-500" href="/">
              홈으로
            </Link>
            <h1 className="mt-4 text-4xl font-black tracking-tight">프레임 설정</h1>
            <p className="mt-2 text-slate-500">
              MVP에서는 프레임 프리셋을 세션별로 선택합니다. SVG path/PNG 업로드 편집기는 다음 단계로 확장합니다.
            </p>
          </div>
          <Link className="rounded-full bg-slate-950 px-5 py-3 font-bold text-white" href="/present">
            발표 화면 보기
          </Link>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-3">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-600">
              {isRemote ? "Supabase Session" : "Local Demo"}
            </p>
            {Object.values(frames).map((frame) => (
              <button
                className={[
                  "w-full rounded-3xl border p-5 text-left transition",
                  session.frameId === frame.id
                    ? "border-emerald-500 bg-white shadow-xl shadow-emerald-100"
                    : "border-slate-200 bg-white hover:border-slate-400",
                ].join(" ")}
                key={frame.id}
                onClick={() => void handleFrameChange(frame.id)}
                type="button"
              >
                <p className="text-xl font-black">{frame.name}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{frame.description}</p>
              </button>
            ))}
          </aside>

          <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200/70">
            <div className="rounded-[1.5rem] bg-slate-50 p-5">
              <FrameWordCloud
                className="min-h-[560px]"
                colors={session.colorTheme}
                frameId={session.frameId}
                words={previewWords}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
