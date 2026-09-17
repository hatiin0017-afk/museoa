-- 준비용 SQL. 이번 작업에서는 실행하지 않았습니다.
-- 새 chogeumbi 공개 이미지 버킷, 지정된 관리자만 업로드.
-- 기존 버킷이 있으면 설정을 변경하지 않습니다.
create table if not exists public.chogeumbi_storage_editors (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.chogeumbi_storage_editors enable row level security;
revoke all on public.chogeumbi_storage_editors from anon, authenticated;
grant select on public.chogeumbi_storage_editors to authenticated;
drop policy if exists chogeumbi_storage_editor_self on public.chogeumbi_storage_editors;
create policy chogeumbi_storage_editor_self on public.chogeumbi_storage_editors
  for select to authenticated using (user_id = (select auth.uid()));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('chogeumbi','chogeumbi',true,8388608,array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

drop policy if exists chogeumbi_image_insert on storage.objects;
create policy chogeumbi_image_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'chogeumbi'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'chogeumbi'
    and exists (select 1 from public.chogeumbi_storage_editors where user_id = (select auth.uid()))
  );
-- 프로젝트의 실제 관리자 UUID를 확인한 뒤 SQL Editor에서 별도로 등록:
-- insert into public.chogeumbi_storage_editors (user_id) values ('관리자 UUID') on conflict do nothing;
-- 이 파일은 업보/일정 DB 테이블이나 다른 프로필 권한을 변경하지 않습니다.
