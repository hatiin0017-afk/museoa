-- 초금비 전용 초기 설정. 기존 다른 프로필과 데이터를 변경하지 않습니다.
-- Supabase SQL Editor에서 전체 실행 후 아래 관리자 등록을 진행하세요.
begin;
create table if not exists public.chogeumbi_editors (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.chogeumbi_editors enable row level security;
revoke all on public.chogeumbi_editors from anon, authenticated;
grant select on public.chogeumbi_editors to authenticated;
drop policy if exists chogeumbi_editor_self on public.chogeumbi_editors;
create policy chogeumbi_editor_self on public.chogeumbi_editors for select to authenticated
  using (user_id = (select auth.uid()));

create table if not exists public.chogeumbi_state (
  id integer primary key check (id = 1),
  payload jsonb not null,
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.chogeumbi_state enable row level security;
revoke all on public.chogeumbi_state from anon, authenticated;
grant select on public.chogeumbi_state to authenticated;
drop policy if exists chogeumbi_admin_read on public.chogeumbi_state;
create policy chogeumbi_admin_read on public.chogeumbi_state for select to authenticated
  using (exists (select 1 from public.chogeumbi_editors where user_id = (select auth.uid())));
insert into public.chogeumbi_state (id,payload) values (1,
  '{"settings":{},"schedules":[],"outfits":[{"id":"original","name":"금비의 교복","image":"./assets/main.png","blur":0,"note":"초록과 노랑, 오늘의 금비."}],"upbo":[],"members":[],"taskTypes":[],"history":[]}'::jsonb
) on conflict (id) do nothing;

-- 공개 페이지에는 표시용 필드만 반환. 시청자 명부/처리 이력은 비공개.
create or replace function public.chogeumbi_public() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'settings',payload->'settings',
    'schedules',payload->'schedules',
    'outfits',payload->'outfits',
    'upbo',coalesce((select jsonb_agg(jsonb_build_object(
      'id',r->'id','nickname',r->'nickname','viewerId',r->'viewerId',
      'item',r->'item','quantity',r->'quantity','season',r->'season',
      'status',r->'status','sample',coalesce(r->'sample','false'::jsonb)
    )) from jsonb_array_elements(payload->'upbo') r),'[]'::jsonb)
  ) from public.chogeumbi_state where id=1;
$$;
revoke all on function public.chogeumbi_public() from public;
grant execute on function public.chogeumbi_public() to anon, authenticated;

-- 관리자 검사 + revision 비교 + 행 잠금으로 다른 창의 수정 유실 방지.
create or replace function public.chogeumbi_save(new_payload jsonb, expected_revision bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare current_revision bigint; section text;
begin
  if auth.uid() is null or not exists (
    select 1 from public.chogeumbi_editors where user_id=auth.uid()
  ) then raise exception '관리자 권한이 필요합니다.' using errcode='42501'; end if;
  if new_payload is null or jsonb_typeof(new_payload) <> 'object'
    or octet_length(new_payload::text) > 4194304
    or jsonb_typeof(new_payload->'settings') is distinct from 'object'
  then raise exception '올바른 데이터 형식이 아닙니다.' using errcode='22023'; end if;
  foreach section in array array['schedules','outfits','upbo','members','taskTypes','history','categories'] loop
    if jsonb_typeof(new_payload->section) is distinct from 'array' then
      raise exception '필수 목록이 없습니다: %',section using errcode='22023';
    end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(new_payload->'outfits') r where coalesce(r->>'image','') like 'data:%') then
    raise exception '이미지를 Storage에 먼저 업로드해 주세요.' using errcode='22023';
  end if;
  select revision into current_revision from public.chogeumbi_state where id=1 for update;
  if not found then raise exception '초기 데이터가 없습니다.'; end if;
  if expected_revision is distinct from current_revision then
    raise exception '다른 창에서 데이터가 변경되었습니다.' using errcode='40001';
  end if;
  if exists (
    select 1 from jsonb_array_elements(new_payload->'outfits') outfit
    join jsonb_array_elements(coalesce((select payload->'imageCleanup' from public.chogeumbi_state where id=1),'[]'::jsonb)) pending
      on outfit->>'image'=pending->>'image'
  ) then raise exception '삭제 대기 중인 이미지입니다. 새 파일로 등록해 주세요.' using errcode='22023'; end if;
  update public.chogeumbi_state set payload=new_payload,revision=current_revision+1,updated_at=now() where id=1;
  return current_revision+1;
end;
$$;
revoke all on function public.chogeumbi_save(jsonb,bigint) from public, anon;
grant execute on function public.chogeumbi_save(jsonb,bigint) to authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('chogeumbi','chogeumbi',true,8388608,array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;
drop policy if exists chogeumbi_image_insert on storage.objects;
create policy chogeumbi_image_insert on storage.objects for insert to authenticated with check (
  bucket_id='chogeumbi'
  and (storage.foldername(name))[1]=(select auth.uid())::text
  and (storage.foldername(name))[2]='chogeumbi'
  and exists(select 1 from public.chogeumbi_editors where user_id=(select auth.uid()))
);

-- 등록된 관리자는 이 프로필의 업로드 이미지만 정리할 수 있습니다.
drop policy if exists chogeumbi_image_read_admin on storage.objects;
create policy chogeumbi_image_read_admin on storage.objects for select to authenticated using (
  bucket_id='chogeumbi' and (storage.foldername(name))[2]='chogeumbi'
  and exists(select 1 from public.chogeumbi_editors where user_id=(select auth.uid()))
);
drop policy if exists chogeumbi_image_delete on storage.objects;
create policy chogeumbi_image_delete on storage.objects for delete to authenticated using (
  bucket_id='chogeumbi' and (storage.foldername(name))[2]='chogeumbi'
  and exists(select 1 from public.chogeumbi_editors where user_id=(select auth.uid()))
);

commit;

-- 관리자 등록 (최초 1회): Authentication > Users에서 관리자 계정을 생성하고,
-- 아래 이메일을 실제 관리자 이메일로 바꾼 뒤 이 문장만 별도로 실행하세요.
-- insert into public.chogeumbi_editors(user_id)
-- select id from auth.users where lower(email)=lower('관리자 이메일')
-- on conflict do nothing;
-- 확인: select u.email from public.chogeumbi_editors e join auth.users u on u.id=e.user_id;
