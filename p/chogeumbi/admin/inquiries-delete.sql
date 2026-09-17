-- 등록된 관리자에게 확인한 문의의 삭제 권한만 추가합니다.
begin;
grant delete on public.chogeumbi_inquiries to authenticated;
drop policy if exists chogeumbi_inquiries_delete on public.chogeumbi_inquiries;
create policy chogeumbi_inquiries_delete on public.chogeumbi_inquiries for delete to authenticated
  using (status in ('read','done') and exists(select 1 from public.chogeumbi_editors where user_id=(select auth.uid())));
commit;
