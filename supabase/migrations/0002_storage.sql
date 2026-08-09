-- =============================================================================
-- Vedette — Storage (documents bucket) + RLS on storage.objects
-- =============================================================================
-- Derived from docs/schema.sql §8 (which documents this as commented reference).
-- Runs after 0001_init.sql, so auth.org_id() / auth.can_write() already exist.
--
-- Bucket 'documents' is PRIVATE. Object path convention:
--   {organization_id}/{engagement_id}/{document_id}/{filename}
-- The first path segment is the tenant; policies compare it to auth.org_id().

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Read: any member of the tenant may read the tenant's objects.
create policy "docs read within tenant" on storage.objects
  for select using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.org_id()::text
  );

-- Insert: same tenant + writer role.
create policy "docs insert within tenant" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.org_id()::text
    and auth.can_write()
  );

-- Update: same tenant + writer role.
create policy "docs update within tenant" on storage.objects
  for update using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.org_id()::text
    and auth.can_write()
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.org_id()::text
    and auth.can_write()
  );

-- Delete: same tenant + writer role.
create policy "docs delete within tenant" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.org_id()::text
    and auth.can_write()
  );
