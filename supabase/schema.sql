create table if not exists public.presentation_sessions (
  code text primary key,
  title text not null,
  question text not null,
  frame_id text not null default 'poster',
  color_theme text[] not null default array['#16a34a', '#9333ea', '#dc2626', '#2563eb', '#f59e0b', '#0f766e'],
  is_accepting_responses boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.participant_submissions (
  id uuid primary key default gen_random_uuid(),
  session_code text not null references public.presentation_sessions(code) on delete cascade,
  group_name text not null default '',
  room_name text not null default '',
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.presentation_sessions enable row level security;
alter table public.participant_submissions enable row level security;

do $$ begin
  create policy "Public sessions are readable"
  on public.presentation_sessions for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Public submissions are readable"
  on public.participant_submissions for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Anyone can submit responses"
  on public.participant_submissions for insert
  with check (
    exists (
      select 1 from public.presentation_sessions
      where code = session_code and is_accepting_responses = true
    )
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Anyone can update sessions"
  on public.presentation_sessions for update using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Anyone can delete submissions"
  on public.participant_submissions for delete using (true);
exception when duplicate_object then null;
end $$;

insert into public.presentation_sessions (code, title, question, frame_id)
values ('UPPER', 'Upper Room', '당신의 어퍼룸은 어디인가요?', 'poster')
on conflict (code) do update
  set frame_id = 'poster';

do $$ begin
  alter publication supabase_realtime add table public.presentation_sessions;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.participant_submissions;
exception when duplicate_object then null;
end $$;
