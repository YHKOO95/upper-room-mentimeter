"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useWordCloudSession } from "@/lib/use-wordcloud-session";

export default function JoinPage() {
  const { isRemote, session, submitResponse } = useWordCloudSession();
  const [groupName, setGroupName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!groupName.trim() || !roomName.trim() || !text.trim()) {
      setMessage("그룹, 다락방, 응답을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitResponse({
        groupName: groupName.trim(),
        roomName: roomName.trim(),
        text: text.trim(),
      });
      setText("");
      setMessage("응답이 발표 화면에 반영되었습니다.");
    } catch {
      setMessage("응답 저장에 실패했습니다. 세션 설정을 확인해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-5 py-8 text-slate-950">
      <div className="mx-auto max-w-xl">
        <Link className="text-sm font-bold text-slate-500" href="/">
          홈으로
        </Link>
        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-600">
            Code {session.code}
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight">{session.question}</h1>
          <p className="mt-3 text-sm text-slate-500">
            {isRemote ? "Supabase 실시간 세션에 연결됨" : "로컬 데모 모드로 실행 중"}
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">소속 그룹</span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="예: 1그룹"
                value={groupName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">다락방</span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
                onChange={(event) => setRoomName(event.target.value)}
                placeholder="예: 믿음 다락방"
                value={roomName}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">응답</span>
              <textarea
                className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
                maxLength={120}
                onChange={(event) => setText(event.target.value)}
                placeholder="떠오르는 단어나 짧은 문장을 입력해주세요."
                value={text}
              />
            </label>
            <button
              className="w-full rounded-2xl bg-slate-950 px-5 py-4 font-black text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={isSubmitting || !session.isAcceptingResponses}
              type="submit"
            >
              {isSubmitting ? "전송 중..." : "응답 보내기"}
            </button>
          </form>

          {message ? <p className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</p> : null}
        </section>
      </div>
    </main>
  );
}
