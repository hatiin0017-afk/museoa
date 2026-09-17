-- 업보 문의 전용. 기존 프로필 데이터는 변경하지 않습니다.
begin;
create table if not exists public.chogeumbi_inquiries (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (char_length(btrim(nickname)) between 1 and 40),
  content text not null check (char_length(btrim(content)) between 1 and 2000),
  status text not null default 'new' check (status in ('new','read','done')),
  created_at timestamptz not null default now()
);
create index if not exists chogeumbi_inquiries_created on public.chogeumbi_inquiries(created_at desc);
create index if not exists chogeumbi_inquiries_sender on public.chogeumbi_inquiries(lower(nickname),created_at desc);
alter table public.chogeumbi_inquiries enable row level security;
revoke all on public.chogeumbi_inquiries from anon,authenticated;
grant select on public.chogeumbi_inquiries to authenticated;
grant update(status) on public.chogeumbi_inquiries to authenticated;
grant delete on public.chogeumbi_inquiries to authenticated;
drop policy if exists chogeumbi_inquiries_delete on public.chogeumbi_inquiries;
create policy chogeumbi_inquiries_delete on public.chogeumbi_inquiries for delete to authenticated
  using (status in ('read','done') and exists(select 1 from public.chogeumbi_editors where user_id=(select auth.uid())));
drop policy if exists chogeumbi_inquiries_admin on public.chogeumbi_inquiries;
create policy chogeumbi_inquiries_admin on public.chogeumbi_inquiries for select to authenticated
  using (exists(select 1 from public.chogeumbi_editors where user_id=(select auth.uid())));
drop policy if exists chogeumbi_inquiries_update on public.chogeumbi_inquiries;
create policy chogeumbi_inquiries_update on public.chogeumbi_inquiries for update to authenticated
  using (exists(select 1 from public.chogeumbi_editors where user_id=(select auth.uid())))
  with check (exists(select 1 from public.chogeumbi_editors where user_id=(select auth.uid())));
create or replace function public.chogeumbi_submit_inquiry(sender_name text,message_text text)
returns uuid language plpgsql security definer set search_path='' as $$
declare inquiry_id uuid; sender text:=btrim(sender_name); message text:=btrim(message_text);
begin
  if sender is null or char_length(sender) not between 1 and 40 or message is null or char_length(message) not between 1 and 2000 then
    raise exception '닉네임은 1~40자, 내용은 1~2000자로 입력해 주세요.' using errcode='22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('chogeumbi-inquiry:'||lower(sender),0));
  if exists(select 1 from public.chogeumbi_inquiries where lower(nickname)=lower(sender) and created_at>now()-interval '1 minute') then
    raise exception '같은 닉네임의 문의는 1분 후 다시 보낼 수 있습니다.' using errcode='P0001';
  end if;
  insert into public.chogeumbi_inquiries(nickname,content) values(sender,message) returning id into inquiry_id;
  return inquiry_id;
end;
$$;
revoke all on function public.chogeumbi_submit_inquiry(text,text) from public;
grant execute on function public.chogeumbi_submit_inquiry(text,text) to anon,authenticated;
commit;
