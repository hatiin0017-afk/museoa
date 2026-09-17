-- 기존 설치용: 이미지 자동 삭제 권한 및 삭제 중 재사용 방지
-- 초금비 프로젝트 SQL Editor에서 한 번 실행하세요.
begin;
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
