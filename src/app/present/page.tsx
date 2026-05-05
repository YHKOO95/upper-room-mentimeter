"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FrameWordCloud } from "@/components/FrameWordCloud";
import { frames } from "@/lib/frames";
import type { PresentationTab } from "@/lib/types";
import { aggregateByRoom, aggregateWords, getRooms } from "@/lib/word-aggregate";
import { useWordCloudSession } from "@/lib/use-wordcloud-session";

export default function PresentPage() {
  const { isLoading, isRemote, session, submissions } = useWordCloudSession();
  const [tab, setTab] = useState<PresentationTab>("all");
  const rooms = useMemo(() => getRooms(submissions), [submissions]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const activeRoom = rooms.includes(selectedRoom) ? selectedRoom : rooms[0] ?? "";

  const words = useMemo(() => {
    if (tab === "room" && activeRoom) {
      return aggregateByRoom(submissions, activeRoom);
    }
    return aggregateWords(submissions);
  }, [activeRoom, submissions, tab]);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-6 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-emerald-300">
              {session.code} · {isRemote ? "Live" : "Demo"}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">{session.question}</h1>
          </div>
          <div className="rounded-3xl bg-white px-6 py-4 text-right text-slate-950">
            <p className="text-sm font-bold text-slate-500">응답 수</p>
            <p className="text-4xl font-black">{submissions.length}</p>
          </div>
        </header>

        <section className="mt-6 rounded-[2rem] bg-white p-4 text-slate-950 shadow-2xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="rounded-full bg-slate-100 p-1">
              <button
                className={tabButtonClass(tab === "all")}
                onClick={() => setTab("all")}
                type="button"
              >
                전체 인원
              </button>
              <button
                className={tabButtonClass(tab === "room")}
                onClick={() => setTab("room")}
                type="button"
              >
                다락방별
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {tab === "room" ? (
                <select
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold"
                  onChange={(event) => setSelectedRoom(event.target.value)}
                  value={activeRoom}
                >
                  {rooms.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              ) : null}
              <Link className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold" href="/join">
                참가 링크
              </Link>
              <Link className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold" href="/admin">
                프레임 설정
              </Link>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_260px]">
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              {isLoading ? (
                <div className="flex min-h-[520px] items-center justify-center font-bold text-slate-400">
                  불러오는 중...
                </div>
              ) : (
                <FrameWordCloud
                  className="min-h-[520px]"
                  colors={session.colorTheme}
                  frameId={session.frameId}
                  words={words}
                />
              )}
            </div>
            <aside className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
              <p className="text-sm font-bold text-emerald-300">현재 프레임</p>
              <h2 className="mt-2 text-2xl font-black">{frames[session.frameId].name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{frames[session.frameId].description}</p>
              <div className="mt-6 space-y-3">
                {words.slice(0, 8).map((word) => (
                  <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3" key={word.text}>
                    <span className="font-bold">{word.text}</span>
                    <span className="text-emerald-300">{word.value}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function tabButtonClass(isActive: boolean) {
  return [
    "rounded-full px-5 py-2 text-sm font-black transition",
    isActive ? "bg-slate-950 text-white" : "text-slate-500 hover:text-slate-950",
  ].join(" ");
}
