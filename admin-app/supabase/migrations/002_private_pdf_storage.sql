insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('quotations','quotations',false,15000000,array['application/pdf']) on conflict(id) do nothing;
create policy employee_pdf_read on storage.objects for select to authenticated using(bucket_id='quotations' and public.is_employee() and exists(select 1 from public.quotation_versions where id::text=(storage.foldername(name))[1] and approved_at is not null));
create policy employee_pdf_upload on storage.objects for insert to authenticated with check(bucket_id='quotations' and public.is_employee() and exists(select 1 from public.quotation_versions where id::text=(storage.foldername(name))[1] and approved_at is not null));
-- No update/delete/public policies: saved PDFs are immutable and private.
