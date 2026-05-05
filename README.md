# Upper Room

Mentimeter 스타일의 실시간 워드클라우드 MVP입니다. 참가자는 그룹/다락방과 응답을 입력하고, 발표자는 전체 워드클라우드와 다락방별 워드클라우드를 프레임 안에서 확인합니다.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Screens

- `/join`: 참가자 입력 화면
- `/present`: 발표 화면. 전체/다락방별 탭과 프레임 워드클라우드 제공
- `/admin`: 세션 프레임 프리셋 선택

## Supabase Setup

환경 변수가 없으면 로컬 데모 모드로 동작합니다. 실제 실시간 세션을 쓰려면 Supabase 프로젝트에서 `supabase/schema.sql`을 실행하고 `.env.local`에 아래 값을 넣습니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## MVP Scope

- 세션 코드 `UPPER` 기본 제공
- 참가자 제출 원문 저장
- 한글/영문 단순 토큰화 기반 집계
- 전체 인원 워드클라우드
- 다락방별 워드클라우드
- 하트, 원, 십자가, 별, 라운드 프레임 프리셋
- Supabase Realtime 기반 제출/세션 변경 반영

## Next Steps

- 관리자 인증과 세션 생성
- SVG path 또는 PNG 마스크 업로드
- 금칙어/불용어 편집
- 다락방/그룹 마스터 데이터 관리
