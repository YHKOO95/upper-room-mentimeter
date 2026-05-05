import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.4em] text-emerald-300">
          2026 비상수련회
        </p>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h1 className="max-w-3xl text-5xl font-black tracking-tight sm:text-7xl">
              다락방별 응답을 실시간으로 모아 프레임 안에 그립니다.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              참가자는 그룹과 다락방을 입력하고, 발표자는 전체 워드클라우드와
              다락방별 워드클라우드를 탭으로 전환합니다. 하트, 십자가, 원형 같은
              프레임 안에 단어가 배치됩니다.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link className="rounded-full bg-emerald-400 px-6 py-3 font-bold text-slate-950" href="/join">
                참가자 입력
              </Link>
              <Link className="rounded-full border border-white/20 px-6 py-3 font-bold text-white" href="/present">
                발표 화면
              </Link>
              <Link className="rounded-full border border-white/20 px-6 py-3 font-bold text-white" href="/admin">
                프레임 설정
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="rounded-[1.5rem] bg-white p-8 text-slate-950">
              <p className="text-sm font-bold text-emerald-600">Session Code</p>
              <p className="mt-2 text-5xl font-black tracking-wider">UPPER</p>
              <div className="mt-8 grid grid-cols-2 gap-3 text-sm font-semibold">
                {["전체 워드클라우드", "다락방별 탭", "실시간 반영", "프레임 선택"].map((label) => (
                  <div className="rounded-2xl bg-slate-100 p-4" key={label}>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
